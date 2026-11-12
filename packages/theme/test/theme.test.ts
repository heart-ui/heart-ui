import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkContrast, generateTheme, type Knobs } from '../src'
import { toSrgb, type Oklch } from '../src/color'
import { resolveSemantic, type Scales } from '../src/semantic'

const root = join(import.meta.dirname, '../../..')
const defaults = JSON.parse(
  readFileSync(join(root, 'registry/themes/default.json'), 'utf8'),
) as Knobs

const statuses = ['success', 'warning', 'danger', 'info']
const semanticColors = [
  'background',
  'surface',
  'surface-raised',
  'surface-sunken',
  'muted',
  'muted-hover',
  'foreground',
  'muted-foreground',
  'subtle-foreground',
  'disabled-foreground',
  'border',
  'border-control',
  'ring',
  'overlay',
  'primary',
  'primary-hover',
  'primary-active',
  'primary-foreground',
  'primary-subtle',
  'primary-subtle-foreground',
  'link',
  ...statuses.flatMap((s) => [s, `${s}-foreground`, `${s}-subtle`, `${s}-subtle-foreground`]),
  ...[1, 2, 3, 4, 5, 6].map((n) => `chart-${n}`),
]
const sizes = ['sm', 'md', 'lg']
const shapeTokens = [
  ...sizes.map((s) => `radius-${s}`),
  'radius-full',
  ...sizes.map((s) => `control-${s}`),
  ...sizes.map((s) => `control-px-${s}`),
  ...sizes.map((s) => `gap-${s}`),
  ...sizes.map((s) => `shadow-${s}`),
  'font-sans',
  'font-mono',
  'ring-width',
  'ring-offset',
  'duration-fast',
  'duration-normal',
  'duration-slow',
  'ease',
]
const layoutTokens = [
  'content-max',
  'content-narrow',
  'sidebar-width',
  'sidebar-width-collapsed',
  'topbar-height',
  'page-px',
  'section-gap',
  ...['sticky', 'overlay', 'modal', 'popover', 'toast', 'tooltip'].map((z) => `z-${z}`),
]
const scales = ['neutral', 'primary', 'success', 'warning', 'danger', 'info']
const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const lightness = [0.985, 0.968, 0.929, 0.869, 0.704, 0.554, 0.446, 0.372, 0.279, 0.208, 0.129]
const factors = [0.08, 0.15, 0.3, 0.5, 0.8, 1, 1, 0.9, 0.75, 0.6, 0.45]

// The `--tre-*` declarations directly inside the block that opens with `opening`.
function declarations(css: string, opening: string) {
  const start = css.indexOf(opening)
  expect(start, `no block ${opening}`).not.toBe(-1)
  const body = css.slice(start + opening.length, css.indexOf('}', start))
  return new Map(
    [...body.matchAll(/--tre-([\w-]+):\s*([^;]+);/g)].map((match) => [match[1]!, match[2]!.trim()]),
  )
}

function oklch(value: string) {
  const match = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(value)
  expect(match, value).not.toBeNull()
  return { l: Number(match![1]), c: Number(match![2]), h: Number(match![3]) }
}

describe('generateTheme', () => {
  const css = generateTheme(defaults)

  it('emits every token in tokens.md', () => {
    const light = declarations(css, ':root {')
    for (const scale of scales) {
      for (const step of steps)
        expect(light.has(`raw-${scale}-${step}`), `raw-${scale}-${step}`).toBe(true)
    }
    for (const name of [...semanticColors, ...shapeTokens, ...layoutTokens]) {
      expect(light.has(name), name).toBe(true)
    }
    const dark = declarations(css, '.dark,\n[data-theme="dark"] {')
    for (const name of semanticColors) expect(dark.has(name), `dark ${name}`).toBe(true)

    const motion = declarations(css, '@media (prefers-reduced-motion: reduce) {\n  :root {')
    for (const name of ['duration-fast', 'duration-normal', 'duration-slow']) {
      expect(motion.get(name)).toBe('0ms')
    }
    expect(declarations(css, '@media (min-width: 768px) {\n  :root {').get('page-px')).toBe(
      '1.5rem',
    )
    expect(light.get('control-md')).toBe('2.25rem')
    expect(light.get('radius-lg')).toBe('0.75rem')
    expect(light.get('background')).toBe('oklch(1 0 0)')
    expect(light.get('foreground')).toBe('var(--tre-raw-neutral-900)')
  })

  it('sets color-scheme for each mode', () => {
    expect(css).toMatch(/:root \{\n {2}color-scheme: light;/)
    expect(css).toMatch(/\[data-theme="dark"\] \{\n {2}color-scheme: dark;/)
  })

  it('pins the default output', async () => {
    // Regenerate with `pnpm --filter @trevui/theme generate`, then review the diff.
    expect(css).toBe(readFileSync(join(import.meta.dirname, '../css/tokens.css'), 'utf8'))
  })
})

describe('raw scales', () => {
  const raw = declarations(generateTheme(defaults), ':root {')
  const bases: Record<string, { hue: number; chroma: number }> = {
    neutral: defaults.neutral,
    primary: { hue: 260, chroma: 0.2 },
    success: { hue: 150, chroma: 0.17 },
    warning: { hue: 75, chroma: 0.17 },
    danger: { hue: 25, chroma: 0.17 },
    info: { hue: 235, chroma: 0.17 },
  }

  it.each(scales)('%s follows the step table inside sRGB', (scale) => {
    const base = bases[scale]!
    steps.forEach((step, at) => {
      const color = oklch(raw.get(`raw-${scale}-${step}`)!)
      expect(color.l).toBeCloseTo(lightness[at]!, 3)
      expect(color.h).toBeCloseTo(base.hue, 1)
      expect(color.c).toBeLessThanOrEqual(base.chroma * factors[at]! + 1e-4)
      expect(color.c).toBeGreaterThan(0)
      for (const channel of toSrgb(color)) {
        expect(channel).toBeGreaterThanOrEqual(-1e-4)
        expect(channel).toBeLessThanOrEqual(1 + 1e-4)
      }
    })
  })

  it('keeps full chroma where the gamut allows it', () => {
    expect(oklch(raw.get('raw-neutral-500')!).c).toBeCloseTo(0.02, 4)
  })
})

describe('checkContrast', () => {
  const report = checkContrast(defaults)

  it('default theme passes every pair in light and dark', () => {
    expect(report.pass).toBe(true)
    for (const mode of ['light', 'dark'] as const) {
      const checks = report.checks.filter((check) => check.mode === mode)
      expect(checks).toHaveLength(33)
      for (const check of checks) {
        expect(
          check.ratio,
          `${mode} ${check.foreground} on ${check.background}`,
        ).toBeGreaterThanOrEqual(check.required)
        expect(check.pass).toBe(true)
      }
    }
    const pair = (foreground: string, background: string, required: number) =>
      expect(report.checks).toContainEqual(
        expect.objectContaining({ mode: 'dark', foreground, background, required }),
      )
    pair('foreground', 'surface-raised', 4.5)
    pair('primary-foreground', 'primary-active', 4.5)
    pair('danger-subtle-foreground', 'danger-subtle', 4.5)
    pair('border-control', 'surface', 3)
    pair('ring', 'background', 3)
    pair('foreground', 'muted-hover', 4.5)
    pair('link', 'surface-raised', 4.5)
    expect(report.checks.some((check) => check.foreground === 'disabled-foreground')).toBe(false)
  })

  it('default theme needs no moves, so tokens.css is the tokens.md table', () => {
    expect(report.adjustments).toEqual([])
    const dark = declarations(generateTheme(defaults), '.dark,\n[data-theme="dark"] {')
    const raw = (step: string) => `var(--tre-raw-${step})`
    expect(dark.get('primary')).toBe(raw('primary-400'))
    expect(dark.get('primary-hover')).toBe(raw('primary-300'))
    expect(dark.get('primary-active')).toBe(raw('primary-200'))
    expect(dark.get('ring')).toBe(raw('primary-500'))
    expect(dark.get('muted-foreground')).toBe(raw('neutral-300'))
    expect(dark.get('subtle-foreground')).toBe(raw('neutral-400'))
    expect(dark.get('border-control')).toBe(raw('neutral-500'))
    for (const status of statuses) expect(dark.get(status)).toBe(raw(`${status}-400`))
    const light = declarations(generateTheme(defaults), ':root {')
    expect(light.get('border-control')).toBe(raw('neutral-500'))
  })
})

describe('contrast moves', () => {
  const gray = (l: number): Oklch => ({ l, c: 0, h: 0 })
  const neutral = lightness
  const flat = lightness.map(() => gray(0.5))
  const scalesWith = (overrides: Partial<Scales>) =>
    ({
      neutral: neutral.map(gray),
      primary: neutral.map(gray),
      success: flat,
      warning: flat,
      danger: flat,
      info: flat,
      ...overrides,
    }) as Scales

  it('moves a failing foreground one step at a time and emits the moved step', () => {
    // neutral-400, dark subtle-foreground, is too dark on neutral-950; 300 passes.
    const dimmed = [...neutral]
    dimmed[4] = 0.5
    const { values, report } = resolveSemantic(scalesWith({ neutral: dimmed.map(gray) }))
    expect(report.adjustments).toContainEqual({
      mode: 'dark',
      token: 'subtle-foreground',
      from: 'neutral-400',
      to: 'neutral-300',
    })
    expect(values.dark.get('subtle-foreground')).toBe('var(--tre-raw-neutral-300)')
  })

  it('moves the background, with its states and ring, when the foreground is at the end', () => {
    // Dark primary-foreground is neutral-950, the darkest step; primary-400 is too dark for it.
    const primary = [...neutral]
    primary[4] = 0.45
    const { values, report } = resolveSemantic(scalesWith({ primary: primary.map(gray) }))
    const moved = report.adjustments.filter((move) => move.mode === 'dark').map((m) => m.token)
    expect(moved).toEqual(
      expect.arrayContaining(['primary', 'primary-hover', 'primary-active', 'ring']),
    )
    const tokens = ['primary', 'primary-hover', 'primary-active', 'ring'].map((t) =>
      values.dark.get(t),
    )
    expect(new Set(tokens).size).toBe(4)
  })

  it('keeps the ring off the primary fill', () => {
    for (const selector of [':root {', '.dark,\n[data-theme="dark"] {']) {
      const tokens = declarations(generateTheme(defaults), selector)
      expect(tokens.get('ring'), selector).not.toBe(tokens.get('primary'))
      expect(tokens.get('ring'), selector).not.toBe(tokens.get('primary-active'))
    }
  })

  it('keeps a ring that moves on its own off the primary states', () => {
    // primary-500 is too light for a ring on white; 600 and darker pass.
    const primary = [0.99, 0.97, 0.95, 0.9, 0.85, 0.8, 0.45, 0.37, 0.28, 0.2, 0.13].map(gray)
    const { values } = resolveSemantic(scalesWith({ primary }))
    const ring = values.light.get('ring')
    for (const state of ['primary', 'primary-hover', 'primary-active']) {
      expect(ring, state).not.toBe(values.light.get(state))
    }
  })

  it('moves a background only while its states can follow', () => {
    // A primary scale too light for white text at every step: primary darkens until a state hits 950.
    const { values } = resolveSemantic(scalesWith({ primary: lightness.map(() => gray(0.95)) }))
    const states = ['primary', 'primary-hover', 'primary-active'].map((t) => values.light.get(t))
    expect(new Set(states).size).toBe(3)
  })
})

describe('knobs', () => {
  it.each([
    ['radius above 1', { radius: 2 }, /radius/],
    ['negative radius', { radius: -0.1 }, /radius/],
    ['neutral chroma above 0.04', { neutral: { hue: 260, chroma: 0.05 } }, /neutral/],
    ['neutral hue above 360', { neutral: { hue: 400, chroma: 0.02 } }, /neutral/],
    ['an unknown density', { density: 'big' }, /density/],
    ['an unknown shadow', { shadow: 'hard' }, /shadow/],
    [
      'a font stack that closes the rule',
      { font: { sans: 'Inter; } body { color: red', mono: 'monospace' } },
      /font/,
    ],
    [
      'a font stack that ends the comment',
      { font: { sans: 'Inter */', mono: 'monospace' } },
      /font/,
    ],
    ['a missing font', { font: undefined }, /font/],
    ['a name that is not kebab-case', { name: 'My Theme */' }, /name/],
    ['an unreadable primary', { primary: 'banana' }, /primary/],
    ['a translucent primary', { primary: 'oklch(0.55 0.2 260 / 0.5)' }, /primary/],
    ['a translucent hex primary', { primary: '#3b5bdb80' }, /primary/],
    ['a primary with alpha none', { primary: 'oklch(0.55 0.2 260 / none)' }, /primary/],
    ['an rgb() channel in degrees', { primary: 'rgb(59deg 91 219)' }, /primary/],
    ['an hsl() hue in percent', { primary: 'hsl(50% 50% 50%)' }, /primary/],
    ['legacy hsl() without percent', { primary: 'hsl(228, 69, 55)' }, /primary/],
    ['legacy rgb() mixing numbers and percent', { primary: 'rgb(255, 50%, 0)' }, /primary/],
    ...['Inter(', '"Inter', 'Inter\\', 'Inter [x]', "Inter'"].map(
      (sans): [string, Partial<Knobs>, RegExp] => [
        `the font stack ${sans}`,
        { font: { sans, mono: 'monospace' } },
        /font/,
      ],
    ),
  ])('rejects %s', (_, change, message) => {
    const knobs = { ...defaults, ...change } as unknown as Knobs
    expect(() => generateTheme(knobs)).toThrow(message)
  })

  it.each([
    ['hex', '#3b5bdb'],
    ['short hex', '#35d'],
    ['rgb()', 'rgb(59 91 219)'],
    ['legacy rgb()', 'rgb(59, 91, 219)'],
    ['hsl()', 'hsl(228 69% 55%)'],
    ['oklch() with percent and deg', 'oklch(55% 0.2 260deg)'],
    ['modern hsl() with bare numbers', 'hsl(228 69 55)'],
    ['opaque 8-digit hex', '#3b5bdbff'],
    ['rgba() at full alpha', 'rgba(59, 91, 219, 1)'],
    ['oklch() with alpha 1', 'oklch(0.55 0.2 260 / 1)'],
  ])('accepts primary forms: %s', (_, primary) => {
    const raw = declarations(generateTheme({ ...defaults, primary }), ':root {')
    const color = oklch(raw.get('raw-primary-500')!)
    expect(color.h).toBeGreaterThan(250)
    expect(color.h).toBeLessThan(275)
  })

  it.each([
    ['a named color', 'royalblue'],
    ['lab()', 'lab(45% 20 -70)'],
    ['hwb()', 'hwb(220 10% 20%)'],
    ['color(display-p3)', 'color(display-p3 0.2 0.4 0.8)'],
    ['a gray', 'gray'],
  ])('accepts any CSS color: %s', (_, primary) => {
    const color = oklch(
      declarations(generateTheme({ ...defaults, primary }), ':root {').get('raw-primary-500')!,
    )
    if (primary === 'gray') expect(color).toEqual({ l: 0.554, c: 0, h: 0 })
    else {
      // Every sample is a blue between 255 and 300 degrees with real chroma.
      expect(color.h).toBeGreaterThan(255)
      expect(color.h).toBeLessThan(300)
      expect(color.c).toBeGreaterThan(0.05)
    }
  })

  it('accepts any CSS color: hues outside 0-360 normalize to the same theme', () => {
    const at = (h: number) => generateTheme({ ...defaults, primary: `oklch(0.6 0.2 ${h})` })
    expect(at(-100)).toBe(at(260))
    expect(at(620)).toBe(at(260))
  })

  it.each([
    ['rgb(none 0 255)', 'rgb(0 0 255)'],
    ['hsl(none 100% 50%)', 'hsl(0 100% 50%)'],
    ['oklch(0.5 none 260)', 'oklch(0.5 0 0)'],
    ['oklch(none 0.2 260)', 'oklch(0 0.2 260)'],
  ])('accepts any CSS color: none means 0, as in CSS (%s)', (withNone, zero) => {
    expect(generateTheme({ ...defaults, primary: withNone })).toBe(
      generateTheme({ ...defaults, primary: zero }),
    )
  })

  it('accepts any CSS color: out-of-range rgb() channels clamp as browsers do', () => {
    expect(generateTheme({ ...defaults, primary: 'rgb(-50 0 300)' })).toBe(
      generateTheme({ ...defaults, primary: 'rgb(0 0 255)' }),
    )
  })

  it('accepts primary forms: hsl() bare numbers are percent', () => {
    expect(generateTheme({ ...defaults, primary: 'hsl(228 69 55)' })).toBe(
      generateTheme({ ...defaults, primary: 'hsl(228 69% 55%)' }),
    )
    const raw = declarations(generateTheme({ ...defaults, primary: 'hsl(228 0.5 0.5)' }), ':root {')
    expect(oklch(raw.get('raw-primary-500')!).c).toBeLessThan(0.01)
  })

  it('accepts font stacks with quoted family names', () => {
    const font = {
      sans: '"Inter Variable", system-ui, sans-serif',
      mono: "'SF Mono', ui-monospace",
    }
    expect(declarations(generateTheme({ ...defaults, font }), ':root {').get('font-sans')).toBe(
      font.sans,
    )
  })

  it('accepts primary forms: hex and rgb() give the same theme', () => {
    expect(generateTheme({ ...defaults, primary: '#3b5bdb' })).toBe(
      generateTheme({ ...defaults, primary: 'rgb(59, 91, 219)' }),
    )
  })
})

describe('theme.css', () => {
  const theme = readFileSync(join(import.meta.dirname, '../css/theme.css'), 'utf8')

  it('imports Tailwind and the tokens', () => {
    expect(theme).toMatch(/@import ['"]tailwindcss['"];/)
    expect(theme).toMatch(/@import ['"]\.\/tokens\.css['"];/)
    expect(theme).toMatch(/@theme inline \{/)
  })

  it('maps every semantic color and size token', () => {
    const lines = [
      ...semanticColors.map((name) => `--color-${name}: var(--tre-${name});`),
      ...[...sizes, 'full'].map((s) => `--radius-${s}: var(--tre-radius-${s});`),
      ...sizes.map((s) => `--shadow-${s}: var(--tre-shadow-${s});`),
      '--font-sans: var(--tre-font-sans);',
      '--font-mono: var(--tre-font-mono);',
      ...sizes.map((s) => `--spacing-control-${s}: var(--tre-control-${s});`),
      ...sizes.map((s) => `--spacing-control-px-${s}: var(--tre-control-px-${s});`),
      ...sizes.map((s) => `--spacing-gap-${s}: var(--tre-gap-${s});`),
    ]
    for (const line of lines) expect(theme, line).toContain(line)
  })
})
