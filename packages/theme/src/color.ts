// OKLab and OKLCH after Björn Ottosson (bottosson.github.io/posts/oklab); contrast per WCAG 2.

export type Oklch = { l: number; c: number; h: number }
type Rgb = [number, number, number]

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function linearToOklch([r, g, b]: Rgb): Oklch {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const hue = (Math.atan2(bb, a) * 180) / Math.PI
  return { l: lightness, c: Math.hypot(a, bb), h: hue < 0 ? hue + 360 : hue }
}

function toLinearRgb({ l, c, h }: Oklch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ]
}

/** Gamma-encoded sRGB channels, 0 to 1 inside the gamut. */
export function toSrgb(color: Oklch): Rgb {
  return toLinearRgb(color).map(toGamma) as Rgb
}

const inGamut = (color: Oklch) =>
  toLinearRgb(color).every((channel) => channel >= -1e-6 && channel <= 1 + 1e-6)

/** The same lightness and hue with chroma lowered until the color fits sRGB. */
export function clampToGamut(color: Oklch): Oklch {
  if (inGamut(color)) return color
  let low = 0
  let high = color.c
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2
    if (inGamut({ ...color, c: mid })) low = mid
    else high = mid
  }
  return { ...color, c: low }
}

/** Rounded the way tokens.css prints it, so contrast is checked on the emitted value. */
export function round(color: Oklch): Oklch {
  const c = Math.floor(color.c * 1e4) / 1e4
  return { l: Number(color.l.toFixed(3)), c, h: c === 0 ? 0 : Number(color.h.toFixed(2)) }
}

export function format({ l, c, h }: Oklch) {
  return `oklch(${l} ${c} ${h})`
}

function luminance(color: Oklch) {
  const [r, g, b] = toLinearRgb(color).map((channel) => Math.min(1, Math.max(0, channel)))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

export function contrast(a: Oklch, b: Oklch) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light! + 0.05) / (dark! + 0.05)
}

const channelPattern = /^([+-]?(?:\d+\.?\d*|\.\d+))(%|deg)?$/

// A channel as [value, unit], unit '' for a bare number; undefined when it isn't one.
function token(part: string | undefined): [number, string] | undefined {
  const match = part === undefined ? null : channelPattern.exec(part)
  return match ? [Number.parseFloat(match[1]!), match[2] ?? ''] : undefined
}

// CSS Color 4: alpha is a number or a percentage; only full opacity is accepted.
function opaque(part: string | undefined) {
  const alpha = token(part)
  return (
    part === undefined ||
    (alpha !== undefined && alpha[0] === (alpha[1] === '%' ? 100 : 1) && alpha[1] !== 'deg')
  )
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [f(0), f(8), f(4)]
}

/** Parses hex, rgb(), hsl() or oklch() (CSS Color 4 syntax, opaque) into OKLCH; else undefined. */
export function parseColor(input: string): Oklch | undefined {
  const text = input.trim().toLowerCase()
  const hex = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/.exec(text)
  if (hex) {
    const short = hex[1]!.length <= 4
    const digits = short ? [...hex[1]!].map((d) => d + d) : hex[1]!.match(/../g)!
    if (digits.length === 4 && digits.pop() !== 'ff') return undefined
    return linearToOklch(digits.map((d) => toLinear(Number.parseInt(d, 16) / 255)) as Rgb)
  }
  const call = /^(rgba?|hsla?|oklch)\(([^()]*)\)$/.exec(text)
  if (!call) return undefined
  const kind = call[1]!.replace(/a$/, '')
  const body = call[2]!
  const legacy = body.includes(',')
  let parts: string[]
  let alpha: string | undefined
  if (legacy) {
    if (kind === 'oklch' || body.includes('/')) return undefined
    parts = body.split(',').map((part) => part.trim())
    if (parts.length === 4) alpha = parts.pop()
  } else {
    const [color, after, ...rest] = body.split('/')
    if (rest.length > 0 || (after !== undefined && after.trim() === '')) return undefined
    parts = color!.trim().split(/\s+/)
    alpha = after?.trim()
  }
  const parsed = parts.map(token)
  if (parts.length !== 3 || !opaque(alpha) || parsed.some((c) => c === undefined)) return undefined
  const channels = parsed as [number, string][]
  const [first, second, third] = channels as [[number, string], [number, string], [number, string]]
  if (kind === 'rgb') {
    if (channels.some((c) => c[1] === 'deg')) return undefined
    // Legacy commas take all numbers or all percentages; only the modern form mixes them.
    if (legacy && new Set(channels.map((c) => c[1])).size > 1) return undefined
    const rgb = channels.map(([value, unit]) => (unit === '%' ? value / 100 : value / 255))
    return rgb.every((c) => c >= 0 && c <= 1) ? linearToOklch(rgb.map(toLinear) as Rgb) : undefined
  }
  const hue = first[1] === '%' ? Number.NaN : ((first[0] % 360) + 360) % 360
  if (kind === 'hsl') {
    // Legacy commas need percentages; the modern form also takes bare numbers as percent.
    const percent = (c: [number, string]) =>
      c[1] === '%' || (c[1] === '' && !legacy) ? c[0] / 100 : Number.NaN
    const [sat, light] = [percent(second), percent(third)]
    if (!(sat >= 0 && sat <= 1 && light >= 0 && light <= 1 && Number.isFinite(hue)))
      return undefined
    return linearToOklch(hslToRgb(hue, sat, light).map(toLinear) as Rgb)
  }
  if (second[1] === 'deg' || third[1] === '%') return undefined
  const l = first[1] === '%' ? first[0] / 100 : first[1] === '' ? first[0] : Number.NaN
  const c = second[1] === '%' ? (second[0] / 100) * 0.4 : second[0]
  const h = ((third[0] % 360) + 360) % 360
  return l >= 0 && l <= 1 && c >= 0 ? { l, c, h } : undefined
}
