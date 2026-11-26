# Contributing to Heart UI

Thank you for your interest in contributing to Heart UI. This guide explains
how to set up the workspace, follow project conventions, and submit changes.

By participating in this project, you agree to abide by our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

Read the core documentation that applies to your change:

- [docs/spec.md](docs/spec.md) — product scope, goals, and non-goals
- [docs/conventions.md](docs/conventions.md) — repository layout, component API
  rules, item anatomy, and definition of done
- [docs/tokens.md](docs/tokens.md) — three-layer CSS token system and lint rules
- [docs/registry.md](docs/registry.md) — shadcn registry format, CLI behavior,
  and API snapshots
- [docs/layout-rules.md](docs/layout-rules.md) — block and layout rules
- [docs/sdlc/constitution.md](docs/sdlc/constitution.md) — engineering
  principles
- [tasks/README.md](tasks/README.md) — phased build plan and item recipes

## Development setup

### Prerequisites

- Node.js 22+ (see [.nvmrc](.nvmrc))
- pnpm 10 (`corepack enable`)

### Install dependencies

```sh
pnpm install
pnpm test:install
```

`pnpm test:install` installs Chromium for Playwright browser, `axe-core`
accessibility, visual regression, and Nuxt SSR tests.

### Common commands

| Command | Purpose |
| --- | --- |
| `pnpm dev:vite` | Run the Vite component playground |
| `pnpm dev:nuxt` | Run the Nuxt 4 SSR playground |
| `pnpm lint` | Run ESLint (with `@heart-ui/eslint-plugin`) and Prettier checks |
| `pnpm format` | Format files with Prettier |
| `pnpm typecheck` | Run `vue-tsc` across workspaces and type-check spec examples |
| `pnpm test` | Run unit tests |
| `pnpm registry:api` | Regenerate `<name>.api.json` snapshots after API changes |
| `pnpm registry:build` | Verify API snapshots and build `dist/registry` |
| `pnpm check:item <name>` | Run the full gate scoped to one registry item |
| `pnpm check` | Run the full CI gate across the entire repository |

## Core rules

All contributions must satisfy these constraints:

1. **Reka UI inside `registry/ui/` only:** Do not import `reka-ui` outside
   `registry/ui/`, and do not reinvent headless primitives that Reka UI owns.
2. **Tokens only in `registry/`:** Use semantic token utilities mapped in
   `theme.css`. Never add raw hex/rgb/oklch/named colors, pixel or rem
   literals, Tailwind palette classes (`bg-blue-500`), arbitrary values
   (`w-[13px]`), `--h-raw-*` references, or `dark:` variants.
3. **Logical CSS properties:** Use `ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`,
   and `end-*` for RTL support.
4. **Accessible and SSR-safe:** Meet WCAG 2.2 AA with zero `axe-core`
   violations, full keyboard navigation, and zero Nuxt 4 hydration warnings. No
   `window` or `document` access at setup time; generate IDs with `useId()`.
5. **User-facing text:** Accept user-facing copy through props or slots. The
   only hardcoded strings allowed are English defaults on props named `*Label`.
6. **Pinned dependencies:** Pin exact dependency versions in `package.json`. Do
   not add new dependencies without discussing them in an issue or pull
   request.
7. **API snapshots and changesets:** Regenerate `<name>.api.json` with
   `pnpm registry:api` when a component's public API changes, and include a
   changeset (`pnpm changeset`) for any change to a published package or
   registry item.
8. **Visual baselines:** Never weaken tests, lint rules, or visual baselines to
   get a green check. Regenerating baselines with `pnpm test:visual --update`
   requires maintainer review and approval.

## Pull request workflow

1. Fork the repository and create a feature branch from `main` (for task work,
   use `task/<task-id>-<slug>`).
2. Keep pull requests focused—one task, bug fix, or component per pull request.
3. Follow [Conventional Commits][conv-commits] for commit messages (for
   example, `feat(button): add loading spinner` or `docs(readme): clarify CLI
   usage`).
4. Run `pnpm check:item <name>` for item changes or `pnpm check` for shared
   changes and confirm everything passes.
5. Fill out the pull request template completely, including check results,
   visual baseline notes, and any entries added to `docs/questions.md`.

## Reporting bugs and requesting features

- **Bugs:** Open an issue using the Bug Report template with reproduction
  steps, framework (Vite or Nuxt), Node/Vue versions, and expected behavior.
- **Features:** Check [docs/spec.md](docs/spec.md) and
  [docs/components/index.md](docs/components/index.md) first to see if the item
  is already planned, then open a Feature Request issue.
- **Security vulnerabilities:** Do not open a public issue. Follow
  [SECURITY.md](SECURITY.md).

[conv-commits]: https://www.conventionalcommits.org/
