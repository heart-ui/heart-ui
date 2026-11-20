export type Attr = { name: string; value: string | null; offset: number; valueOffset: number }
export type Text = { kind: 'text'; text: string; offset: number; exprs: Code[] }
export type Element = {
  kind: 'element'
  tag: string
  attrs: Attr[]
  children: Node[]
  offset: number
  parent: Element | null
  /** The content of a raw-text element (`script`, `style`) and where it starts. */
  raw?: Code
}
export type Node = Element | Text
/** A piece of source and the offset where it starts. */
export type Code = { code: string; offset: number }

/** How deep markup or template literals may nest before a file is refused as unauditable. */
export const MAX_DEPTH = 256

/** How many template expressions one file may hold before it is refused as unauditable. */
export const MAX_EXPRESSIONS = 20_000

/**
 * Thrown when a file can't be audited safely: its markup or template literals nest past
 * MAX_DEPTH (`markup`), its code is too deep for the parser's stack (`code`), or it holds more
 * than MAX_EXPRESSIONS template expressions (`expressions`), or its block comments would
 * cost the parser too long (`comments`).
 */
export class TooDeepError extends Error {
  readonly reason: 'markup' | 'code' | 'expressions' | 'comments'

  constructor(reason: 'markup' | 'code' | 'expressions' | 'comments' = 'markup') {
    super(reason)
    this.reason = reason
  }
}

const voidTags = new Set(
  'area base br col embed hr img input link meta param source track wbr'.split(' '),
)
const rawTags = new Set(['script', 'style'])

/**
 * Parses HTML-like markup (a whole SFC, or a template) into a tree. It never throws: an unclosed
 * tag runs to the end of the file and a stray closing tag is ignored.
 */
export function parseMarkup(source: string): Element {
  const root: Element = {
    kind: 'element',
    tag: '#root',
    attrs: [],
    children: [],
    offset: 0,
    parent: null,
  }
  const stack: Element[] = [root]
  const n = source.length
  let i = 0
  let text: Text | null = null

  const top = () => stack[stack.length - 1] ?? root
  const isLetter = (char: string | undefined) => char !== undefined && /[A-Za-z]/.test(char)

  while (i < n) {
    if (source.startsWith('<!--', i)) {
      const end = source.indexOf('-->', i + 4)
      i = end < 0 ? n : end + 3
      text = null
      continue
    }
    if (source[i] === '<' && source[i + 1] === '/' && isLetter(source[i + 2])) {
      const name = /^[^\s/>]+/.exec(source.slice(i + 2))?.[0] ?? ''
      const end = source.indexOf('>', i)
      i = end < 0 ? n : end + 1
      text = null
      for (let depth = stack.length - 1; depth > 0; depth--) {
        if (stack[depth]?.tag === name) {
          stack.length = depth
          break
        }
      }
      continue
    }
    if (source[i] === '<' && isLetter(source[i + 1])) {
      text = null
      const element: Element = {
        kind: 'element',
        tag: /^[^\s/>]+/.exec(source.slice(i + 1))?.[0] ?? '',
        attrs: [],
        children: [],
        offset: i,
        parent: top(),
      }
      top().children.push(element)
      i += 1 + element.tag.length
      let selfClosing = false
      while (i < n) {
        while (i < n && /\s/.test(source[i] ?? '')) i++
        if (source[i] === '>') {
          i++
          break
        }
        if (source.startsWith('/>', i)) {
          selfClosing = true
          i += 2
          break
        }
        const name = /^[^\s=>/]+/.exec(source.slice(i, i + 200))?.[0]
        if (!name) {
          i++
          continue
        }
        const attr: Attr = { name, value: null, offset: i, valueOffset: i }
        i += name.length
        let j = i
        while (j < n && /\s/.test(source[j] ?? '')) j++
        if (source[j] === '=') {
          j++
          while (j < n && /\s/.test(source[j] ?? '')) j++
          const quote = source[j]
          if (quote === '"' || quote === "'") {
            const close = source.indexOf(quote, j + 1)
            const end = close < 0 ? n : close
            attr.value = source.slice(j + 1, end)
            attr.valueOffset = j + 1
            i = close < 0 ? n : close + 1
          } else {
            const value = /^[^\s>]*/.exec(source.slice(j))?.[0] ?? ''
            attr.value = value
            attr.valueOffset = j
            i = j + value.length
          }
        }
        element.attrs.push(attr)
      }
      const tag = element.tag.toLowerCase()
      if (rawTags.has(tag) && !selfClosing) {
        // A case-insensitive search in the source itself: lowercasing can change the length.
        const closing = new RegExp(`</${tag}`, 'gi')
        closing.lastIndex = i
        const close = closing.exec(source)?.index ?? -1
        const end = close < 0 ? n : close
        element.raw = { code: source.slice(i, end), offset: i }
        const after = close < 0 ? -1 : source.indexOf('>', close)
        i = after < 0 ? n : after + 1
      } else if (!selfClosing && !voidTags.has(tag)) {
        if (stack.length > MAX_DEPTH) throw new TooDeepError()
        stack.push(element)
      }
      continue
    }
    if (!text) {
      text = { kind: 'text', text: '', offset: i, exprs: [] }
      top().children.push(text)
    }
    if (source.startsWith('{{', i)) {
      const close = source.indexOf('}}', i + 2)
      const end = close < 0 ? n : close
      text.exprs.push({ code: source.slice(i + 2, end), offset: i + 2 })
      text.text += source.slice(i, close < 0 ? n : close + 2)
      i = close < 0 ? n : close + 2
      continue
    }
    text.text += source[i]
    i++
  }
  return root
}

/** The element children of `element`. */
export function elements(element: Element): Element[] {
  return element.children.filter((child): child is Element => child.kind === 'element')
}

/** Every element below `element`, in document order. */
export function descendants(element: Element): Element[] {
  const found: Element[] = []
  const stack = elements(element).reverse()
  while (stack.length) {
    const next = stack.pop()!
    found.push(next)
    stack.push(...elements(next).reverse())
  }
  return found
}

/** A script block and its `lang` (`ts`, `tsx`, …). */
export type Script = Code & { lang?: string }
export type Sfc = { template: Element | null; scripts: Script[]; styles: Code[] }

/** The blocks of a single-file component. */
export function parseSfc(source: string): Sfc {
  const top = elements(parseMarkup(source))
  const raw = (tag: string) =>
    top
      .filter((block) => block.tag === tag && block.raw)
      .map((block) => ({
        ...(block.raw as Code),
        lang: block.attrs.find((item) => item.name === 'lang')?.value ?? undefined,
      }))
  return {
    template: top.find((block) => block.tag === 'template') ?? null,
    scripts: raw('script'),
    styles: raw('style'),
  }
}

export type Literal = {
  value: string
  /** The offset of the opening quote. */
  offset: number
  /** The offset just past the closing quote. */
  end: number
  /** The text parts of a template literal, without its expressions. */
  parts?: string[]
}
export type Lexed = { strings: Literal[]; imports: Literal[]; blanked: string }

const regexAfter = /[(,=:[!&|?{};+\-*%<>~^]/

/**
 * The string literals and module specifiers in JavaScript or TypeScript. Comments are blanked
 * (newlines kept) so a commented-out import doesn't count. Unterminated strings end the scan.
 */
export function lexScript(code: string): Lexed {
  const n = code.length
  const strings: Literal[] = []
  const blanked = code.split('')
  const blank = (from: number, to: number) => {
    for (let k = from; k < to; k++) if (blanked[k] !== '\n') blanked[k] = ' '
  }

  function quoted(start: number): number {
    const quote = code[start]
    let j = start + 1
    let value = ''
    while (j < n && code[j] !== quote && code[j] !== '\n') {
      if (code[j] === '\\') {
        value += code[j + 1] ?? ''
        j += 2
      } else {
        value += code[j]
        j++
      }
    }
    const end = Math.min(j + 1, n)
    strings.push({ value, offset: start, end })
    return end
  }

  function template(start: number, depth: number): number {
    if (depth > MAX_DEPTH) throw new TooDeepError()
    const parts: string[] = []
    let current = ''
    let j = start + 1
    while (j < n) {
      if (code[j] === '\\') {
        current += code[j + 1] ?? ''
        j += 2
      } else if (code[j] === '`') {
        j++
        break
      } else if (code[j] === '$' && code[j + 1] === '{') {
        parts.push(current)
        current = ''
        j = scan(j + 2, true, depth + 1)
      } else {
        current += code[j]
        j++
      }
    }
    parts.push(current)
    strings.push({ value: parts.join('x'), offset: start, end: j, parts })
    return j
  }

  function regex(start: number): number {
    let j = start + 1
    let inClass = false
    while (j < n && code[j] !== '\n') {
      const char = code[j]
      if (char === '\\') j++
      else if (char === '[') inClass = true
      else if (char === ']') inClass = false
      else if (char === '/' && !inClass) return j + 1
      j++
    }
    return j
  }

  function scan(start: number, untilBrace: boolean, depth: number): number {
    let braces = 0
    let last = ''
    let i = start
    while (i < n) {
      const char = code[i] ?? ''
      if (char === '/' && code[i + 1] === '/') {
        const end = code.indexOf('\n', i)
        const stop = end < 0 ? n : end
        blank(i, stop)
        i = stop
        continue
      }
      if (char === '/' && code[i + 1] === '*') {
        const end = code.indexOf('*/', i + 2)
        const stop = end < 0 ? n : end + 2
        blank(i, stop)
        i = stop
        continue
      }
      if (char === '"' || char === "'") {
        i = quoted(i)
        last = 'a'
        continue
      }
      if (char === '`') {
        i = template(i, depth)
        last = 'a'
        continue
      }
      if (char === '/' && (last === '' || regexAfter.test(last))) {
        i = regex(i)
        last = 'a'
        continue
      }
      if (char === '{') braces++
      if (char === '}') {
        if (untilBrace && braces === 0) return i + 1
        braces--
      }
      if (!/\s/.test(char)) last = /[\w$]/.test(char) ? 'a' : char
      i++
    }
    return n
  }

  scan(0, false, 0)
  const text = blanked.join('')
  // A specifier is the string right after `from`, `import`, `import(` or `require(`. Each string
  // walks back only over the whitespace before it, so the scan stays linear.
  const before = (index: number) => {
    let j = index - 1
    while (j >= 0 && /\s/.test(text[j] ?? '')) j--
    return j
  }
  const wordEndingAt = (j: number) => /[\w$]*$/.exec(text.slice(Math.max(0, j - 15), j + 1))?.[0]
  const isSpecifier = (literal: Literal) => {
    let j = before(literal.offset)
    if (text[j] === '(') {
      j = before(j)
      return ['import', 'require'].includes(wordEndingAt(j) ?? '')
    }
    return ['from', 'import'].includes(wordEndingAt(j) ?? '')
  }
  return {
    strings: strings.filter((literal) => !isSpecifier(literal)),
    imports: strings.filter(isSpecifier),
    blanked: text,
  }
}

/** Maps an offset to its 1-based line. */
export function lineCounter(source: string): (offset: number) => number {
  const starts = [0]
  for (let i = 0; i < source.length; i++) if (source[i] === '\n') starts.push(i + 1)
  return (offset) => {
    let low = 0
    let high = starts.length - 1
    while (low < high) {
      const mid = (low + high + 1) >> 1
      if ((starts[mid] ?? 0) <= offset) low = mid
      else high = mid - 1
    }
    return low + 1
  }
}
