import { isAbsolute, join, relative, sep } from 'node:path'
import { findProblems, type Problem } from '../../../eslint-plugin/src/raw-values.ts'
import {
  type AnyNode,
  nodes,
  parseScript,
  attributeProblems,
  needsParse,
  parseTemplateCode,
  rawStrings,
  type Tree,
} from './raw.ts'
import {
  type Attr,
  descendants,
  type Element,
  elements,
  lexScript,
  lineCounter,
  MAX_EXPRESSIONS,
  type Lexed,
  parseSfc,
  type Script,
  type Sfc,
  TooDeepError,
} from './scan.ts'

export const checkIds = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'] as const
export type CheckId = (typeof checkIds)[number]
export type Finding = { line: number; message: string }
export type CheckResult = { id: CheckId; pass: boolean; findings: Finding[] }

/** Reads a file the audit looks at besides its input (a Nuxt parent route or layout). */
export type ReadFile = (path: string) => string | undefined

const layouts = new Set([
  'AppShell',
  'ListFilters',
  'ListDetail',
  'Dashboard',
  'FormPage',
  'Settings',
  'DetailPage',
  'Auth',
])

const messages: Record<Problem, string> = {
  rawColor: 'Raw color: use a color token utility.',
  paletteClass: 'Tailwind palette class: use a semantic color utility such as bg-primary.',
  arbitraryValue: 'Arbitrary-value class: use a token utility instead.',
  rawToken: '--h-raw-* is internal to the theme: use a semantic token.',
  darkVariant: 'dark: variant: tokens switch for dark mode, so style once.',
  rawLength: 'Pixel or rem literal: use a token or spacing utility.',
}

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const htmlTags = new Set(
  (
    'a abbr address area article aside audio b base bdi bdo blockquote body br button canvas ' +
    'caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed ' +
    'fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i ' +
    'iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript ' +
    'object ol optgroup option output p param picture pre progress q rp rt ruby s samp script ' +
    'search section select slot small source span strong style sub summary sup table tbody td ' +
    'template textarea tfoot th thead time title tr track u ul var video wbr svg path g circle ' +
    'rect line polyline polygon ellipse defs use symbol text tspan mask clippath lineargradient ' +
    'radialgradient stop pattern image foreignobject desc marker filter'
  ).split(' '),
)

const isNative = (element: Element) => htmlTags.has(element.tag.toLowerCase())

// The name Vue resolves a tag to: `list-filters` and `listFilters` → `ListFilters`, `skeleton`
// → `Skeleton`. HTML and SVG tags stay as they are.
function componentName(tag: string): string {
  if (htmlTags.has(tag.toLowerCase()) && !/[A-Z]/.test(tag[0] ?? '')) return tag
  return tag
    .split('-')
    .map((part) => (part[0] ?? '').toUpperCase() + part.slice(1))
    .join('')
}

// An attribute's name without `:` or `v-bind:`, in kebab case, so `:ariaLabel` matches `aria-label`.
function propName(attr: Attr): string | undefined {
  const name = attr.name.replace(/^(?::|v-bind:)/, '')
  if (/^(?:v-|@|#)/.test(name)) return undefined
  return kebab(name)
}

const isBound = (attr: Attr) => /^(?::|v-bind:)/.test(attr.name)

function attr(element: Element, name: string): Attr | undefined {
  return element.attrs.find((candidate) => propName(candidate) === name)
}

// A static value, or a bound expression that is one string literal.
function stringValue(element: Element, name: string): string | undefined {
  const found = attr(element, name)
  if (!found || found.value === null) return found ? '' : undefined
  if (!isBound(found)) return found.value
  return /^\s*(['"`])([^'"`]*)\1\s*$/.exec(found.value)?.[2]
}

// Whether an attribute is present with a non-empty value, or bound to anything.
function hasAttr(element: Element, name: string): boolean {
  const found = attr(element, name)
  return !!found && (isBound(found) || !!found.value?.trim())
}

const directive = (element: Element, name: string) =>
  element.attrs.find((candidate) => candidate.name === name)

function conditions(element: Element): string[] {
  return ['v-if', 'v-else-if', 'v-show']
    .map((name) => directive(element, name)?.value)
    .filter((value): value is string => !!value)
}

type Context = {
  file: string
  source: string
  sfc: Sfc
  template: Element | null
  scripts: (Script & Lexed & { tree: Tree })[]
  line: (offset: number) => number
  root: string
  readFile: ReadFile
}

// The template's root elements: the children of `<template>`.
function roots(template: Element | null): Element[] {
  return template ? elements(template) : []
}

function hasLayoutRoot(template: Element | null): boolean {
  const top = roots(template)
  return top.length === 1 && layouts.has(componentName(top[0]!.tag))
}

// The layout a Nuxt page asks for with `definePageMeta({ layout })`: undefined when it names
// none, false, a name, or null when the value is something this check can't read (or the
// script doesn't parse).
function pageLayout(tree: Tree): string | false | null | undefined {
  if (!tree) return null
  const call = nodes(tree).find((node) => {
    const callee = node.callee as AnyNode | undefined
    return (
      node.type === 'CallExpression' &&
      callee?.type === 'Identifier' &&
      callee.name === 'definePageMeta'
    )
  })
  if (!call) return undefined
  const meta = (call.arguments as AnyNode[])[0]
  if (meta?.type !== 'ObjectExpression') return null
  // As in JavaScript, a later `layout` key wins over an earlier one.
  let layout: string | false | null | undefined
  for (const property of meta.properties as AnyNode[]) {
    if (property.type === 'SpreadElement') {
      layout = null
      continue
    }
    const key = property.key as AnyNode
    const name = property.computed ? undefined : key.type === 'Identifier' ? key.name : key.value
    if (name !== 'layout') continue
    const value = property.value as AnyNode
    const quasis = value.quasis as AnyNode[] | undefined
    const text =
      value.type === 'Literal'
        ? value.value
        : value.type === 'TemplateLiteral' && (value.expressions as unknown[]).length === 0
          ? (quasis?.[0]?.value as { cooked?: string } | undefined)?.cooked
          : undefined
    if (text === false) layout = false
    else layout = typeof text === 'string' && /^[\w-]+$/.test(text) ? text : null
  }
  return layout
}

function readsLayoutRoot(ctx: Context, path: string): boolean {
  const text = ctx.readFile(path)
  if (text === undefined) return false
  try {
    return hasLayoutRoot(parseSfc(text).template)
  } catch (error) {
    if (error instanceof TooDeepError) return false
    throw error
  }
}

function a1(ctx: Context): Finding[] {
  if (hasLayoutRoot(ctx.template)) return []
  // Only `pages` folders inside the project make a Nuxt route; one above it is someone else's.
  const inside = relative(ctx.root, ctx.file)
  const segments = inside.startsWith('..') || isAbsolute(inside) ? [] : inside.split(sep)
  // The first `pages` folder is Nuxt's; a route folder may be named `pages` too.
  const pages = segments.indexOf('pages')
  const route = pages >= 0 && pages < segments.length - 1
  const looked: string[] = []
  if (route) {
    const parents: string[] = []
    for (let k = pages + 2; k < segments.length; k++) {
      parents.push(join(ctx.root, `${segments.slice(0, k).join(sep)}.vue`))
    }
    if (parents.length) looked.push('parent route')
    if (parents.some((parent) => readsLayoutRoot(ctx, parent))) return []
    // A block that names a layout wins over one that doesn't parse.
    const layouts = ctx.scripts.map((block) => pageLayout(block.tree))
    const layout =
      layouts.find((value) => typeof value === 'string' || value === false) ??
      layouts.find((value) => value === null)
    if (layout !== false && layout !== null) {
      looked.push('Nuxt layout')
      const app = join(ctx.root, ...segments.slice(0, pages))
      if (readsLayoutRoot(ctx, join(app, 'layouts', `${layout ?? 'default'}.vue`))) return []
    }
  }
  const top = roots(ctx.template)
  const where = top[0] ?? ctx.template
  const what = !ctx.template
    ? 'The file has no template'
    : top.length === 0
      ? 'The template has no root element'
      : top.length > 1
        ? 'The template has several root elements'
        : `The root is <${top[0]!.tag}>`
  return [
    {
      line: where ? ctx.line(where.offset) : 1,
      message: `${what}, not a Heart UI layout (app-shell, list-filters, list-detail, dashboard, form-page, settings, detail-page, auth)${looked.length ? `, and no ${looked.join(' or ')} has one` : ''}.`,
    },
  ]
}

const push = (findings: Finding[], line: number, problems: Iterable<Problem>) => {
  for (const problem of problems) findings.push({ line, message: messages[problem] })
}

// The problems of the strings in `tree`, parsed from `code`, which starts at `base` in the file.
// Lines count the newlines inside `code`, which an entity-decoded value keeps.
function treeProblems(
  tree: Tree,
  code: string,
  base: number,
  attribute: string | undefined,
  ctx: Context,
  findings: Finding[],
): void {
  if (!tree) {
    findings.push({
      line: ctx.line(base),
      message: "This code doesn't parse, so its strings can't be checked for raw values.",
    })
    return
  }
  const first = ctx.line(base)
  for (const { offset, problems } of rawStrings(tree, attribute)) {
    const line = first + (code.slice(0, offset).match(/\n/g)?.length ?? 0)
    push(findings, line, problems)
  }
}

const entities: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
}

// Attribute values as Vue reads them: character references decoded.
function decode(value: string): string {
  return value.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (match, dec, hex, name) => {
    const code = dec ? Number(dec) : hex ? Number.parseInt(hex, 16) : undefined
    if (code !== undefined) return code <= 0x10ffff ? String.fromCodePoint(code) : match
    return entities[(name as string).toLowerCase()] ?? match
  })
}

// Patterns (a slot's props, a v-for alias) are read as an arrow's parameters, so their
// defaults land where the rule finds them.
// Each parse that can throw costs Babel a few microseconds; a cap keeps a crafted file bounded.
function expressionParser() {
  let left = MAX_EXPRESSIONS
  return (code: string, statements: boolean): Tree => {
    if (needsParse(code) && --left < 0) throw new TooDeepError('expressions')
    return parseTemplateCode(code, statements)
  }
}

type ParseCode = ReturnType<typeof expressionParser>

function patternProblems(
  pattern: string,
  base: number,
  ctx: Context,
  findings: Finding[],
  parseCode: ParseCode,
) {
  const wrapped = pattern.trim().startsWith('(') ? pattern : `(${pattern})`
  const shift = wrapped === pattern ? 0 : 1
  treeProblems(parseCode(`${wrapped}=>0`, false), wrapped, base - shift, undefined, ctx, findings)
}

function a2(ctx: Context): Finding[] {
  const findings: Finding[] = []
  for (const block of ctx.scripts) {
    treeProblems(block.tree, block.code, block.offset, undefined, ctx, findings)
  }
  const template = ctx.template ?? emptyElement
  const parseCode = expressionParser()
  // Vue compiles nothing inside `v-pre`, and the rule reads nothing there.
  const preformatted = ancestorCheck((element) => !!directive(element, 'v-pre'))
  for (const element of [template, ...descendants(template)]) {
    if (directive(element, 'v-pre') || preformatted(element)) continue
    if (element !== template) {
      for (const item of element.attrs) {
        if (item.value === null) continue
        const value = decode(item.value)
        const base = item.valueOffset
        if (!/^(?:v-|:|@|#|\.)/.test(item.name)) {
          push(findings, ctx.line(base), attributeProblems(value, item.name))
          continue
        }
        if (/^(?:#|v-slot)/.test(item.name)) {
          patternProblems(value, base, ctx, findings, parseCode)
          continue
        }
        if (item.name === 'v-for') {
          const loop = /^([\s\S]*?)(\s(?:in|of)\s)([\s\S]*)$/.exec(value)
          if (!loop) continue
          patternProblems(loop[1]!, base, ctx, findings, parseCode)
          const start = loop[1]!.length + loop[2]!.length
          const source = loop[3]!
          treeProblems(parseCode(source, false), source, base + start, undefined, ctx, findings)
          continue
        }
        // A directive's argument names where its value lands: `:to`, `.style`, `v-model:open`.
        // A dynamic one (`:[name]`) names nothing, as in the rule.
        const argument = /^(?::|\.|v-bind:|@|v-on:|v-[\w-]+:)([^.[][^.]*)/.exec(item.name)?.[1]
        const handler = /^(?:@|v-on:)/.test(item.name)
        treeProblems(parseCode(value, handler), value, base, argument, ctx, findings)
      }
    }
    for (const child of element.children) {
      if (child.kind !== 'text') continue
      for (const expr of child.exprs) {
        const tree = parseCode(expr.code, false)
        treeProblems(tree, expr.code, expr.offset, undefined, ctx, findings)
      }
    }
  }
  for (const style of ctx.sfc.styles) {
    let offset = style.offset
    for (const text of style.code.split('\n')) {
      for (const problem of findProblems(text)) {
        findings.push({ line: ctx.line(offset), message: messages[problem] })
      }
      offset += text.length + 1
    }
  }
  return findings
}

const emptyElement: Element = {
  kind: 'element',
  tag: '#empty',
  attrs: [],
  children: [],
  offset: 0,
  parent: null,
}

const bareTags: Record<string, string> = {
  button: 'Button',
  input: 'Input',
  select: 'Select',
  dialog: 'Dialog',
  table: 'Table',
}

function a3(ctx: Context): Finding[] {
  return descendants(ctx.template ?? emptyElement)
    .filter((element) => Object.hasOwn(bareTags, element.tag))
    .filter(
      (element) =>
        element.tag !== 'input' ||
        !['hidden', 'file'].includes(stringValue(element, 'type')?.toLowerCase() ?? ''),
    )
    .map((element) => ({
      line: ctx.line(element.offset),
      message: `Bare <${element.tag}>: use the Heart UI ${bareTags[element.tag]} component.`,
    }))
}

const isPrimary = (element: Element) =>
  componentName(element.tag) === 'Button' && stringValue(element, 'variant') === 'primary'
const startsView = (element: Element) =>
  element.tag === 'dialog' || /(?:Dialog|Drawer|Sheet)Content$/.test(componentName(element.tag))

// The most primary buttons of `allowed` that show at once in a view: of a v-if/v-else chain only
// one branch renders, and a dialog's content is a view of its own.
function primaryCount(children: Element[], allowed: Set<Element>): number {
  let total = 0
  let chain = 0
  for (const child of children) {
    if (startsView(child)) continue
    const count = (allowed.has(child) ? 1 : 0) + primaryCount(elements(child), allowed)
    if (directive(child, 'v-else-if') || directive(child, 'v-else')) {
      chain = Math.max(chain, count)
    } else {
      total += chain
      chain = count
    }
  }
  return total + chain
}

function viewPrimaries(view: Element): Element[] {
  const found: Element[] = []
  const stack = elements(view).reverse()
  while (stack.length) {
    const next = stack.pop()!
    if (startsView(next)) continue
    if (isPrimary(next)) found.push(next)
    stack.push(...elements(next).reverse())
  }
  return found
}

function a4(ctx: Context): Finding[] {
  const views = [
    ...(ctx.template ? [ctx.template] : []),
    ...descendants(ctx.template ?? emptyElement).filter(startsView),
  ]
  return views.flatMap((view) => {
    const primaries = viewPrimaries(view)
    const count = primaryCount(elements(view), new Set(primaries))
    if (count < 2) return []
    // Point at the first button that shows together with an earlier one. The count only grows
    // with the prefix, so a binary search keeps this at O(n log n) on a long v-if chain.
    let low = 2
    let high = primaries.length
    while (low < high) {
      const mid = (low + high) >> 1
      if (primaryCount(elements(view), new Set(primaries.slice(0, mid))) >= 2) high = mid
      else low = mid + 1
    }
    return [
      {
        line: ctx.line(primaries[low - 1]!.offset),
        message: `${count} primary buttons in one view: keep one and make the rest secondary or ghost.`,
      },
    ]
  })
}

const listContainer =
  /^(?:nav|\w*Menu(?:Content|Group|List|Sub|SubContent)?|\w*(?:Select|Combobox)(?:Content|Group|List)?|TabsList|Breadcrumb(?:List)?|Pagination(?:List|Content)?|RadioGroup|ToggleGroup)$/

// A loop over a number, an array literal or a `const` array in the script renders fixed content,
// and a loop of controls renders choices, not data.
function isDataRegion(element: Element, constArrays: Set<string>): boolean {
  if (componentName(element.tag) === 'Table' || element.tag === 'table') return true
  const loop = directive(element, 'v-for')?.value
  if (!loop) return false
  const source = /\s(?:in|of)\s+([\s\S]*)$/.exec(loop)?.[1]?.trim() ?? ''
  if (/^\d+$/.test(source) || source.startsWith('[') || constArrays.has(source)) return false
  if (controls.has(componentName(element.tag))) return false
  return !inListContainer(element)
}

// Whether an ancestor passes `test`, cached per element so each check walks the tree once.
function ancestorCheck(test: (element: Element) => boolean): (element: Element) => boolean {
  const cache = new WeakMap<Element, boolean>()
  const has = (element: Element): boolean => {
    const parent = element.parent
    if (!parent) return false
    let known = cache.get(parent)
    if (known === undefined) {
      known = test(parent) || has(parent)
      cache.set(parent, known)
    }
    return known
  }
  return has
}

const inListContainer = ancestorCheck((element) => listContainer.test(componentName(element.tag)))
// A loop of these renders choices, not data.
const controls = new Set([
  'Button',
  'button',
  'TabsTrigger',
  'DropdownMenuItem',
  'DialogTrigger',
  'DropdownMenuTrigger',
  'TooltipTrigger',
  'PopoverTrigger',
])

const stateSignals = {
  loading: {
    condition: /loading|pending|fetching/i,
    tag: /Skeleton/,
    props: ['loading', 'pending'],
  },
  error: { condition: /error|failed/i, tag: /ErrorState$/, props: ['error'] },
  empty: {
    condition: /\.length\b|empty|noresults/i,
    tag: /(?:FirstRun|NoResults|Empty)State$/,
    props: [],
  },
}

function a5(ctx: Context): Finding[] {
  const all = descendants(ctx.template ?? emptyElement)
  const constArrays = new Set<string>()
  for (const block of ctx.scripts) {
    for (const node of block.tree ? nodes(block.tree) : []) {
      if (node.type !== 'VariableDeclarator' || (node.parent as AnyNode | null)?.kind !== 'const') {
        continue
      }
      let init = node.init as AnyNode | null
      while (init && /^TS(?:As|Satisfies|NonNull)Expression$/.test(init.type)) {
        init = init.expression as AnyNode
      }
      const id = node.id as AnyNode
      if (init?.type === 'ArrayExpression' && id.type === 'Identifier') {
        constArrays.add(id.name as string)
      }
    }
  }
  const inData = (element: Element) => isDataRegion(element, constArrays)
  const underData = ancestorCheck(inData)
  const region = all.find((element) => inData(element) && !underData(element))
  if (!region) return []
  // A bound `:loading` or `:error` counts only where it reaches the data: on the region or a
  // wrapper of it, not on a save button elsewhere.
  const holders = [region]
  for (let parent = region.parent; parent; parent = parent.parent) holders.push(parent)
  const busy = holders.some((element) => {
    const value = attr(element, 'aria-busy')
    if (!value) return false
    const text = (value.value ?? '').trim()
    return !/^(?:false|'false'|"false")$/.test(text)
  })
  const missing = Object.entries(stateSignals)
    .filter(
      ([name, signal]) =>
        !(name === 'loading' && busy) &&
        !all.some(
          (element) =>
            conditions(element).some((condition) => signal.condition.test(condition)) ||
            signal.tag.test(componentName(element.tag)),
        ) &&
        !holders.some((holder) =>
          signal.props.some((prop) => {
            const found = attr(holder, prop)
            return !!found && isBound(found)
          }),
        ),
    )
    .map(([name]) => name)
  if (!missing.length) return []
  const list =
    missing.length === 1
      ? missing[0]
      : `${missing.slice(0, -1).join(', ')} or ${missing[missing.length - 1]}`
  return [
    {
      line: ctx.line(region.offset),
      message: `Data region with no ${list} state: render every state (layout rules, States).`,
    },
  ]
}

function a6(ctx: Context): Finding[] {
  return ctx.scripts.flatMap((block) =>
    block.imports
      .filter((literal) => literal.value === 'reka-ui' || literal.value.startsWith('reka-ui/'))
      .map((literal) => ({
        line: ctx.line(block.offset + literal.offset),
        message: 'Imports reka-ui in app code: use the Heart UI components instead.',
      })),
  )
}

const namedByContent = new Set([
  'Button',
  'button',
  'RouterLink',
  'NuxtLink',
  'TabsTrigger',
  'DropdownMenuItem',
  'DialogTrigger',
  'DropdownMenuTrigger',
  'TooltipTrigger',
  'PopoverTrigger',
])
const fields = new Set(['Input', 'Textarea', 'SelectTrigger', 'input', 'textarea', 'select'])
const labelledByContent = new Set(['Checkbox', 'Switch', 'RadioGroupItem'])
const isLabel = (element: Element) =>
  element.tag === 'label' || componentName(element.tag) === 'Label'

function hasText(element: Element): boolean {
  if (directive(element, 'v-text') || directive(element, 'v-html')) return true
  return element.children.some((child) => {
    if (child.kind === 'text') return child.exprs.length > 0 || child.text.trim() !== ''
    if (child.tag === 'slot') return true
    if (/Icon$/.test(componentName(child.tag)) || child.tag === 'svg') return false
    if (stringValue(child, 'aria-hidden') === 'true') return false
    if (child.tag === 'img') return !!stringValue(child, 'alt')?.trim()
    if (!isNative(child) && !elements(child).length && !child.children.length) return true
    return hasText(child)
  })
}

const hasOwnName = (element: Element) =>
  ['aria-label', 'aria-labelledby', 'title'].some((name) => hasAttr(element, name)) ||
  !!directive(element, 'v-bind')

function a7(ctx: Context): Finding[] {
  const all = descendants(ctx.template ?? emptyElement)
  const labelFor = new Set(
    all.filter(isLabel).flatMap((label) => {
      const found = attr(label, 'for')
      return found?.value ? [`${isBound(found) ? ':' : ''}${found.value.trim()}`] : []
    }),
  )
  const labelled = (element: Element) => {
    const id = attr(element, 'id')
    return (
      (!!id?.value && labelFor.has(`${isBound(id) ? ':' : ''}${id.value.trim()}`)) ||
      inLabel(element)
    )
  }
  const inLabel = ancestorCheck(isLabel)
  const findings: Finding[] = []
  for (const element of all) {
    const name = isNative(element) ? element.tag : componentName(element.tag)
    if (attr(element, 'as-child') || hasOwnName(element)) continue
    const link = element.tag === 'a' && hasAttr(element, 'href')
    let named = true
    let need = 'add text or aria-label'
    if (namedByContent.has(name) || link) named = hasText(element)
    else if (labelledByContent.has(name)) named = hasText(element) || labelled(element)
    else if (fields.has(name)) {
      if (element.tag === 'input' && stringValue(element, 'type') === 'hidden') continue
      named = labelled(element)
      need = 'pair it with a Label (for → id) or add aria-label'
    }
    if (!named) {
      findings.push({
        line: ctx.line(element.offset),
        message: `<${element.tag}> has no accessible name: ${need}.`,
      })
    }
  }
  return findings
}

const isModal = (element: Element) =>
  element.tag === 'dialog' || /Dialog$/.test(componentName(element.tag))

function a8(ctx: Context): Finding[] {
  const inModal = ancestorCheck(isModal)
  return descendants(ctx.template ?? emptyElement)
    .filter((element) => isModal(element) && inModal(element))
    .map((element) => ({
      line: ctx.line(element.offset),
      message: `<${element.tag}> sits inside another modal: never open a modal from a modal.`,
    }))
}

const runners: Record<CheckId, (ctx: Context) => Finding[]> = {
  A1: a1,
  A2: a2,
  A3: a3,
  A4: a4,
  A5: a5,
  A6: a6,
  A7: a7,
  A8: a8,
}

/** Whether `source`'s template, if any, is HTML (not Pug or another language). */
export function hasHtmlTemplate(source: string): boolean {
  const lang = parseSfc(source).template?.attrs.find((item) => item.name === 'lang')?.value
  return lang === undefined || lang === null || lang.toLowerCase() === 'html'
}

export type AuditOptions = {
  /** Audit as a single-file component; otherwise as a script, with only A2 and A6. */
  vue: boolean
  /** The project folder: Nuxt routes are looked up only inside it. */
  root: string
  readFile: ReadFile
}

/**
 * Runs A1 to A8 on one file; a script passes the checks that read markup. Throws TooDeepError
 * when the file nests past MAX_DEPTH.
 */
export function auditSource(file: string, source: string, options: AuditOptions): CheckResult[] {
  const { vue, root, readFile } = options
  const sfc: Sfc = vue ? parseSfc(source) : { template: null, scripts: [], styles: [] }
  const scripts = vue ? sfc.scripts : [{ code: source, offset: 0 }]
  const ctx: Context = {
    file,
    source,
    sfc,
    template: sfc.template,
    scripts: scripts.map((block) => {
      const lexed = lexScript(block.code)
      const jsx = /\.[jt]sx$/i.test(file) || /^[jt]sx$/i.test((block as Script).lang ?? '')
      return { ...block, ...lexed, tree: parseScript(block.code, jsx) }
    }),
    line: lineCounter(source),
    root,
    readFile,
  }
  const scriptChecks: CheckId[] = ['A2', 'A6']
  return checkIds.map((id) => {
    const findings = vue || scriptChecks.includes(id) ? runners[id](ctx) : []
    findings.sort((a, b) => a.line - b.line)
    return { id, pass: findings.length === 0, findings }
  })
}
