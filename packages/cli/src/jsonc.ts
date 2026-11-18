/** Parses JSON with comments and trailing commas, as `tsconfig.json` allows. */
export function parseJsonc(text: string): unknown {
  return JSON.parse(withoutTrailingCommas(withoutComments(text)))
}

/** Copies a string literal starting at `start` and returns the index after it. */
function skipString(text: string, start: number): number {
  let i = start + 1
  while (i < text.length && text[i] !== '"') i += text[i] === '\\' ? 2 : 1
  return i + 1
}

function withoutComments(text: string): string {
  let out = ''
  let i = 0
  while (i < text.length) {
    const char = text[i]
    const next = text[i + 1]
    if (char === '"') {
      const end = skipString(text, i)
      out += text.slice(i, end)
      i = end
    } else if (char === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++
    } else if (char === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2)
      i = end === -1 ? text.length : end + 2
      out += ' '
    } else {
      out += char
      i++
    }
  }
  return out
}

function withoutTrailingCommas(text: string): string {
  let out = ''
  let i = 0
  while (i < text.length) {
    const char = text[i]
    if (char === '"') {
      const end = skipString(text, i)
      out += text.slice(i, end)
      i = end
      continue
    }
    if (char === ',') {
      let j = i + 1
      while (j < text.length && /\s/.test(text[j] ?? '')) j++
      if (text[j] === '}' || text[j] === ']') {
        i++
        continue
      }
    }
    out += char
    i++
  }
  return out
}
