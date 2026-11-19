# Phase 0: Foundations

Goal: prove the full pipeline on three components before repeating it.
Order: P0-01 may run any time; P0-02 to P0-09 in sequence; then the pilots.

## Setup

### P0-01 Secure the name

- Status: todo
- Owner: human
- Depends on: none
- Deliver: npm package `heart-ui` and scope `@heart-ui` reserved; GitHub
  organization; domain. Update "Open items" in `docs/spec.md`.
- Accept: all four exist, or the docs are renamed in one commit.
- Note (agent): 2026-11-19, the npm name and scope were already the
  maintainer's; the agent created the GitHub org `heart-ui` with the
  maintainer's approval; the domain is the maintainer's subdomain
  `heart.tammai.me` (registry at `registry.heart.tammai.me`); both hosts
  are live.

### P0-02 Workspace scaffold

- Status: done
- Owner: agent
- Depends on: none
- Read: [conventions.md](../docs/conventions.md#repository-layout)
- Deliver: root `package.json`, `pnpm-workspace.yaml`, base `tsconfig`,
  every folder in the layout with a stub package, `.nvmrc` (22), MIT
  `LICENSE`, `.gitignore`, `.editorconfig`, README stub.
- Accept: fresh clone installs with no warnings about missing workspaces.
- Check: `pnpm install --frozen-lockfile`

### P0-03 Lint, format, typecheck

- Status: done
- Owner: agent
- Depends on: P0-02
- Read: [conventions.md](../docs/conventions.md#toolchain)
- Deliver: ESLint flat config, Prettier config, `vue-tsc` setup; root
  scripts `lint`, `format`, `typecheck`.
- Accept: scripts pass on the scaffold and fail on a seeded error.
- Check: `pnpm lint && pnpm typecheck`

### P0-04 Playgrounds

- Status: done
- Owner: agent
- Depends on: P0-03
- Deliver: `apps/playground-vite` and `apps/playground-nuxt` with Tailwind
  CSS v4. Both import items straight from `registry/` by alias. A gallery
  route `/demo/<name>` renders every `*.demo.vue` found by glob. Query
  parameters `theme`, `mode`, and `dir` set the theme file, the `.dark`
  class, and text direction.
- Accept: both apps build; a placeholder demo renders at `/demo/placeholder`
  in each; `?mode=dark` adds `.dark` before first paint.
- Check: `pnpm --filter playground-vite build && pnpm --filter playground-nuxt build`

### P0-05 Theme package

- Status: done
- Owner: agent
- Depends on: P0-04
- Read: [tokens.md](../docs/tokens.md)
- Deliver: `packages/theme` with knob types, scale generation, semantic
  mapping, contrast checking with a report object, and
  `generateTheme(knobs)`. `registry/themes/default.json`. Generated
  `tokens.css` and hand-written `theme.css`, loaded by both playgrounds.
- Accept: every token in `tokens.md` is emitted; all contrast pairs pass
  for the default theme in light and dark; a snapshot test pins the
  default output; `bg-primary` and `h-control-md` resolve in a playground.
- Check: `pnpm --filter @heart-ui/theme test`

### P0-06 Lint plugin

- Status: done
- Owner: agent
- Depends on: P0-03
- Read: [tokens.md](../docs/tokens.md#lint-rule)
- Deliver: `packages/eslint-plugin` with rules `no-raw-values` and
  `no-reka-outside-ui`, enabled for `registry/` in the root config.
- Accept: rule tests include one failing and one passing case for every
  bullet in the lint rule section, in both `<template>` and `<script>`.
- Check: `pnpm --filter @heart-ui/eslint-plugin test`

### P0-07 Test harness

- Status: done
- Owner: agent
- Depends on: P0-04, P0-05
- Deliver: Vitest browser mode in `playground-vite` with helpers
  `mountDemo`, `expectNoAxeViolations`, and keyboard helpers. A visual
  runner that walks every demo across themes and modes (and widths for
  blocks and layouts) through the gallery routes. An SSR test that renders
  every demo in `playground-nuxt` and fails on any hydration warning.
  Scripts `test:unit`, `test:browser`, `test:visual`, `test:ssr`. Visual
  tests run in the official Playwright container locally and in CI.
- Accept: all four scripts pass on the placeholder demo and fail on a
  seeded regression of each kind.
- Check: `pnpm test:browser && pnpm test:visual && pnpm test:ssr`

### P0-08 Registry helpers and build

- Status: done
- Owner: agent
- Depends on: P0-03
- Read: [registry.md](../docs/registry.md)
- Deliver: `registry/lib/utils` (`cn`). `registry/lib/icon`: an `Icon`
  component over Iconify plus `sets/fluent.ts`, a map from internal icon
  names (`check`, `chevron-down`, `close`, `search`, `spinner`, and others
  as needed) to Fluent ids. `scripts/registry-build.ts`. A JSON schema for
  `meta`. A committed copy of the upstream schema with its fetch date.
- Accept: build output validates against the upstream schema; an
  `item.json` with an unknown field fails the build.
- Check: `pnpm registry:build`

### P0-09 Check command and CI

- Status: done
- Owner: agent
- Depends on: P0-05, P0-06, P0-07, P0-08
- Read: [conventions.md](../docs/conventions.md#checks)
- Deliver: `check` and `check:item` scripts, a GitHub Actions workflow
  that runs `pnpm check` on pull requests, Changesets config.
- Accept: `check:item placeholder` runs every step for that item only.
- Check: `pnpm check`

## Pilots

Recipe C. For these three, step 1 moves the existing spec from
`docs/components/` into the item folder.

| ID | Item | Depends on | Status |
| --- | --- | --- | --- |
| P0-10 | `button` | P0-09 | done |
| P0-11 | `input` | P0-10 | done |
| P0-12 | `dialog` | P0-10 | done |

### P0-13 Docs site skeleton

- Status: done
- Owner: agent
- Depends on: P0-10
- Read: [conventions.md](../docs/conventions.md#docs-site)
- Deliver: `apps/docs` on VitePress. A build step that turns each item's
  Markdown and demo into a page with live preview and an API table
  generated from the component's types. Cloudflare Pages config, not
  deployed.
- Accept: the three pilot pages build with previews and API tables.
- Check: `pnpm --filter docs build`

### P0-14 Gate: pilots approved

- Status: done
- Owner: human
- Depends on: P0-10 to P0-13
- Deliver: reviewed pilots; approved baselines; lessons written into
  `docs/conventions.md`; answers to `docs/questions.md`.
- Accept: `pnpm check` passes on `main`, and the reviewer would accept
  40 more components built the same way.
