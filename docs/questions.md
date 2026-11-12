# Questions

Gaps and conflicts found while building. Format in
[tasks/README.md](../tasks/README.md#questions). Newest first.

- 2026-11-12 P0-04: the task says `theme` "sets the theme file", but no
  theme file exists before P0-05, and `data-theme="dark"` already means dark
  mode in tokens.md. Chose: `theme` sets `data-tre-theme="<name>"` on
  `<html>` (default `default`, only `[a-z0-9-]+` accepted); P0-05 loads the
  theme's CSS by that attribute. Why: keeps `data-theme` for dark mode.
- 2026-11-12 P0-04: where does "the placeholder demo" live? Chose:
  `registry/ui/placeholder/Placeholder.demo.vue`, an item, with
  `/demo/<name>` named by the item folder. Why: P0-07 and P0-09 check it as
  an item (`check:item placeholder`).

- 2026-11-12 P0-05: tokens.md says `primary` is "any CSS color", but no doc
  names a color library. Chose: hand-written OKLCH math that accepts hex,
  `rgb()`, `hsl()` and opaque `oklch()`; named colors, `lab()` and
  `color()` throw. Why: no new dependency; `culori` is proposed in the pull
  request if full CSS color parsing is wanted.
- 2026-11-12 P0-05: tokens.md names the `shadow` knob values but not the
  shadows. Chose: `soft` is a wide, faint blur, `crisp` a tight, darker
  one, all `oklch(0 0 0 / a)`. Why: closest to common UI kits; revisit with
  the visual baselines.
- 2026-11-12 P0-05: Tailwind v4 has no theme namespace for durations or
  z-index (tailwindcss.com/docs/theme, 2026-11-12). Chose: `@utility`
  classes in `theme.css`: `duration-fast|normal|slow` and
  `z-sticky|overlay|modal|popover|toast|tooltip`. Why: arbitrary values are
  banned in `registry/`.
- 2026-11-12 P0-05: tokens.md says a failing token moves toward more
  contrast, but in the default dark theme `primary-foreground`
  (neutral-950) is already the darkest step. Chose: the background moves
  instead, and `primary-hover`, `primary-active` and `ring` move with it,
  so `primary` and the ring stay distinct. tokens.md maps dark `ring` and
  `primary-hover` to the same step (primary-400), so they share a step
  before and after any move; only the ring offset separates them on a
  hovered, focused button. `disabled-foreground`
  isn't checked (WCAG 1.4.3 exempts inactive controls). The default theme
  therefore differs from the semantic table in 11 places, all listed in
  `checkContrast(knobs).adjustments`: light `border-control` 400→500; dark
  `muted-foreground` 400→300, `subtle-foreground` 500→400,
  `border-control` 600→500, `primary` 500→400, `primary-hover` 400→300,
  `primary-active` 300→200, `ring` 400→300, and `warning`, `danger`,
  `info` 500→400. Moves can make two levels share a step (dark
  `subtle-foreground` and `muted-foreground` stay apart only by luck).
  Open: should tokens.md's table change to values that pass, so the
  generator never has to move them, and give dark `ring` a step of its
  own?
- 2026-11-12 P0-05: status colors (`danger`, `warning`, ...) are fills;
  tokens.md pairs only their `-foreground` and `-subtle-foreground`. Chose:
  don't check `text-danger` on page backgrounds. Open: if field errors use
  `text-danger`, add a text token (for example `danger-text`) rather than
  moving the fill.
- 2026-11-12 P0-05: the playgrounds set `data-tre-theme` from `?theme=`,
  but `tokens.css` is scoped to `:root` and only the default theme exists.
  Chose: leave per-theme scoping to the first preset theme and the P0-07
  visual runner. Why: tokens.md defines `:root` output; scoping changes
  the file shape for every theme.

- 2026-11-12 P0-03: conventions name ESLint with eslint-plugin-vue and
  Prettier, but not the packages that make them work together. Chose: add
  `typescript-eslint` (parser for `.ts` and `<script lang="ts">`),
  `@eslint/js` (core recommended rules) and `eslint-config-prettier` (turns
  off rules that clash with Prettier), approved by the maintainer. Why: the
  setup eslint-plugin-vue's user guide prescribes; TypeScript can't be
  linted without a TS parser.
- 2026-11-12 P0-03: "newest stable release" (TypeScript 7.0.2) conflicts
  with `vue-tsc`, which conventions require. `vue-tsc` 3.3.14 fails on TS 7
  (it has no JS compiler API) and `typescript-eslint` 8.72.2 accepts only
  `<6.1.0`. Chose: pin TypeScript 6.0.3, approved by the maintainer. Why:
  newest release that `vue-tsc` and `typescript-eslint` support; revisit
  when both support TS 7.
