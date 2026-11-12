# Questions

Gaps and conflicts found while building. Format in
[tasks/README.md](../tasks/README.md#questions). Newest first.

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
