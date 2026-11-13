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

- 2026-11-13 P0-10: a component token (`--tre-button-radius`) must fall
  back to its semantic token, but `registry/` bans arbitrary values such as
  `rounded-(--tre-button-radius)`. Decided by the agent (maintainer
  delegated decisions): `theme.css` maps each component token as a theme
  key with its fallback (`--radius-button: var(--tre-button-radius,
  var(--tre-radius-md))`), used as `rounded-button`. `cn()` learns each
  new key (`registry/lib/utils`).
- 2026-11-13 P0-10: the button spec said the spinner replaces the
  `leading` slot, and also that the width doesn't change when `loading`
  toggles; a leading icon of another size, or an empty slot, broke the
  second. Decided by the agent: the spinner always sits over the content,
  which turns transparent but stays in place and in the accessibility tree.
  The spec now says so.
- 2026-11-13 P0-10: tokens.md has `primary-hover` and `primary-active` but
  no hover or pressed tokens for `danger` or `muted` (secondary). Decided
  by the agent for now: `danger` darkens with an opaque `brightness-95` and
  `-90` filter (never a translucent fill), and secondary has no separate
  pressed color. Answered 2026-11-13 by the maintainer: add
  `danger-hover`, `danger-active` and `muted-active`, following primary's
  steps (light 700/800, dark 300/200; muted-active neutral-300 light,
  neutral-600 dark).
- 2026-11-13 P0-10: a component token's mapping lives in the shared
  `theme.css` and the `utils` item's `cn()` config, which `trevui add`
  won't update in a project that already has them. Answered 2026-11-13 by
  the maintainer: each item carries its mapping in `item.json`'s `css`
  field (`@theme inline { --radius-button: … }`) and `trevui add` merges it
  into the user's `theme.css`; `cn()` recognises component utilities by
  pattern (any `rounded-<word>`) instead of a hand-kept list. Built in the
  CLI task.
- 2026-11-13 P0-10: conventions name the file `Button.vue`, but
  eslint-plugin-vue's `multi-word-component-names` rejects single-word
  names. Decided by the agent: keep the rule and give each component a
  `Trev`-prefixed name with `defineOptions` (`TrevButton`), as `Icon` does.
- 2026-11-13 P0-10: registry items aren't npm packages, but the definition
  of done asks for a changeset. Decided by the agent: an empty changeset
  (no package bump) whose summary describes the item.

- 2026-11-12 P0-07: the visual runner walks every theme in
  `registry/themes/`, but the playgrounds load only the default theme's
  `tokens.css`, so a second theme would render as the default. Decided by
  the agent (maintainer delegated decisions): keep one theme's CSS until
  the first preset theme lands; that task scopes each theme under
  `[data-tre-theme="<name>"]` and loads them all in the playgrounds.
- 2026-11-12 P0-07: visual baselines need human approval, but the
  maintainer reviews only the final product. Decided by the agent: generate
  the baselines with `pnpm test:visual --update` and flag them in the
  summary. Answered 2026-11-13: the maintainer approved the placeholder and
  button baselines (light and dark) and marked P0-05 to P0-10 done.
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
  don't check `text-danger` on page backgrounds. Decided by the agent
  (maintainer delegated decisions): components don't use status fills as
  text. The first component that needs error or status text (input, P0-11)
  adds `<s>-text` tokens checked on `background` and `surface`, in a task
  that says to add tokens.
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
- 2026-11-12 P0-08: registry.md lists which `meta` fields apply to each
  kind but not which are required. Chose: only `version` is required; a
  field that doesn't apply to the kind fails. Why: no doc says `tier` or
  `useWhen` is mandatory; the first component and block tasks should
  decide, and the build then requires them per kind.
- 2026-11-12 P0-08: item files imported each other by relative path,
  which breaks once the CLI writes `ui` and `lib` under different aliases.
  Decided by the agent (P0-10 review): registry code imports shared code as
  `@/lib/...`, the `lib` alias registry.md names, mapped to `registry/lib`
  in the repo's tsconfig and Vite configs; the registry build rejects a
  relative import that leaves its item.
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
