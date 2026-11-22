# Conventions

## Repository layout

```text
apps/
  docs/              VitePress site, deployed to Cloudflare Pages
  customizer/        Vite + Vue single-page app (Phase 4)
  playground-vite/   Vite app; hosts browser and visual tests
  playground-nuxt/   Nuxt 4 app; hosts SSR tests
  example/           Example app built only on Heart UI (Phase 3)
packages/
  cli/               npm: heart-ui
  mcp/               npm: @heart-ui/mcp
  theme/             npm: @heart-ui/theme (knobs to CSS)
  eslint-plugin/     npm: @heart-ui/eslint-plugin
  chart-echarts/     npm: @heart-ui/chart-echarts (Phase 3)
registry/
  ui/<name>/         Components
  blocks/<name>/     Blocks
  layouts/<name>/    Layout templates
  themes/<name>.json Preset knob files
  lib/               Shared helpers copied with items (cn, icon resolver)
benchmark/           Screen specs, runner, scorer
docs/                Specs for contributors and agents (this folder)
tasks/               Build plan
```

## Toolchain

| Concern | Tool |
| --- | --- |
| Package manager | pnpm workspaces |
| Language | TypeScript, `strict` on; `vue-tsc` for type checks |
| Build | Vite; `tsdown` for Node packages |
| Styling | Tailwind CSS v4, CSS-first config |
| Class helpers | `class-variance-authority`, `clsx`, `tailwind-merge` |
| Unit tests | Vitest |
| Browser tests | Vitest browser mode on Playwright |
| Accessibility tests | `axe-core` inside browser tests |
| Visual tests | Playwright `toHaveScreenshot` |
| Lint | ESLint flat config with `eslint-plugin-vue` and `@heart-ui/eslint-plugin` |
| Format | Prettier |
| Releases | Changesets; npm publish with provenance |
| CI | GitHub Actions |
| Size budgets | `size-limit` (Phase 3) |

Pin exact versions in `package.json`. Use the newest stable release of each
tool at the time the task runs, and record it in the pull request.

## Item anatomy

A component named `button` owns one folder:

```text
registry/ui/button/
  Button.vue          The component
  button.variants.ts  cva definition, exported
  index.ts            Re-exports
  item.json           Registry metadata (see registry.md)
  button.md           Agent and docs page source
  button.api.json     Props, slots and events extracted from the code; generated, committed
  Button.demo.vue     Demo used by docs, visual tests, and playgrounds
  Button.test.ts      Browser test: behavior, keyboard, axe
```

Multi-part components (Dialog, Select, Tabs) add one `.vue` file per part,
named `<Component><Part>.vue`. Blocks and layouts use the same anatomy with
`item.json` carrying the extra metadata in
[registry.md](registry.md#item-metadata).

## Component API rules

- `<script setup lang="ts">`. Props declared with a typed `defineProps`.
- Shared prop names, used wherever they apply and never renamed:
  `variant`, `size`, `disabled`, `loading`, `invalid`, `as`, `asChild`.
- `size` is `sm | md | lg`, default `md`.
- `v-model` binds the main value. Extra models are named (`v-model:open`).
- Every component accepts `class` and merges it last with `cn()`.
- Root elements forward attributes. Multi-part components forward on the
  part that renders the DOM node.
- Soft limit of eight props. Past that, split into parts.
- No alias props and no second way to pass the same content.
- Slots: `default` for main content; named slots `leading`, `trailing`,
  `header`, `footer`, `empty` where they apply.
- Events use present tense verbs: `update:modelValue`, `select`, `close`.
- Text enters by prop or slot. Accessible names the component must supply
  itself are props named `*Label` with an English default (`closeLabel`).
- Icons render through `registry/lib/icon`, never an icon package import.
  Its set file bundles each icon's SVG data, so nothing loads from the
  Iconify API. To add one, add `name: { id: 'fluent:<icon>' }` to
  `sets/fluent.ts` and run `pnpm icons`; the unit tests fail when the file is
  stale.
- Styles are Tailwind utilities mapped to tokens
  ([tokens.md](tokens.md#tailwind-mapping)). No `<style>` blocks except
  for keyframes that utilities cannot express.
- Logical properties only: `ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`.
- SSR-safe: no `window` or `document` at setup time; ids from `useId()`.

## Definition of done

An item is done when all of these hold. The task check command verifies
the first six.

1. `pnpm check:item <name>` passes.
2. Browser test covers each variant, each state, and full keyboard use.
3. axe reports zero violations for every demo state.
4. Visual baselines exist for all preset themes in light and dark; blocks
   and layouts at 375, 768, and 1280 px.
5. The demo renders under Nuxt SSR with no hydration warning.
6. `item.json` validates and the registry build includes the item.
7. `<name>.md` follows [templates/component-spec.md](templates/component-spec.md)
   and includes do and do-not examples.
8. A changeset describes the change.
9. A human approved the visual baselines.

## Reference components

`button`, `input`, and `dialog` are the reference set once task P0-13
closes. Copy their file structure, test structure, and prop style. When a
later component needs a pattern they lack, add it to this file in the same
pull request.

| Pattern | Reference |
| --- | --- |
| Single-element component with variants | `button` |
| Form control with `v-model`, `invalid`, and slots | `input` |
| Multi-part component over a Reka primitive, with a portal | `dialog` |
| Text only screen readers hear, from a `*Label` prop (`sr-only`) | `label` |
| Reka control inside a `label` that wraps it and its text slot; `state-*` variants for `data-state` | `checkbox` |
| Hidden native input for forms under a Reka control (`registry/lib/form-control`: focus hand-off, form events on user changes, `id` on the control) | `checkbox`, `radio-group`, `switch`, `select` |
| Parts sharing state through a provided context, including a fix to a Reka root context the primitive leaves stale (the image's name relayed to the fallback; the loading status reset when the last image goes) | `avatar` |

## Checks

`pnpm check` runs, in order: `lint`, `typecheck`, `test:unit`,
`test:browser`, `test:visual`, `test:ssr`, `registry:build`, `test:cli-e2e`. Each is also
a standalone script. `check:item <name>` filters every step to one item.
CI runs `pnpm check` on each pull request and blocks merge on failure.

## Docs site

VitePress in `apps/docs`. A build step turns each `<name>.md` plus its demo
into a page with live preview, API table (generated from the component's
types), and accessibility notes. The same Markdown is published raw for
agents ([agent-support.md](agent-support.md#agent-docs)).

- The `<name>.md` Props, Slots and Events tables are the spec, written
  before the code. On the docs page each becomes one merged table: names,
  types, defaults and payloads from the code; notes from the spec (JSDoc
  when the spec cell is empty). A multi-part item's tables have a `Part`
  column.
- The docs build fails when a prop, slot or event is in the spec but not
  the types, or in the types but not the spec, or when a default differs.
  It also fails when the types have members of a kind that the spec has no
  table for. `class` and `style` may be listed without being in the types;
  a prop whose type includes boolean and has no default equals `false`.
  `none` means no default; write a string default plainly (`md`), and quote
  it only when it would read as no default (`''`, `'none'`).
- `<name>.api.json` is generated from the code by `pnpm registry:api` and
  committed; `pnpm check` fails when it is stale, so an API change always
  shows in review. Removing or renaming a
  prop, slot or event is breaking ([registry.md](registry.md#api-snapshots)).
- The `vue` examples under `## Usage` and `## Do` are type-checked against
  the registry with `strictTemplates` (`scripts/spec-examples.ts`, run by
  `pnpm typecheck`); `## Do not` examples are not. An example may read page
  state it doesn't declare (`save`, `country`) and pass global HTML
  attributes, `aria-*`, `data-*` and element events (`@click`) to a
  component's root; form attributes and events (`type`, `name`, `required`,
  `@change`) only to a component that renders a native field. Field state
  (`value`, `checked`) never falls through. Any other unknown prop, event
  or component fails, and examples are template-only. `check:item <name>`
  checks the item's spec and every spec whose examples use its components. Router, Nuxt and
  Vue built-in components need no import.
- `docs/layout-rules.md` and `docs/tokens.md` are published as `/guide/`
  pages. A link to them, or to another published item, becomes a site
  link; any other relative link keeps only its text.

## Git and pull requests

- Branch: `task/<task-id>-<slug>`. One task per pull request.
- Commit style: Conventional Commits.
- Pull request body: task id, what changed, check output summary, new
  dependencies with reasons, entries added to `docs/questions.md`.
