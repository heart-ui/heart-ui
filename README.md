# Heart UI

[![CI][badge-ci]][ci-url]
[![License: MIT][badge-license]](LICENSE)
[![Vue 3.5+][badge-vue]][vue-url]
[![Tailwind CSS v4][badge-tailwind]][tailwind-url]
[![Reka UI][badge-reka]][reka-url]
[![TypeScript strict][badge-ts]][ts-url]

Open-source (MIT) Vue 3 and Nuxt 4 UI component library built on [Reka UI][reka-url]
and [Tailwind CSS v4][tailwind-url]. Copy accessible, strictly typed
components, blocks, layouts, and OKLCH themes directly into your codebase via
CLI as source you own—using the [shadcn registry][shadcn-url] format.

[Documentation][docs-url] ·
[Getting Started][docs-start] ·
[Components][docs-components] ·
[Theming][docs-theming] ·
[Contributing](CONTRIBUTING.md)

> **Status:** Active development (alpha → beta). Tier 1 core components are
> implemented; Tier 2 components, screen layouts, blocks, and the MCP server
> are in progress. See [docs/spec.md](docs/spec.md) and
> [tasks/README.md](tasks/README.md) for the build plan.

## Why Heart UI

- **Copy-and-own Vue components:** The `heart-ui` CLI copies plain Vue 3
  `<script setup lang="ts">` source files into your repository. Edit anything
  and pull upstream updates with three-way merges (`heart-ui update`).
- **Accessible and SSR-safe by default:** Built on Reka UI headless primitives
  for keyboard navigation, focus management, and ARIA. Every item targets
  WCAG 2.2 AA with zero `axe-core` violations and Nuxt 4 SSR hydration safety,
  verified in a real Chromium browser.
- **Six-knob OKLCH theming:** Configure `primary`, `neutral`, `radius`,
  `density`, `font`, and `shadow` to generate a full three-layer CSS token
  system for both light and dark mode with automatic contrast verification—no
  `dark:` utility overrides inside components.
- **Whole-screen layouts and blocks:** Going beyond standalone controls with
  opinionated layout templates, composed blocks, and explicit empty, loading,
  error, and long-content states.
- **Built for AI coding agents:** Ships machine-readable component specs, a
  compact `AGENTS.md` API index, an Agent Skills `SKILL.md`, `/llms.txt`, a
  static `heart-ui audit` checker, and an upcoming `@heart-ui/mcp` server.

## Quick start

### Requirements

- Node.js 22 or later
- A Vite or Nuxt 4 app with Vue 3.5+ and TypeScript
- Tailwind CSS v4 (`@import "tailwindcss";`)
- The `@` import alias mapped to your source folder (`src/` in Vite, `app/` in
  Nuxt)

### 1. Initialize Heart UI

```sh
npx heart-ui init
```

`init` detects Vite or Nuxt, verifies Tailwind CSS v4, writes `heart-ui.json`,
`tokens.css`, `theme.css`, the `utils` and `icon` helpers, and agent rules.
Pass `--theme <preset>` to pick a preset or `--yes` to accept defaults.

### 2. Add a component

```sh
npx heart-ui add button
```

`add` resolves registry dependencies recursively, rewrites import aliases,
installs required npm packages, and records file hashes in
`heart-ui.lock.json`.

### 3. Use it in your app

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>

<template>
  <main>
    <Button variant="primary">Save</Button>
  </main>
</template>
```

For full Vite and Nuxt 4 setup guides, visit the
[Getting Started documentation][docs-start].

## CLI commands

| Command | Description |
| --- | --- |
| `heart-ui init` | Initialize config, CSS theme tokens, shared helpers, and agent rules |
| `heart-ui add <item...>` | Install components, blocks, or layouts with dependencies and lock tracking |
| `heart-ui list` | List available items from the registry (`--type`, `--category`, `--json`) |
| `heart-ui diff [item]` | Show unified diffs between installed files and the latest registry version |
| `heart-ui update [item]` | Update unmodified files cleanly or three-way merge locally edited files |
| `heart-ui theme <path-or-url>` | Regenerate `tokens.css` from a six-knob JSON theme file |
| `heart-ui audit <file...>` | Run static UI quality and accessibility checks (`A1`–`A8`, `--json`) |

Heart UI uses the shadcn registry schema, so third-party registries work out of
the box via `heart-ui add @scope/<item>`. See [docs/registry.md](docs/registry.md)
for the full CLI and registry specification.

## Theming

Every Heart UI theme is defined by six knobs compiled by `@heart-ui/theme` into
OKLCH color scales and semantic CSS variables (`--h-*`) mapped to Tailwind CSS
v4 utilities:

```json
{
  "name": "default",
  "primary": "oklch(0.55 0.2 260)",
  "neutral": { "hue": 260, "chroma": 0.02 },
  "radius": 0.5,
  "density": "default",
  "font": {
    "sans": "Inter, system-ui, sans-serif",
    "mono": "ui-monospace, monospace"
  },
  "shadow": "soft"
}
```

Six contrast-verified presets ship in `registry/themes/`: `default`,
`graphite`, `forest`, `rose`, `sunset`, and `violet`. Light tokens bind to `:root` and
dark tokens bind to `.dark, [data-theme="dark"]`. Read
[docs/tokens.md](docs/tokens.md) for the complete token architecture.

## Components and roadmap

Heart UI plans **45 components**, **8 screen layouts**, and **20 composed
blocks** across four release stages:

| Stage | Scope | Status |
| --- | --- | --- |
| **Phase 0–1 (Alpha)** | Theme engine, CLI, registry, docs site, and 15 Tier 1 components | Complete |
| **Phase 2 (Beta)** | 15 Tier 2 components, 8 layouts, 20 blocks, MCP server, agent benchmark | In progress |
| **Phase 3 (RC)** | 15 Tier 3 components (data table, dates, charts, command palette), example app | Planned |
| **Phase 4 (1.0)** | Visual theme customizer web app and frozen 1.0 public API | Planned |

**Available Tier 1 components:** `button`, `input`, `textarea`, `label`,
`checkbox`, `radio-group`, `switch`, `select`, `dialog`, `dropdown-menu`,
`tooltip`, `tabs`, `card`, `badge`, `toast`.

**Tier 2 components added so far:** `separator`, `avatar`, `skeleton`, `alert`,
`progress`, `popover`, `accordion`.

See the full catalog in [docs/components/index.md](docs/components/index.md)
and [docs/layout-rules.md](docs/layout-rules.md).

## Built for AI coding agents

Heart UI treats coding agents as first-class users so tools like Claude Code,
Cursor, and Codex can discover and compose UI reliably without guessing:

- **Single source of truth:** Each item's `<name>.md` spec powers the docs
  site, raw `/docs/<name>.md` pages, and `/llms.txt`.
- **Always-loaded context:** `registry:build` emits a compact `AGENTS.md` API
  index (under 8 KB) and an Agent Skills `SKILL.md` directly from TypeScript
  component metadata (`<name>.api.json`).
- **Static screen auditing:** `heart-ui audit` checks layout usage, token-only
  styling, raw HTML controls, primary action limits, loading/empty/error
  states, and accessible names (`A1`–`A8`).
- **MCP server and benchmark:** `@heart-ui/mcp` (stdio transport) and a
  20-screen automated benchmark are tracked in
  [docs/agent-support.md](docs/agent-support.md).

## Repository structure

| Path | Description |
| --- | --- |
| `registry/ui/` | Component source files, specs, API snapshots, demos, and browser tests |
| `registry/blocks/` | Composed UI blocks and demo fixtures |
| `registry/layouts/` | Full-screen layout templates |
| `registry/themes/` | Preset six-knob JSON theme definitions |
| `registry/lib/` | Shared helpers (`cn`, bundled Fluent icon resolver, form control) |
| `packages/cli/` | `heart-ui` CLI package |
| `packages/theme/` | `@heart-ui/theme` OKLCH theme generator and CSS mappings |
| `packages/eslint-plugin/` | `@heart-ui/eslint-plugin` (`no-raw-values`, `no-reka-outside-ui`) |
| `packages/mcp/` | `@heart-ui/mcp` Model Context Protocol server |
| `apps/docs/` | VitePress documentation site ([heart.tammai.me][docs-url]) |
| `apps/playground-vite/` | Vite playground for Playwright browser and visual regression tests |
| `apps/playground-nuxt/` | Nuxt 4 playground for SSR hydration tests |
| `docs/` | Product spec, conventions, token spec, registry spec, and layout rules |
| `tasks/` | Phased build plan |

## Local development

Requires Node.js 22 (see [.nvmrc](.nvmrc)) and pnpm 10.

```sh
pnpm install
pnpm test:install # Install Chromium for browser, axe, visual, and SSR tests
```

Run playgrounds and checks:

```sh
pnpm dev:vite             # Start the Vite component playground
pnpm dev:nuxt             # Start the Nuxt 4 SSR playground
pnpm lint                 # ESLint (including @heart-ui/eslint-plugin) + Prettier
pnpm typecheck            # vue-tsc across workspace + strict spec-example checks
pnpm test                 # Unit tests
pnpm registry:build       # Verify API snapshots and build dist/registry
pnpm check                # Full CI gate: lint, types, unit, browser, axe, visual, SSR, CLI e2e
pnpm check:item button    # Run the full gate scoped to a single registry item
```

## Contributing

Contributions, bug reports, and documentation improvements are welcome. Please
read [CONTRIBUTING.md](CONTRIBUTING.md),
[docs/conventions.md](docs/conventions.md), and
[docs/sdlc/constitution.md](docs/sdlc/constitution.md) before opening a pull
request.

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)

## License

[MIT](LICENSE) © Heart UI contributors

[badge-ci]: https://github.com/heart-ui/heart-ui/actions/workflows/check.yml/badge.svg
[ci-url]: https://github.com/heart-ui/heart-ui/actions/workflows/check.yml
[badge-license]: https://img.shields.io/github/license/heart-ui/heart-ui
[badge-vue]: https://img.shields.io/badge/Vue-3.5%2B-42b883?logo=vuedotjs&logoColor=white
[vue-url]: https://vuejs.org/
[badge-tailwind]: https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4?logo=tailwindcss&logoColor=white
[tailwind-url]: https://tailwindcss.com/
[badge-reka]: https://img.shields.io/badge/Primitives-Reka_UI-111827
[reka-url]: https://reka-ui.com/
[badge-ts]: https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white
[ts-url]: https://www.typescriptlang.org/
[shadcn-url]: https://ui.shadcn.com/docs/registry
[docs-url]: https://heart.tammai.me
[docs-start]: https://heart.tammai.me/start/getting-started
[docs-components]: https://heart.tammai.me/components/
[docs-theming]: https://heart.tammai.me/start/theming
