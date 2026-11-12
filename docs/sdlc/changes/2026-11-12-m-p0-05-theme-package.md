# P0-05 Theme package

## Why

**Request (verbatim):** "done" (P0-04 marked done; next ready task: P0-05), run unattended ("fix until no findings, continue without asking me, unattend please").

Task [P0-05](../../../tasks/phase-0.md#p0-05-theme-package): `@trevui/theme` turns one knob file into `tokens.css`, the three-layer token set every item reads, per [tokens.md](../../tokens.md). `theme.css` maps the tokens into Tailwind so `bg-primary` and `h-control-md` exist.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| OKLCH conversion, gamut clamping and WCAG contrast are hand-written (Björn Ottosson's OKLab matrices). `primary` accepts hex, `rgb()`, `hsl()` and `oklch()`; other forms (named colors, `lab()`, `color()`) throw. Logged in `docs/questions.md`. | `culori` | No doc names a color library. The four forms cover every way a theme author or the customizer writes a color; `culori` is proposed in the PR if full CSS color parsing is wanted. |
| Gamut clamping keeps lightness and hue and lowers chroma (binary search) until the color is inside sRGB | clip RGB channels | Clipping shifts hue and lightness; the scale table fixes lightness. |
| Contrast: a failing pair moves its foreground one step toward more contrast. When the foreground is already at the end of its scale (`white`, or step 50 or 950), the background moves instead, and a background's hover and active tokens move with it. Every move is in the report's `adjustments`. | move only the foreground | The default theme's dark `primary-foreground` (neutral-950) on primary-500 is about 4.2:1, and neutral-950 can't get darker. Moving primary alone would make `primary-hover` equal `primary`. |
| Pairs: `foreground` and `muted-foreground` on `background`, `surface`, `surface-raised`, `surface-sunken` and `muted`; `subtle-foreground` and `link` on `background` and `surface`; `primary-foreground` on `primary`, `primary-hover` and `primary-active`; each `<s>-foreground` on `<s>`; each `*-subtle-foreground` on its `*-subtle`; `border-control` and `ring` on `background` and `surface` at 3:1. `disabled-foreground` isn't checked. | check disabled text | WCAG 1.4.3 exempts inactive controls; disabled text is meant to read as unavailable. |
| Shadow values: `soft` is a wide, faint blur, `crisp` a tight, darker one, all `oklch(0 0 0 / a)`; `none` sets all three to `none`. Logged in `docs/questions.md`. | — | tokens.md names the knob values but no shadows. |
| Knob validation: out-of-range values, unknown enum values, a `name` that isn't kebab-case, and font stacks that aren't comma-separated family names (bare, or in matching quotes) throw an error naming the knob | a deny-list of characters | Knob files will come from the customizer (Phase 4) and font stacks are written into CSS; review r1 F1 showed `Inter(` getting past a deny-list. |
| `tokens.css` is committed and the pin test compares `generateTheme(registry/themes/default.json)` with it; `pnpm --filter @trevui/theme generate` rewrites it from the built generator | a Vitest snapshot updated with `--update` | Review r1 F15: regenerating and approving a changed pin were one step; now the diff is reviewed before commit. |
| `theme.css` maps semantic colors, radius, shadow and font through `@theme inline`; control, control padding, gap and layout sizes through `--spacing-*` and `--container-*`; durations and z-index, which have no Tailwind namespace (checked on tailwindcss.com/docs/theme, 2026-11-12), through `@utility` (`duration-fast`, `z-modal`). The default transition and ring width go through `--default-transition-*` and `--default-ring-width`. | arbitrary values | Arbitrary-value classes are banned in `registry/`. |
| Playgrounds depend on `@trevui/theme` (`workspace:*`) and import `@trevui/theme/theme.css` in place of `tailwindcss` | relative paths | Both playgrounds load the same file through the package's exports. |

**Proposals not asked for:** None

## Acceptance criteria

- **AC-001** tokens.md §Raw, §Semantic, §Shape, §Layout: `generateTheme(default)` emits every token in tokens.md on `:root`, the semantic colors again under `.dark, [data-theme="dark"]`, the durations as `0ms` under `prefers-reduced-motion: reduce`, and `page-px` as `1.5rem` from 768px.
- **AC-002** §Raw layer: each raw step has the table's lightness and the scale's hue, chroma at most base × factor, and lies inside sRGB; status scales use hues 150, 75, 25, 235 at base chroma 0.17; `neutral` uses the knob's hue and chroma.
- **AC-003** §Contrast: `checkContrast(knobs)` returns a report listing every pair, light and dark, with ratio, required ratio and pass; every pair passes for the default theme.
- **AC-004** §Contrast: a failing token moves one step at a time toward more contrast, and the move is reported and emitted.
- **AC-005** Task Accept: a snapshot test pins the default output (`packages/theme/css/tokens.css`).
- **AC-006** §Knobs: a knob outside its type or range, or text that would break the CSS, throws an error naming the knob.
- **AC-007** §Knobs: `primary` given as hex, `rgb()`, `hsl()` or `oklch()` is converted to OKLCH; another form throws.
- **AC-008** §Tailwind mapping: `theme.css` imports Tailwind and `tokens.css` and maps every semantic color and every radius, shadow, font, control, control padding and gap token.
- **AC-009** Task Accept: in the Vite playground build, `bg-primary` and `h-control-md` resolve to `var(--tre-primary)` and `var(--tre-control-md)`, and the tokens are in the CSS.
- **AC-010** Task Deliver: the Nuxt playground loads `theme.css`: its build resolves `bg-primary` and `h-control-md` to the token variables.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | packages/theme/test/theme.test.ts › generateTheme › emits every token | `pnpm vitest run packages/theme/test/theme.test.ts -t "emits every token"` |
| AC-002 | packages/theme/test/theme.test.ts › raw scales | `pnpm vitest run packages/theme/test/theme.test.ts -t "raw scales"` |
| AC-003 | packages/theme/test/theme.test.ts › checkContrast › default theme passes | `pnpm vitest run packages/theme/test/theme.test.ts -t "default theme passes"` |
| AC-004 | packages/theme/test/theme.test.ts › checkContrast › moves a failing token | `pnpm vitest run packages/theme/test/theme.test.ts -t "moves a failing token"` |
| AC-005 | packages/theme/test/theme.test.ts › generateTheme › pins the default output | `pnpm vitest run packages/theme/test/theme.test.ts -t "default output"` |
| AC-006 | packages/theme/test/theme.test.ts › knobs › rejects | `pnpm vitest run packages/theme/test/theme.test.ts -t "rejects"` |
| AC-007 | packages/theme/test/theme.test.ts › knobs › primary forms | `pnpm vitest run packages/theme/test/theme.test.ts -t "primary forms"` |
| AC-008 | packages/theme/test/theme.test.ts › theme.css | `pnpm vitest run packages/theme/test/theme.test.ts -t "theme.css"` |
| AC-009 | tests/playgrounds.test.ts › vite playground › vite playground resolves token utilities through theme.css | `pnpm vitest run tests/playgrounds.test.ts -t "vite playground resolves token utilities"` |
| AC-010 | tests/playgrounds.test.ts › nuxt playground › nuxt playground resolves token utilities through theme.css | `pnpm vitest run tests/playgrounds.test.ts -t "nuxt playground resolves token utilities"` |

## Must never break

- `registry/` code still holds no raw values: the colors live in `tokens.css` and the knob file only.
- The P0-04 playground gallery still renders the placeholder demo.

## Out of scope

- Theme items in the registry build and `trevui init` copying `theme.css` (CLI tasks); preset themes beyond `default` (P1); the customizer (Phase 4); a `ring-offset` utility (first focus ring, P0-10).

## Review

- **Recommended and chosen:** code, because `## Public Surface` isn't `- none` (two functions, a type, a command, two dependencies); chosen by the trigger list (low risk, not asked).
- **Verdicts:** built-in `code-review high --max-findings all` → `.sdlc/.work/findings/2026-11-12-m-p0-05-theme-package/code-reviewer-r1.md` → FAIL (F1 high). Round 2 closing check of the fixes → `code-reviewer-r2.md` → PASS (three lows, fixed in the same pass).
- **Fixed:**
  - F1: font stacks are allow-listed ('rejects the font stack Inter(' and four more cases).
  - F3, R2-1: CSS Color 4 parsing ('accepts primary forms', 'rejects ...').
  - F4, F6: the contrast mover keeps the ring off the fill and moves groups only within bounds ('contrast moves keep states apart').
  - F7: added `muted-hover` and `surface-raised` pairs.
  - F9, R2-2: every default-theme move is listed in `docs/questions.md`.
  - F10: `prepare` builds `dist`.
  - F11: the placeholder demo no longer overflows.
  - F12: `color-scheme` is set per mode.
  - F13: the playground assertions moved into the existing build tests; AC-010 is now tested.
  - F15, R2-3: `generate.mjs` writes `tokens.css`, and the pin test only compares.
  - F17, F18: tidied.
- **Tickets and questions:** F2: `?theme=` scoping waits for the first preset theme and P0-07. F5: moves can merge levels. F7: status colors as text. R2-2: dark ring and hover share a step. These four are open in `docs/questions.md`. F8: `ring-offset` utility and offset color (P0-10).
- **Declined:** F14: Tailwind's default palette stays available, because tokens.md gives enforcement to `no-raw-values` (P0-06). F16: the tests restate the tokens.md tables on purpose, as an independent oracle.
- **Drift and manual checks:**
  - The default theme's emitted values differ from tokens.md in 11 places, all moves by the contrast rule and listed in questions.md.
  - The placeholder demo uses token utilities.
  - Deviations: the internal module exports; the playgrounds depend on `@trevui/theme`; AC-009 and AC-010 moved into `tests/playgrounds.test.ts` (user accepted the change-file edit).
  - New devDependencies: `tsdown`, `vitest`, `tailwindcss` (also a peer). Proposed in the PR: `culori`, if full CSS color parsing is wanted.
  - No `manual` ACs.
- **Lessons filed:** [knowledge/gotchas/theme.md](../../../knowledge/gotchas/theme.md)
