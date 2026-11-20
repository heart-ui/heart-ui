import { namedColors } from './named-colors.ts'

export type Problem =
  'rawColor' | 'paletteClass' | 'arbitraryValue' | 'rawToken' | 'darkVariant' | 'rawLength'

const paletteColors =
  'slate|gray|zinc|neutral|stone|mauve|olive|mist|taupe|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const colorUtilities =
  'bg|text|border(?:-[xytrblse])?|ring|ring-offset|outline|fill|stroke|from|via|to|decoration|divide|placeholder|caret|accent|shadow|inset-shadow|inset-ring|drop-shadow|text-shadow'
const palette = new RegExp(
  `^-?(?:${colorUtilities})-(?:(?:${paletteColors})-(?:50|[1-9]00|950)|white|black)(?:\\/\\S+)?$`,
)

// `w-[13px]`, `bg-(color:--brand)`, `bg-primary/[0.5]` and arbitrary properties like `[mask-type:luminance]`.
const arbitrary = new RegExp(
  [
    '^-?[a-z][\\w-]*-(?:\\[.*\\]|\\(.*\\))(?:\\/\\S+)?$',
    '^\\[[a-z-]+:.+\\]$',
    // An arbitrary opacity on a color utility: `bg-primary/[0.5]`, not a route like `blog-posts/[slug]`.
    `^-?(?:${colorUtilities})-[\\w-]+\\/(?:\\[.*\\]|\\(.*\\))$`,
  ].join('|'),
)

// `dark:`, `not-dark:`, `group-dark:`, `.dark` selectors, a dark theme attribute and the media query.
const darkSelector =
  /^(?:not-|group-|peer-|in-|has-)?dark(?:\/[\w-]+)?$|\.dark(?![a-z0-9-])|theme=["']?dark["']?\]|prefers-color-scheme:\s*dark/

const hex = /(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/i
const fragmentReference = /url\(\s*['"]?\s*#[^)]*\)/gi
const colorFunction =
  /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(|\bcolor\(\s*(?:srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65|from|--)/i
const rawToken = /--h-raw-/
// `\d+(?:\.\d*)?`, not `\d+\.?\d*`: one way to split a run of digits keeps the scan linear.
const length = /(?<![\w.-])-?(?:\d+(?:\.\d*)?|\.\d+)(?:px|rem)(?![\w-])/i
const declaration = /(?:^|[;{\s])(--[\w-]+|[a-z-]+)\s*:\s*([^;}]+)/gi

/** Whether a CSS property, in kebab case, can carry a color. Custom properties can carry anything. */
export function isColorProperty(property: string) {
  return (
    property.startsWith('--') ||
    /color|background|border|outline|fill|stroke|shadow|filter|text-decoration|column-rule/.test(
      property,
    )
  )
}

/** Whether a CSS value names a color by keyword. A `var()` fallback counts; the variable name doesn't. */
export function hasNamedColor(value: string) {
  return value
    .replace(/var\(\s*--[\w-]+\s*,?/g, ' ')
    .toLowerCase()
    .split(/[\s,()/]+/)
    .some((word) => namedColors.has(word))
}

function splitVariants(token: string) {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < token.length; i++) {
    const char = token[i]
    if (char === '[' || char === '(') depth++
    else if (char === ']' || char === ')') depth--
    else if (char === ':' && depth === 0) {
      parts.push(token.slice(start, i))
      start = i + 1
    }
  }
  parts.push(token.slice(start))
  return parts
}

function classProblem(token: string): Problem | undefined {
  const parts = splitVariants(token)
  const utility = parts.pop()!.replace(/^!|!$/g, '')
  // `dark:`, `not-dark:`, `[.dark_&]:` and `group-[.dark]:` all style one mode.
  if (parts.some((variant) => darkSelector.test(variant))) return 'darkVariant'
  if (arbitrary.test(utility)) return 'arbitraryValue'
  if (palette.test(utility)) return 'paletteClass'
  return undefined
}

export type CheckOptions = {
  /** Read the string as a class list too. Off for `style` and other non-class attributes. */
  classes?: boolean
  /** Hex is an anchor or id here (`href="#add"`), not a color. */
  skipHex?: boolean
}

/** The raw-value problems in one string, each kind once. */
export function findProblems(value: string, options: CheckOptions = {}): Problem[] {
  const problems = new Set<Problem>()
  let rest = value
  if (options.classes) {
    // The tokens without a class problem, joined once: replacing each bad token in turn is
    // quadratic on a long class list.
    const kept: string[] = []
    for (const token of value.split(/\s+/)) {
      const problem = token ? classProblem(token) : undefined
      if (problem) problems.add(problem)
      else kept.push(token)
    }
    rest = kept.join(' ')
  }
  if (rawToken.test(rest)) problems.add('rawToken')
  // light-dark() styles each mode separately, which tokens own; color-mix() is fine on tokens alone.
  if (/\blight-dark\(/i.test(rest)) problems.add('darkVariant')
  else if (/\bcolor-mix\(/i.test(rest) && hasNamedColor(rest)) problems.add('rawColor')
  const withoutFragments = rest.replace(fragmentReference, ' ')
  if (colorFunction.test(rest) || (!options.skipHex && hex.test(withoutFragments))) {
    problems.add('rawColor')
  }
  for (const [, property, propertyValue] of rest.matchAll(declaration)) {
    if (isColorProperty(property!.toLowerCase()) && hasNamedColor(propertyValue!)) {
      problems.add('rawColor')
    }
  }
  if (length.test(rest)) problems.add('rawLength')
  return [...problems]
}

/**
 * Where a string lands, as no-raw-values reads it: the attribute it is bound to, the nearest
 * property or variable on the way there (past a runtime prop's `default`), whether any name on
 * the way is a class name, and whether it is an argument of a class helper such as `cn()`.
 */
export type Landing = {
  attribute?: string
  property?: string
  classProperty?: boolean
  classHelper?: boolean
}

/** Attributes and properties where hex is an anchor or id (`href="#add"`), not a color. */
export const hexFreeAttributes = new Set(['href', 'xlink:href', 'to', 'id', 'for'])
export const hexFreeProperties = new Set(['href', 'hash', 'id'])
/** Nodes a value passes through unchanged on its way to the attribute or property that uses it. */
export const passThrough = new Set([
  'ConditionalExpression',
  'LogicalExpression',
  'ArrayExpression',
  'ObjectExpression',
  'TemplateLiteral',
  'ChainExpression',
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSNonNullExpression',
  'TSTypeAssertion',
])
/** Calls whose string arguments are class lists. */
export const classHelpers = new Set(['cn', 'clsx', 'cva', 'cx', 'tv', 'twMerge', 'twJoin'])

/** A camelCase name in kebab case. */
export function kebab(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** Whether an attribute or property name holds classes (`class`, `activeClass`, `ui`). */
export function isClassName(name: string) {
  return /^(?:class|classes|class-name|ui)$|-class(?:es)?$/.test(name)
}

/** Whether the string lands in a class list. */
export function inClassLanding(landing: Landing) {
  if (landing.classHelper || landing.classProperty) return true
  return landing.attribute !== undefined && isClassName(kebab(landing.attribute))
}

// CLAUDE.md allows English text only in `*Label` props: those carry words, not styles.
/** Whether the string lands in a `*Label` prop or property. */
export function isLabelLanding(landing: Landing) {
  const name = landing.property ?? landing.attribute
  return name !== undefined && (/[a-z0-9]Label$/.test(name) || /-label$/.test(name))
}

/** The raw-value problems in `text` where it lands; `classKey` for a key of a class map. */
export function problemsWhere(text: string, landing: Landing, classKey = false): Set<Problem> {
  if (isLabelLanding(landing)) return new Set()
  const attribute = landing.attribute === undefined ? undefined : kebab(landing.attribute)
  const classes = classKey || attribute === undefined || inClassLanding(landing)
  const skipHex =
    landing.property !== undefined
      ? hexFreeProperties.has(kebab(landing.property))
      : attribute !== undefined && hexFreeAttributes.has(attribute)
  const problems = new Set(findProblems(text, { classes, skipHex }))
  const nearest = landing.property ?? landing.attribute
  const colorName = nearest === undefined ? undefined : kebab(nearest)
  if (colorName && !isClassName(colorName) && isColorProperty(colorName) && hasNamedColor(text)) {
    problems.add('rawColor')
  }
  return problems
}
