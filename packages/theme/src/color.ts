import {
  converter,
  getMode,
  modeA98,
  modeHsl,
  modeHwb,
  modeLab,
  modeLch,
  modeLrgb,
  modeOklab,
  modeOklch,
  modeP3,
  modeProphoto,
  modeRec2020,
  modeRgb,
  modeXyz50,
  modeXyz65,
  parse,
  useMode,
} from 'culori/fn'

// OKLab and OKLCH after Björn Ottosson (bottosson.github.io/posts/oklab); contrast per WCAG 2.

export type Oklch = { l: number; c: number; h: number }
type Rgb = [number, number, number]

const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

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

// Only the color spaces CSS Color 4 can write, so a bundle doesn't carry the rest of culori.
for (const mode of [modeRgb, modeHsl, modeHwb, modeLab, modeLch, modeOklab, modeOklch])
  useMode(mode)
for (const mode of [modeLrgb, modeP3, modeA98, modeProphoto, modeRec2020, modeXyz50, modeXyz65]) {
  useMode(mode)
}
const toOklch = converter('oklch')
const clamp = (channel: number) => Math.min(1, Math.max(0, channel))

/** Parses any opaque CSS color into OKLCH; translucent or unreadable gives undefined. */
export function parseColor(input: string): Oklch | undefined {
  const text = input.trim()
  // culori reads alpha `none` (transparent in CSS) as missing, which means opaque.
  if (/\/\s*none\b/i.test(text)) return undefined
  const parsed = parse(text)
  if (!parsed || (parsed.alpha !== undefined && parsed.alpha < 1)) return undefined
  // A `none` channel is 0 in CSS; culori leaves it out. Alpha stays out, meaning opaque.
  const filled = { ...parsed }
  for (const channel of getMode(parsed.mode).channels) {
    if (channel !== 'alpha') (filled as Record<string, unknown>)[channel] ??= 0
  }
  // Browsers clamp channels when they parse rgb(), hex or a named color; culori keeps them.
  if (filled.mode === 'rgb' && !/^color\(/i.test(text)) {
    Object.assign(filled, { r: clamp(filled.r), g: clamp(filled.g), b: clamp(filled.b) })
  }
  const { l, c, h } = toOklch(filled)
  if (!Number.isFinite(l) || !Number.isFinite(c)) return undefined
  // An oklch() input comes back as written, so its hue isn't normalized yet.
  return { l, c, h: h === undefined || c === 0 ? 0 : ((h % 360) + 360) % 360 }
}
