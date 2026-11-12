# Tokens

A theme is CSS variables in three layers. `registry/` code reads the
semantic and component layers only, through Tailwind utilities.

| Layer | Prefix | Written by | Read by |
| --- | --- | --- | --- |
| Raw | `--tre-raw-*` | Theme generator | Semantic layer only |
| Semantic | `--tre-*` | Theme generator | Components, blocks, layouts |
| Component | `--tre-<component>-*` | Component author | That component |

## Knobs

A theme is fully described by one knob file. `@trevui/theme` exports
`generateTheme(knobs): string`, which returns `tokens.css`.

```json
{
  "name": "default",
  "primary": "oklch(0.55 0.2 260)",
  "neutral": { "hue": 260, "chroma": 0.02 },
  "radius": 0.5,
  "density": "default",
  "font": { "sans": "Inter, system-ui, sans-serif", "mono": "ui-monospace, monospace" },
  "shadow": "soft"
}
```

| Knob | Type | Values |
| --- | --- | --- |
| `primary` | CSS color | Any; converted to OKLCH |
| `neutral` | hue 0-360, chroma 0-0.04 | Tints the gray scale |
| `radius` | number, rem | 0 to 1 |
| `density` | enum | `compact`, `default`, `comfortable` |
| `font` | two font stacks | `sans`, `mono` |
| `shadow` | enum | `none`, `soft`, `crisp` |

## Raw layer

Six scales of 11 steps: `neutral`, `primary`, `success`, `warning`,
`danger`, `info`. Variable form: `--tre-raw-<scale>-<step>`.

| Step | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lightness | .985 | .968 | .929 | .869 | .704 | .554 | .446 | .372 | .279 | .208 | .129 |
| Chroma factor | .08 | .15 | .30 | .50 | .80 | 1 | 1 | .90 | .75 | .60 | .45 |

Each step is `oklch(lightness, base chroma x factor, hue)`, clamped to the
sRGB gamut. `primary` takes hue and chroma from the knob. Status scales use
fixed hues (success 150, warning 75, danger 25, info 235) at chroma 0.17.
`neutral` uses the knob's hue and chroma.

## Semantic layer

Colors. Each row is `--tre-<name>`; values name a raw step.

| Name | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | white | neutral-950 | Page |
| `surface` | white | neutral-900 | Cards, panels |
| `surface-raised` | white | neutral-800 | Popovers, menus, dialogs |
| `surface-sunken` | neutral-100 | neutral-950 | Wells, table headers |
| `muted` | neutral-100 | neutral-800 | Neutral fills, hover |
| `muted-hover` | neutral-200 | neutral-700 | Pressed neutral fills |
| `foreground` | neutral-900 | neutral-50 | Body text |
| `muted-foreground` | neutral-600 | neutral-300 | Secondary text |
| `subtle-foreground` | neutral-500 | neutral-400 | Placeholders, hints |
| `disabled-foreground` | neutral-400 | neutral-600 | Disabled text |
| `border` | neutral-200 | neutral-800 | Dividers, card edges |
| `border-control` | neutral-500 | neutral-500 | Input and checkbox edges |
| `ring` | primary-500 | primary-500 | Focus ring |
| `overlay` | black at 50% | black at 70% | Scrim behind dialogs |
| `primary` | primary-600 | primary-400 | Primary actions |
| `primary-hover` | primary-700 | primary-300 | |
| `primary-active` | primary-800 | primary-200 | |
| `primary-foreground` | white | neutral-950 | Text on `primary` |
| `primary-subtle` | primary-50 | primary-950 | Tinted fills, selected rows |
| `primary-subtle-foreground` | primary-700 | primary-300 | Text on `primary-subtle` |
| `link` | primary-700 | primary-300 | Inline links |

Each status (`success`, `warning`, `danger`, `info`) gets four tokens with
the same step mapping as primary: `<s>` (600 / 400), `<s>-foreground`
(white / neutral-950), `<s>-subtle` (50 / 950), `<s>-subtle-foreground`
(700 / 300).

Charts use `chart-1` to `chart-6`: primary-500, then the info, success,
warning, danger, and neutral 500 steps (400 in dark mode).

Contrast: the generator checks every foreground against its background.
Text pairs must reach 4.5:1 and `border-control` and `ring` must reach 3:1
against `background` and `surface`. A failing token moves one step at a
time toward more contrast until it passes. When the foreground is already at
the end of its scale, the background moves instead, and `primary` takes
`primary-hover`, `primary-active` and `ring` with it so they stay distinct.
The default theme needs no moves.

Shape, size, and motion:

| Token | Value |
| --- | --- |
| `radius-sm`, `radius-md`, `radius-lg` | knob x 0.5, x 1, x 1.5 |
| `radius-full` | `9999px` |
| `control-sm`, `control-md`, `control-lg` | compact 1.75 / 2 / 2.25 rem; default 2 / 2.25 / 2.5 rem; comfortable 2.25 / 2.5 / 2.75 rem |
| `control-px-sm`, `-md`, `-lg` | 0.5 / 0.75 / 1 rem, scaled 0.875 compact, 1.125 comfortable |
| `gap-sm`, `gap-md`, `gap-lg` | 0.5 / 1 / 1.5 rem, scaled as above |
| `shadow-sm`, `shadow-md`, `shadow-lg` | By `shadow` knob; all `none` when the knob is `none` |
| `font-sans`, `font-mono` | From the knob |
| `ring-width`, `ring-offset` | `2px`, `2px` |
| `duration-fast`, `-normal`, `-slow` | 100 / 200 / 300 ms; 0 ms under `prefers-reduced-motion` |
| `ease` | `cubic-bezier(0.2, 0, 0, 1)` |

Layout:

| Token | Value |
| --- | --- |
| `content-max` | `80rem` |
| `content-narrow` | `48rem` |
| `sidebar-width`, `sidebar-width-collapsed` | `16rem`, `3.5rem` |
| `topbar-height` | `3.5rem` |
| `page-px` | `1rem`; `1.5rem` from 768 px |
| `section-gap` | `1.5rem` |
| `z-sticky`, `z-overlay`, `z-modal`, `z-popover`, `z-toast`, `z-tooltip` | 10, 40, 50, 60, 70, 80 |

## Component layer

A component declares a token only when a theme has a reason to diverge
from the semantic value, and it always falls back to a semantic token:

```css
border-radius: var(--tre-button-radius, var(--tre-radius-md));
```

List every component token in the "Tokens" section of that component's
Markdown page.

## Dark mode

`tokens.css` defines light values on `:root` and dark values on
`.dark, [data-theme="dark"]`. Nothing in `registry/` uses Tailwind's
`dark:` variant; a color that must differ in dark mode is a missing token.

## Tailwind mapping

`theme.css` is static and ships with `init`. It maps tokens to Tailwind's
theme so utilities resolve to variables:

```css
@import "tailwindcss";
@import "./tokens.css";

@theme inline {
  --color-background: var(--tre-background);
  --color-primary: var(--tre-primary);
  --color-primary-foreground: var(--tre-primary-foreground);
  --radius-md: var(--tre-radius-md);
  --shadow-md: var(--tre-shadow-md);
  --font-sans: var(--tre-font-sans);
  --spacing-control-md: var(--tre-control-md);
  /* one line per semantic token */
}
```

Resulting utilities: `bg-background`, `bg-surface`, `text-foreground`,
`text-muted-foreground`, `bg-primary`, `text-primary-foreground`,
`border-border`, `ring-ring`, `rounded-md`, `shadow-md`, `h-control-md`,
`px-control-px-md`, `gap-gap-md`. Confirm the exact `@theme` namespaces
against the Tailwind CSS v4 docs before writing `theme.css`.

## Lint rule

`@trevui/eslint-plugin` rule `no-raw-values` fails on any of these inside
`registry/`:

- Hex, `rgb()`, `hsl()`, `oklch()`, or named colors.
- Tailwind palette classes (`bg-blue-500`, `text-gray-700`).
- Arbitrary-value classes (`w-[13px]`, `bg-[#fff]`).
- `--tre-raw-*` references.
- The `dark:` variant.

Spacing utilities from Tailwind's numeric scale (`p-4`, `gap-2`) are
allowed for layout inside an item. Control height, control padding, and
radius must use the token utilities.
