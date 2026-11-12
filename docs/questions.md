# Questions

Gaps and conflicts found while building. Format in
[tasks/README.md](../tasks/README.md#questions). Newest first.

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
