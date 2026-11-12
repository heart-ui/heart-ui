import { clampToGamut, contrast, round, type Oklch } from './color'

export const scaleNames = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const
export type Scale = (typeof scaleNames)[number]
export const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
const lightness = [0.985, 0.968, 0.929, 0.869, 0.704, 0.554, 0.446, 0.372, 0.279, 0.208, 0.129]
const chromaFactor = [0.08, 0.15, 0.3, 0.5, 0.8, 1, 1, 0.9, 0.75, 0.6, 0.45]
export const statuses = ['success', 'warning', 'danger', 'info'] as const
const statusHue = { success: 150, warning: 75, danger: 25, info: 235 }
const statusChroma = 0.17

export type Scales = Record<Scale, Oklch[]>

export function buildScales(primary: Oklch, neutral: { hue: number; chroma: number }): Scales {
  const scale = (hue: number, chroma: number) =>
    lightness.map((l, at) => round(clampToGamut({ l, c: chroma * chromaFactor[at]!, h: hue })))
  return {
    neutral: scale(neutral.hue, neutral.chroma),
    primary: scale(primary.h, primary.c),
    ...(Object.fromEntries(
      statuses.map((status) => [status, scale(statusHue[status], statusChroma)]),
    ) as Record<(typeof statuses)[number], Oklch[]>),
  }
}

// A color token's place on its scale's ladder: 0 is white, 1 to 11 are steps 50 to 950.
type Ref = { scale: Scale; at: number }
export type Mode = 'light' | 'dark'

function ref(value: string): Ref {
  if (value === 'white') return { scale: 'neutral', at: 0 }
  const [scale, step] = [
    value.slice(0, value.lastIndexOf('-')),
    Number(value.slice(value.lastIndexOf('-') + 1)),
  ]
  return { scale: scale as Scale, at: steps.indexOf(step as (typeof steps)[number]) + 1 }
}

const status = (s: string): [string, string, string][] => [
  [s, `${s}-600`, `${s}-500`],
  [`${s}-foreground`, 'white', 'neutral-950'],
  [`${s}-subtle`, `${s}-50`, `${s}-950`],
  [`${s}-subtle-foreground`, `${s}-700`, `${s}-300`],
]
const chartScales = ['primary', 'info', 'success', 'warning', 'danger', 'neutral']

// tokens.md, Semantic layer: name, light value, dark value.
const mapping: [string, string, string][] = [
  ['background', 'white', 'neutral-950'],
  ['surface', 'white', 'neutral-900'],
  ['surface-raised', 'white', 'neutral-800'],
  ['surface-sunken', 'neutral-100', 'neutral-950'],
  ['muted', 'neutral-100', 'neutral-800'],
  ['muted-hover', 'neutral-200', 'neutral-700'],
  ['foreground', 'neutral-900', 'neutral-50'],
  ['muted-foreground', 'neutral-600', 'neutral-400'],
  ['subtle-foreground', 'neutral-500', 'neutral-500'],
  ['disabled-foreground', 'neutral-400', 'neutral-600'],
  ['border', 'neutral-200', 'neutral-800'],
  ['border-control', 'neutral-400', 'neutral-600'],
  ['ring', 'primary-500', 'primary-400'],
  ['primary', 'primary-600', 'primary-500'],
  ['primary-hover', 'primary-700', 'primary-400'],
  ['primary-active', 'primary-800', 'primary-300'],
  ['primary-foreground', 'white', 'neutral-950'],
  ['primary-subtle', 'primary-50', 'primary-950'],
  ['primary-subtle-foreground', 'primary-700', 'primary-300'],
  ['link', 'primary-700', 'primary-300'],
  ...statuses.flatMap(status),
  ...chartScales.map((scale, at): [string, string, string] => [
    `chart-${at + 1}`,
    `${scale}-500`,
    `${scale}-400`,
  ]),
]

export const overlay = { light: 'oklch(0 0 0 / 0.5)', dark: 'oklch(0 0 0 / 0.7)' }

const surfaces = ['background', 'surface', 'surface-raised', 'surface-sunken', 'muted']
const pages = ['background', 'surface']
// Foreground, backgrounds, required ratio. disabled-foreground is exempt (WCAG 1.4.3).
const pairs: [string, string[], number][] = [
  ['foreground', [...surfaces, 'muted-hover'], 4.5],
  ['muted-foreground', [...surfaces, 'muted-hover'], 4.5],
  ['subtle-foreground', pages, 4.5],
  ['link', [...pages, 'surface-raised'], 4.5],
  ['primary-foreground', ['primary', 'primary-hover', 'primary-active'], 4.5],
  ['primary-subtle-foreground', ['primary-subtle'], 4.5],
  ...statuses.flatMap((s): [string, string[], number][] => [
    [`${s}-foreground`, [s], 4.5],
    [`${s}-subtle-foreground`, [`${s}-subtle`], 4.5],
  ]),
  ['border-control', pages, 3],
  ['ring', pages, 3],
]
// A background that moves takes its states and its focus ring with it, so they stay distinct.
const states: Record<string, string[]> = { primary: ['primary-hover', 'primary-active', 'ring'] }
// A foreground that moves on its own skips the steps these tokens hold.
const apart: Record<string, string[]> = { ring: ['primary', 'primary-hover', 'primary-active'] }

export type ContrastCheck = {
  mode: Mode
  foreground: string
  background: string
  ratio: number
  required: number
  pass: boolean
}
export type Adjustment = { mode: Mode; token: string; from: string; to: string }
export type ContrastReport = { pass: boolean; checks: ContrastCheck[]; adjustments: Adjustment[] }

const white: Oklch = { l: 1, c: 0, h: 0 }
const name = ({ scale, at }: Ref) => (at === 0 ? 'white' : `${scale}-${steps[at - 1]}`)

export type Resolved = Record<Mode, Map<string, string>>

/** Maps every semantic color to a raw step, moving failing tokens until their pairs pass. */
export function resolveSemantic(scales: Scales): { values: Resolved; report: ContrastReport } {
  const report: ContrastReport = { pass: true, checks: [], adjustments: [] }
  const values = {} as Resolved
  for (const mode of ['light', 'dark'] as const) {
    const refs = new Map(
      mapping.map(([token, light, dark]) => [token, ref(mode === 'light' ? light : dark)]),
    )
    const initial = new Map(refs)
    const color = (token: string) => {
      const { scale, at } = refs.get(token)!
      return at === 0 ? white : scales[scale][at - 1]!
    }
    const canMove = (token: string, by: number) => {
      const at = refs.get(token)!.at + by
      return at >= 0 && at <= steps.length
    }
    // Moves the token and any tokens that follow it, or nothing when one of them is at the end.
    const move = (token: string, by: number, followers: string[] = []) => {
      const group = [token, ...followers]
      if (!group.every((member) => canMove(member, by))) return false
      for (const member of group) {
        const current = refs.get(member)!
        refs.set(member, { ...current, at: current.at + by })
      }
      return true
    }
    const step = (token: string, by: number) => {
      const { scale, at } = refs.get(token)!
      const taken = (apart[token] ?? []).map((other) => refs.get(other)!)
      let to = at + by
      while (taken.some((other) => other.scale === scale && other.at === to)) to += by
      if (to < 0 || to > steps.length) return false
      refs.set(token, { scale, at: to })
      return true
    }
    // One step per failing pair per pass, until nothing moves.
    for (let pass = 0; pass < 100; pass++) {
      let moved = false
      for (const [foreground, backgrounds, required] of pairs) {
        for (const background of backgrounds) {
          if (contrast(color(foreground), color(background)) >= required) continue
          const lighter = color(foreground).l >= color(background).l
          if (step(foreground, lighter ? -1 : 1)) moved = true
          else {
            // A state as the failing background moves its whole group, never alone.
            const owner =
              Object.keys(states).find((key) => states[key]!.includes(background)) ?? background
            if (move(owner, lighter ? 1 : -1, states[owner])) moved = true
          }
        }
      }
      if (!moved) break
    }
    for (const [foreground, backgrounds, required] of pairs) {
      for (const background of backgrounds) {
        const ratio = contrast(color(foreground), color(background))
        const pass = ratio >= required
        report.checks.push({
          mode,
          foreground,
          background,
          ratio: Math.floor(ratio * 100) / 100,
          required,
          pass,
        })
        if (!pass) report.pass = false
      }
    }
    for (const [token, start] of initial) {
      const end = refs.get(token)!
      if (end.at !== start.at)
        report.adjustments.push({ mode, token, from: name(start), to: name(end) })
    }
    values[mode] = new Map(
      [...refs].map(([token, value]) => [
        token,
        value.at === 0 ? 'oklch(1 0 0)' : `var(--tre-raw-${value.scale}-${steps[value.at - 1]})`,
      ]),
    )
    values[mode].set('overlay', overlay[mode])
  }
  return { values, report }
}
