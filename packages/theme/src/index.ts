import { format, parseColor } from './color'
import { buildScales, resolveSemantic, scaleNames, steps, type ContrastReport } from './semantic'

export type { Adjustment, ContrastCheck, ContrastReport } from './semantic'

/** A theme, fully described (docs/tokens.md, Knobs). */
export type Knobs = {
  name: string
  primary: string
  neutral: { hue: number; chroma: number }
  radius: number
  density: 'compact' | 'default' | 'comfortable'
  font: { sans: string; mono: string }
  shadow: 'none' | 'soft' | 'crisp'
}

const densities = { compact: 0.875, default: 1, comfortable: 1.125 }
const controls = {
  compact: [1.75, 2, 2.25],
  default: [2, 2.25, 2.5],
  comfortable: [2.25, 2.5, 2.75],
}
const shadows = {
  none: ['none', 'none', 'none'],
  soft: [
    '0 1px 2px 0 oklch(0 0 0 / 0.05)',
    '0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1)',
    '0 10px 15px -3px oklch(0 0 0 / 0.1), 0 4px 6px -4px oklch(0 0 0 / 0.1)',
  ],
  crisp: [
    '0 1px 1px 0 oklch(0 0 0 / 0.12)',
    '0 2px 3px 0 oklch(0 0 0 / 0.16)',
    '0 4px 6px 0 oklch(0 0 0 / 0.2)',
  ],
}
const sizes = ['sm', 'md', 'lg'] as const
const durations = { fast: 100, normal: 200, slow: 300 }

// Comma-separated family names, bare or in matching quotes: nothing that can end the value.
const family = String.raw`(?:[A-Za-z0-9_-]+(?: [A-Za-z0-9_-]+)*|"[A-Za-z0-9 _.-]+"|'[A-Za-z0-9 _.-]+')`
const fontStack = new RegExp(`^${family}(?:\\s*,\\s*${family})*$`)

function fail(knob: string, rule: string): never {
  throw new Error(`theme knob ${knob}: ${rule}`)
}

const inRange = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max

// Knob files may come from users (the customizer), and font stacks are written into CSS.
function check(knobs: Knobs) {
  if (typeof knobs !== 'object' || knobs === null) fail('file', 'must be an object')
  if (typeof knobs.name !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(knobs.name)) {
    fail('name', 'must be kebab-case, like "default"')
  }
  const primary = typeof knobs.primary === 'string' ? parseColor(knobs.primary) : undefined
  if (!primary) fail('primary', 'must be an opaque CSS color')
  const neutral = knobs.neutral as Partial<Knobs['neutral']> | undefined
  if (!inRange(neutral?.hue, 0, 360) || !inRange(neutral?.chroma, 0, 0.04)) {
    fail('neutral', 'needs hue 0-360 and chroma 0-0.04')
  }
  if (!inRange(knobs.radius, 0, 1)) fail('radius', 'must be a number of rem from 0 to 1')
  if (!Object.hasOwn(densities, knobs.density))
    fail('density', 'must be compact, default or comfortable')
  if (!Object.hasOwn(shadows, knobs.shadow)) fail('shadow', 'must be none, soft or crisp')
  const font = knobs.font as Partial<Knobs['font']> | undefined
  for (const stack of [font?.sans, font?.mono]) {
    if (typeof stack !== 'string' || !fontStack.test(stack.trim())) {
      fail('font', 'needs sans and mono stacks of family names, quoted names in matching quotes')
    }
  }
  return primary
}

const rem = (value: number) => `${Number(value.toFixed(4))}rem`

function resolve(knobs: Knobs) {
  const primary = check(knobs)
  const scales = buildScales(primary, knobs.neutral)
  return { scales, ...resolveSemantic(scales) }
}

/** Checks every foreground against its backgrounds in light and dark, after the generator's moves. */
export function checkContrast(knobs: Knobs): ContrastReport {
  return resolve(knobs).report
}

/** Returns tokens.css for the knobs. */
export function generateTheme(knobs: Knobs): string {
  const { scales, values } = resolve(knobs)
  const density = densities[knobs.density]
  const tokens = new Map<string, string>()
  for (const scale of scaleNames) {
    steps.forEach((step, at) => tokens.set(`raw-${scale}-${step}`, format(scales[scale][at]!)))
  }
  for (const [token, value] of values.light) tokens.set(token, value)
  sizes.forEach((size, at) => tokens.set(`radius-${size}`, rem(knobs.radius * [0.5, 1, 1.5][at]!)))
  tokens.set('radius-full', '9999px')
  sizes.forEach((size, at) => tokens.set(`control-${size}`, rem(controls[knobs.density][at]!)))
  sizes.forEach((size, at) => tokens.set(`control-px-${size}`, rem([0.5, 0.75, 1][at]! * density)))
  sizes.forEach((size, at) => tokens.set(`gap-${size}`, rem([0.5, 1, 1.5][at]! * density)))
  sizes.forEach((size, at) => tokens.set(`shadow-${size}`, shadows[knobs.shadow][at]!))
  tokens.set('font-sans', knobs.font.sans.trim())
  tokens.set('font-mono', knobs.font.mono.trim())
  tokens.set('ring-width', '2px')
  tokens.set('ring-offset', '2px')
  for (const [duration, ms] of Object.entries(durations))
    tokens.set(`duration-${duration}`, `${ms}ms`)
  tokens.set('ease', 'cubic-bezier(0.2, 0, 0, 1)')
  tokens.set('content-max', '80rem')
  tokens.set('content-narrow', '48rem')
  tokens.set('sidebar-width', '16rem')
  tokens.set('sidebar-width-collapsed', '3.5rem')
  tokens.set('topbar-height', '3.5rem')
  tokens.set('page-px', '1rem')
  tokens.set('section-gap', '1.5rem')
  const layers = { sticky: 10, overlay: 40, modal: 50, popover: 60, toast: 70, tooltip: 80 }
  for (const [layer, z] of Object.entries(layers)) tokens.set(`z-${layer}`, String(z))

  const block = (
    selector: string,
    entries: Iterable<[string, string]>,
    indent = '',
    scheme?: string,
  ) =>
    [
      `${indent}${selector} {`,
      ...(scheme ? [`${indent}  color-scheme: ${scheme};`] : []),
      ...[...entries].map(([token, value]) => `${indent}  --tre-${token}: ${value};`),
      `${indent}}`,
    ].join('\n')
  const reduced = Object.keys(durations).map((d): [string, string] => [`duration-${d}`, '0ms'])
  return [
    `/* Generated by @heart-ui/theme from the "${knobs.name}" knobs. Do not edit by hand. */`,
    block(':root', tokens, '', 'light'),
    block('.dark,\n[data-theme="dark"]', values.dark, '', 'dark'),
    `@media (min-width: 768px) {\n${block(':root', [['page-px', '1.5rem']], '  ')}\n}`,
    `@media (prefers-reduced-motion: reduce) {\n${block(':root', reduced, '  ')}\n}`,
  ]
    .join('\n\n')
    .concat('\n')
}
