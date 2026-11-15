# Questions

Gaps and conflicts found while building. Format in
[tasks/README.md](../tasks/README.md#questions). Newest first.

- 2026-11-15 Working mode for phases 1–4. The maintainer (2026-11-15):
  "you build all planned tasks by yourself, when done i will do only 1
  review round with you." So, until that review: a task whose dependencies
  are in `review` is ready (the rule asks for `done`); the phase gates
  (P1-21, P2-56, P3-28) and the human sign-offs inside tasks (baseline
  approval, "human decides", "human reviews each fix") wait for that one
  round; tasks with `Owner: human` (releases, credentials, the accessibility
  audit) are skipped and listed for it. The agent still never marks a task
  `done`, and still records each call it makes here.
- 2026-11-15 P1-07: calls in `dropdown-menu`, decided by the agent. (1) A
  danger item reads `danger-subtle-foreground` (and `danger-subtle` when
  highlighted), not `text-danger`: status fills aren't text (P0-05). (2) The
  sub trigger's chevron follows Reka's menu direction (its root context),
  which also drives the arrow keys; Reka defaults to LTR, so an RTL app sets
  `dir` on Reka's `ConfigProvider`. (3) The demo starts closed and the
  menu's own test opens it (and a submenu) for axe, as for `select`. (4) Not
  built: `DropdownMenuGroup`, `Arrow` and `Filter`, which the catalog row
  doesn't list. (5) The spec gained a `DropdownMenuTrigger` `disabled` row
  during the build: Reka's trigger has the prop, and the docs check requires
  every typed prop in the spec. (6) Gap for a theme task: the resting danger
  item puts `danger-subtle-foreground` on `surface-raised`, a pair the theme
  generator doesn't check (it checks it on `danger-subtle`); axe passes it in
  the default theme. (7) A long menu is capped with Reka's
  `--reka-dropdown-menu-content-available-height` in a style binding (an
  arbitrary-value class is banned) and scrolls. (8) The 4 between trigger and
  menu is Reka's `side-offset`, a number in pixels its API takes; no spacing
  token maps to it, and a caller's value wins.
- 2026-11-15 P1-06: calls in `select`, decided by the agent. (1) `size`,
  `invalid` and `placeholder` are `SelectTrigger` props (what they style);
  the root holds `v-model`, `v-model:open`, `disabled`, `name`, `required`.
  (2) The list uses Reka's `item-aligned` position: `popper` needs Reka's
  `--reka-select-*` variables in arbitrary-value classes, which `registry/`
  bans. (3) The trigger renders its own hidden native `select` for forms,
  as the other controls do: Reka's can't take focus when validation fails.
  It lists every registered option (so autofill works) and lies over the
  trigger in a positioned box, which is `display: contents` when the select
  has no `name`, so unnamed selects keep their layout. Reka always gets
  `null` rather than `undefined`, or it keeps its own value and shows a
  choice the parent rejected. (4) An open list hides the page
  (the modal listbox pattern, so axe on the whole page flags the hidden,
  focusable triggers), so the demo starts closed: the every-demo axe check
  sees the page, and the select's own test opens the list and checks it on
  its own, after its fade-in. Gap: the visual baseline shows no open list,
  since the runner can't click (as for the dialog, P0-12); a runner hook
  that opens a demo's list before the screenshot would close it.
- 2026-11-15 P1-05: calls in `switch`, decided by the agent. (1) A new lib
  item `form-control` holds what `checkbox`, `radio-group` and `switch`
  share: handing focus from the hidden form input to the control and firing
  `input`/`change` on user changes. Reka, given an `id`, copies the text of
  any `[for=id]` label (hidden marks included) into a stale `aria-label`;
  `switch` passes the caller's `aria-label` to override it,
  and `checkbox` and `radio-group` (Reka builds an unescaped selector)
  renders its own button with `as-child`, so Reka never gets the `id`. (2)
  The switch thumb slides with `margin-inline-start`, so it follows the
  element's own direction. Tailwind's `rtl:` also matches an LTR switch
  inside an RTL page, and a `:dir(rtl)` variant is rewritten by the
  production build into `:lang(…)` (a test checks the built CSS). (3) The
  switch thumb carries a transparent border and the radio dot is drawn by a
  border in its own colour: when Windows forces colours, backgrounds drop
  and borders take the system text colour, so both stay visible. (4) Hover uses
  `muted-foreground` (off) and `primary-hover` (on), and the thumb
  `shadow-sm`, as other controls do. (5) Items stay at 0.1.0 while they
  change before the first registry publish (P1-18); versions start moving
  from that publish on. The exception was `icon`, already part of P0.
- 2026-11-15 P1-04: two calls in `radio-group`, decided by the agent. (1)
  `orientation` sets the layout only. The ARIA radio group pattern moves
  with all four arrow keys, and Reka narrows them to one axis when given an
  orientation, so Reka gets none; as a result the group has no
  `aria-orientation` (optional for a radio group). (2) Each item renders a
  native radio input under its radio for forms, instead of Reka's: Reka's
  input submits the field with an empty value (`plan=`) when nothing is
  chosen and sits at the corner of a far ancestor, where the browser's
  validation bubble then points. `required` needs `name`, as it does for
  Reka, and is only announced with one. The hidden inputs of `checkbox` and
  `radio-group` hand focus to the visible control (form validation focuses
  them) and fire `input` and `change` on the form, as native controls do.
- 2026-11-15 P1-03: three calls in `checkbox`, decided by the agent. (1) A
  disabled checkbox dims only its box; the label text turns
  `muted-foreground` instead of half opacity, which failed axe contrast in
  light mode. Disabled text is exempt from WCAG 1.4.3, but readable is
  better and keeps axe at zero. (2) `theme.css` gains `state-checked`,
  `state-unchecked` and `state-indeterminate` variants, like `state-open`
  (P0-12), for Reka's `data-state` without arbitrary variants. (3) The
  `icon` item gains `check-sm` and `minus-sm` (12px filled Fluent glyphs; a
  20px regular stroke is too thin drawn at 10–14px in a 14–20px box) and
  moves to 0.2.0, so projects that installed 0.1.0 see the change. Like
  `state-open`, the new variants live in the shared `theme.css`, which
  `heart-ui add` won't update in an existing project: `checkbox` depends on
  the per-item `css` field the CLI task builds (P0-10 answer). (4) The
  checkbox renders its own hidden native input for forms, so indeterminate
  submits nothing and fails `required`, as a native checkbox does. Reka also
  reads a name from a Reka `Field` wrapper; `form` (P2-19) must pass the
  name through `Checkbox`, not a Reka `Field`.
- 2026-11-15 P1-02: tokens.md has horizontal control padding
  (`control-px-*`) but no vertical one, and control padding must use
  tokens. Chose (delegated to the agent): the textarea uses
  `py-control-px-sm` (0.5rem) at every size, and shares `input`'s radius
  (`rounded-input`) instead of a new token. Why: at default density, 0.5rem
  is within a pixel of `input`'s text inset at `md` and `lg`, and one empty
  line is 2px taller than an input (its border); at `sm` it is 6px taller.
  Other densities scale padding and control heights differently, so the gap
  grows a little (compact `md`: 4px). `size` sets padding and text; the
  height comes from `rows` or the content. A `control-py-*` token would
  need a task that adds tokens.
  **Decided (agent, delegated by the maintainer, 2026-11-15):** keep it; no
  new token. Revisit only if a later multi-line control (a combobox list, a
  tag input) needs to line up exactly with an `input`.
- 2026-11-15 P1-01: the label's required marker needs a glyph, but the
  Fluent set has no asterisk icon, and user-facing text must enter by prop.
  Chose (delegated to the agent): an `aria-hidden` `*` after the text, in
  `muted-foreground`; screen readers hear the `requiredLabel` prop (default
  `required`) instead. Why: the `*` is a symbol no one reads, and the
  words a screen reader speaks still enter by a `*Label` prop. Not
  `text-danger`: status fills aren't used as text (P0-05 below).
  Open for the maintainer (review r1): with `required` on the control too,
  as the spec advises, screen readers say "required" twice ("Email
  required, edit text, required"). The catalog row asks for the hidden
  text, so it stays; the alternative is no hidden text, relying on the
  control's own `required`.
  **Decided (agent, delegated by the maintainer, 2026-11-15):** keep the
  hidden text and the `*`. The hidden text still tells a screen reader user
  a field is required when the control lacks `required` (a custom control,
  a form that validates in script); one extra word is the smaller cost.
- 2026-11-14 P0-13: no doc names the tool that reads a component's types
  for the API table. Chose (delegated to the agent): `vue-component-meta`
  3.3.14, a dev dependency of `apps/docs`. Why: it is the Vue language
  tools' own extractor, the same release as `vue-tsc`, so the table reads
  types exactly as the typecheck does. `apps/docs` also pins `vite` 5.4.21,
  the version VitePress 1.6.4 bundles, so `@tailwindcss/vite` binds to it
  and not to the playground's Vite 8.
  **Answered (maintainer, 2026-11-15):** approved.
- 2026-11-14 P0-13: an item's Markdown already has hand-written Props,
  Slots and Events tables, and the task asks for an API table generated
  from the types. Chose (delegated to the agent): the docs page keeps the
  Markdown as written and adds a generated `## API` section before
  `## Props`. Why: the hand-written tables carry notes the types don't, and
  agents read the same Markdown raw. Revisit at the P0-14 review: either
  drop the hand-written tables or keep both.
  **Answered (maintainer, 2026-11-14):** keep the hand-written tables as the
  spec; the docs page shows one merged table per section (types and defaults
  from the code, notes from the spec), and the build fails when they
  disagree. Moved into
  [conventions.md, Docs site](conventions.md#docs-site).
- 2026-11-14 P0-13: an item's Markdown links to repo docs
  (`../../../docs/layout-rules.md`), which the docs site doesn't publish
  yet, and VitePress fails the build on a dead link. Chose (delegated to
  the agent): links to another item's Markdown become that item's page;
  other relative links become their plain text. Why: P2's agent-docs task
  publishes `layout-rules.md` and `tokens.md`; it can turn those links back
  on.
  **Answered (maintainer, 2026-11-14):** publish `layout-rules.md` and
  `tokens.md` now as `/guide/` pages and link to them; other repo docs stay
  plain text. Moved into [conventions.md, Docs site](conventions.md#docs-site).
- 2026-11-14 P0-13: the live preview runs in an `iframe` of a bare
  `/demo/<name>` page, answering the P0-12 entry below. VitePress's base
  styles are unlayered and override Tailwind's layered utilities, so demo
  pages reset every property to the layered value (`all: revert-layer`).

- 2026-11-14 P0-12: no doc names the enter and exit animations for overlays,
  or how to style Reka's `data-state` without arbitrary variants
  (`data-[state=open]:`). Chose (delegated to the agent): `theme.css` adds
  `animate-fade-in`, `-fade-out`, `-pop-in` and `-pop-out`, timed by
  `--tre-duration-normal` (0 ms under reduced motion), and the custom
  variants `state-open` and `state-closed`. Why: no animation package is
  named, and every later Reka part with `data-state` (popover, select,
  tooltip, drawer) reuses them. Like `--radius-dialog`, they move into
  `item.json`'s `css` field with the CLI task.
- 2026-11-14 P0-12: the visual runner can't click, so a dialog demo that
  starts closed records only its trigger buttons. Chose (delegated to the
  agent): the dialog demo opens its main dialog on load. Why: Definition
  of done 3 and 4 need the open dialog under axe and in the baseline, and
  the runner has no hook for a click before the screenshot. P0-13 should
  make sure the docs page's live preview doesn't open a modal over the page
  (for example, render the preview in an iframe).

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
  `theme.css` and the `utils` item's `cn()` config, which `heart-ui add`
  won't update in a project that already has them. Answered 2026-11-13 by
  the maintainer: each item carries its mapping in `item.json`'s `css`
  field (`@theme inline { --radius-button: … }`) and `heart-ui add` merges it
  into the user's `theme.css`; `cn()` recognises component utilities by
  pattern (any `rounded-<word>`) instead of a hand-kept list. Built in the
  CLI task.
- 2026-11-13 P0-10: conventions name the file `Button.vue`, but
  eslint-plugin-vue's `multi-word-component-names` rejects single-word
  names. Decided by the agent: keep the rule and give each component a
  `Trev`-prefixed name with `defineOptions` (`TrevButton`), as `Icon` does.
  **Answered (maintainer, 2026-11-15):** the prefix is `H` (`HButton`), and
  every `tre` name becomes Heart UI's: tokens `--h-*`, `data-heart-theme`,
  keyframes `heart-*`.
- 2026-11-13 P0-10: registry items aren't npm packages, but the definition
  of done asks for a changeset. Decided by the agent: an empty changeset
  (no package bump) whose summary describes the item.

- 2026-11-12 P0-07: the visual runner walks every theme in
  `registry/themes/`, but the playgrounds load only the default theme's
  `tokens.css`, so a second theme would render as the default. Decided by
  the agent (maintainer delegated decisions): keep one theme's CSS until
  the first preset theme lands; that task scopes each theme under
  `[data-tre-theme="<name>"]` and loads them all in the playgrounds.
  **Answered (maintainer, 2026-11-15):** ok.
- 2026-11-12 P0-07: visual baselines need human approval, but the
  maintainer reviews only the final product. Decided by the agent: generate
  the baselines with `pnpm test:visual --update` and flag them in the
  summary. Answered 2026-11-13: the maintainer approved the placeholder and
  button baselines (light and dark) and marked P0-05 to P0-10 done.
  Answered 2026-11-15: the maintainer approved the input and dialog
  baselines (light and dark) and marked P0-11 to P0-14 done. Later the same
  day: approved the label and textarea baselines (light and dark).
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
  **Answered (maintainer, 2026-11-15):** ok.
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
  **Answered (maintainer, 2026-11-15):** ok.
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
  **Answered (maintainer, 2026-11-15):** bundle the icon data.
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
  **Answered (maintainer, 2026-11-15):** approved.

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
