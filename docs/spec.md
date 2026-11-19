# Product spec

## Product

Heart UI is an open source (MIT) Vue 3 UI library built on Reka UI. Users copy
source into their project with a CLI and own it. Three properties set it
apart from other Vue libraries:

- Six theme knobs produce a complete light and dark theme.
- A catalog of layout templates and blocks covers whole screens.
- Coding agents are a supported user: MCP server, Markdown docs per item,
  written layout rules, and a published benchmark.

The name reads as *tre* (bamboo) + Vue + UI, and as *tre vui* (happy bamboo).
Brand spelling is `Heart UI`; packages, CLI, and repo use `heart-ui`.

## Goals

1. A complete, accessible theme from six knobs in under two minutes.
2. Every item is editable source in the user's repo.
3. A new screen starts from a layout template and blocks.
4. A coding agent can find, install, and correctly use items without guessing.
5. One library covers a typical business app, including data table, dates,
   forms, and charts.
6. WCAG 2.2 AA, SSR-safe, strictly typed, tested in a real browser.

## Non-goals

- Own headless primitives. Reka UI owns focus, keyboard, and ARIA.
- React, Svelte, or Vue 2 support.
- A drag-and-drop page builder.
- Runtime generative UI.
- A migration path from `bigin-ui`. That library stays as it is.

## Deliverables

| Deliverable | Detail | Spec |
| --- | --- | --- |
| Token system and themes | Three token layers, six knobs, five presets | [tokens.md](tokens.md) |
| Components | 45 in three tiers | [components/index.md](components/index.md) |
| Layouts and blocks | 8 layouts, 20 blocks | [layout-rules.md](layout-rules.md) |
| CLI and registry | `init`, `add`, `list`, `diff`, `update`, `theme` | [registry.md](registry.md) |
| Agent support | MCP server, agent docs, benchmark | [agent-support.md](agent-support.md) |
| Customizer | Static web app that edits knobs and exports a theme | [tasks/phase-4.md](../tasks/phase-4.md) |
| Docs site | One page per item, guides | [conventions.md](conventions.md#docs-site) |

## Decisions

| Topic | Decision |
| --- | --- |
| Primitives | Reka UI |
| Styling | Tailwind CSS v4 reading token variables |
| Registry schema | shadcn registry format |
| Minimum versions | Vue 3.5, Nuxt 4, Node 22 |
| Charts | Unovis by default; other engines as separate packages |
| Icons | Fluent by default, swappable |
| Hosting | Cloudflare Pages and R2 |
| Who builds | Coding agents build; one human reviews |
| Benchmark | 80% pass at beta, 90% at 1.0, run on Claude Code |

## Release stages

| Stage | After | Exit gate |
| --- | --- | --- |
| Pilots | Phase 0 | Button, Input, Dialog meet the full definition of done |
| Alpha | Phase 1 | A new Nuxt app and a new Vite app install and render all Tier 1 components from the CLI |
| Beta | Phase 2 | Benchmark pass rate at or above 80% |
| Release candidate | Phase 3 | No open high-severity accessibility or SSR bug; one example app built only on the library |
| 1.0 | Phase 4 | Every item meets the definition of done; public API frozen |

## Success measures

| Measure | Target |
| --- | --- |
| `init` to a themed first screen | Under 10 minutes |
| Complete custom theme in the customizer | Under 2 minutes |
| Benchmark pass rate | 80% at beta, 90% at 1.0 |
| Automated accessibility violations | 0 |
| Items passing visual tests in all themes | 100% |
| Unmodified items that `update` cleanly | 100% |

## Open items

- Confirm the npm scope `@heart-ui`, the GitHub organization, and a domain.
  Settled 2026-11-19: the npm package `heart-ui` and the `@heart-ui` org
  scope belong to the maintainer; the GitHub organization is `heart-ui`
  (github.com/heart-ui); the docs are at `heart.tammai.me` and the registry
  at `registry.heart.tammai.me`, a subdomain of the maintainer's domain.
  Docs in this repo assume `@heart-ui`; rename in one commit if it is taken.
