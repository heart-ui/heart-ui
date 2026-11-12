# Questions

Gaps and conflicts found while building. Format in
[tasks/README.md](../tasks/README.md#questions). Newest first.

- 2026-11-12 P0-08: registry.md lists which `meta` fields apply to each
  kind but not which are required. Chose: only `version` is required; a
  field that doesn't apply to the kind fails. Why: no doc says `tier` or
  `useWhen` is mandatory; the first component and block tasks should
  decide, and the build then requires them per kind.
- 2026-11-12 P0-08: item files import each other by relative path
  (`icon.ts` imports `../utils/utils`), which assumes the CLI keeps `lib/`
  items side by side under the `lib` alias. Chose: keep relative imports.
  Why: the registry sources need no path alias to compile in this repo;
  the CLI task (`trevui add`, "Rewrite import aliases") should decide
  whether sources use `@/lib/...` instead.
- 2026-11-12 P0-08: no doc limits item names. Chose: lowercase letters,
  digits, `-` and `_`, starting with a letter or digit. Why: the name is
  both a file name (`r/<name>.json`) and a URL segment, and two names that
  differ only in case would overwrite each other on macOS. P2-03 plans a
  `blocks/_fixtures` folder of sample data, which this rule and the fixture
  rule both reject; P2-03 should add an exemption (for example, skip
  folders starting with `_`).
- 2026-11-12 P0-08: `@iconify/vue` loads icon data from the Iconify API at
  runtime, so SSR output and visual baselines depend on the network. Chose:
  keep the online loader for now. Why: the task names Iconify only; P0-07
  should decide on bundled data (`@iconify-json/fluent` with
  `addCollection`) when it builds the SSR and visual tests.
- 2026-11-12 P0-08: is a folder without `item.json` an error? Chose: a
  folder under `ui/`, `blocks/` or `layouts/` holding only demos
  (`*.demo.vue`), tests (`*.test.ts`), docs (`*.md`) and dotfiles is a
  fixture and is skipped (the P0-04 placeholder); dot-folders are ignored;
  any other folder without `item.json`, and any file sitting directly under
  a kind folder, fails the build. Why: fixtures stay out of the shipped
  registry, and a forgotten `item.json` still fails.
- 2026-11-12 P0-08: validating against the upstream JSON schema needs a
  validator, which no doc names. Chose: `ajv` 8.20.0 (the schemas are
  draft-07). Why: the standard JSON Schema validator for Node. Proposed in
  the pull request.

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
