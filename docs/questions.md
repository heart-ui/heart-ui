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
  names a color library. Answered by the maintainer: add `culori` (4.0.2)
  and parse with it; translucent colors are rejected. `@types/culori`
  (4.0.1, devDependency) approved by the maintainer too. The OKLCH math,
  clamping and contrast stay hand-written.
- 2026-11-12 P0-05: tokens.md names the `shadow` knob values but not the
  shadows. Chose: `soft` is a wide, faint blur, `crisp` a tight, darker
  one, all `oklch(0 0 0 / a)`. Why: closest to common UI kits; revisit with
  the visual baselines.
- 2026-11-12 P0-05: Tailwind v4 has no theme namespace for durations or
  z-index (tailwindcss.com/docs/theme, 2026-11-12). Chose: `@utility`
  classes in `theme.css`: `duration-fast|normal|slow` and
  `z-sticky|overlay|modal|popover|toast|tooltip`. Why: arbitrary values are
  banned in `registry/`.
- 2026-11-12 P0-05: tokens.md's semantic table named steps that fail its
  own contrast rule (every scale shares the table's lightness, so a 500
  step on neutral-950 is about 4.2:1 for any hue); the generator moved 11
  tokens for the default theme. Answered by the maintainer: change the
  table to passing steps. Light `border-control` 500; dark
  `muted-foreground` 300, `subtle-foreground` 400, `border-control` 500,
  `primary` / `-hover` / `-active` 400 / 300 / 200, `ring` primary-500 (its
  own step, no longer shared with `primary-hover`), each status 400. The
  default theme now needs no moves (tested). The moves stay for custom
  knobs: a background that moves takes `primary-hover`, `primary-active`
  and `ring` with it. `disabled-foreground` isn't checked (WCAG 1.4.3).
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

- 2026-11-12 P0-06: tokens.md bans the `dark:` variant but does not mention
  CSS `light-dark()` or `color-mix()`. Chose: `no-raw-values` reports
  `light-dark()` as a dark variant (it styles each mode separately, which
  tokens own) and allows `color-mix()` when its colors are all tokens
  (`color-mix(in oklab, var(--tre-primary) 50%, transparent)`). Why: same
  intent as the `dark:` ban; token-only mixes are how translucent overlays
  are written.

- 2026-11-12 P0-06: tokens.md's lint rule section lists five kinds of raw
  value, but constitution II and CLAUDE.md also ban pixel and rem literals
  and say the plugin enforces it. Chose: `no-raw-values` also reports `px`
  and `rem` literals. Why: the constitution is the stricter source; numeric
  spacing utilities (`p-4`) stay allowed.

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
