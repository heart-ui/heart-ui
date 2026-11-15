# Phase 1: Core

Goal: all Tier 1 components installable from the CLI. Ends in alpha.
Components and CLI tasks are independent and may run in parallel.

## Tier 1 components

Recipe C. Specs: [components/index.md](../docs/components/index.md#tier-1-phases-0-and-1).

| ID | Item | Depends on | Status |
| --- | --- | --- | --- |
| P1-01 | `label` | P0-14 | review |
| P1-02 | `textarea` | P0-14 | review |
| P1-03 | `checkbox` | P1-01 | review |
| P1-04 | `radio-group` | P1-01 | review |
| P1-05 | `switch` | P1-01 | review |
| P1-06 | `select` | P0-14 | review |
| P1-07 | `dropdown-menu` | P0-14 | review |
| P1-08 | `tooltip` | P0-14 | review |
| P1-09 | `tabs` | P0-14 | review |
| P1-10 | `card` | P0-14 | review |
| P1-11 | `badge` | P0-14 | review |
| P1-12 | `toast` | P0-14 | review |

## CLI

### P1-13 CLI core

- Status: todo
- Owner: agent
- Depends on: P0-14
- Read: [registry.md](../docs/registry.md)
- Deliver: `packages/cli` with the `heart-ui` bin; argument parsing; config
  read and write; project detection (Nuxt or Vite, package manager,
  Tailwind major version, path aliases); registry client with fetch and
  on-disk cache; import alias rewriting.
- Accept: unit tests cover detection on four fixture projects (Nuxt and
  Vite, pnpm and npm) and alias rewriting for every alias in `heart-ui.json`.
- Check: `pnpm --filter heart-ui test`

### P1-14 `init`

- Status: todo
- Owner: agent
- Depends on: P1-13
- Deliver: the `init` command per the command table. Fails with a clear
  message when Vue, Nuxt, Node, or Tailwind is below the minimum.
- Accept: on a fixture project, `init --yes` produces a project that
  builds and resolves `bg-primary`.
- Check: `pnpm --filter heart-ui test`

### P1-15 `add` and the lock file

- Status: todo
- Owner: agent
- Depends on: P1-14
- Deliver: `add` with recursive dependency resolution, file writes, npm
  dependency install, `--overwrite`, and lock file updates.
- Accept: adding `dialog` also installs `button` and `utils` once each;
  a second `add` of the same item changes nothing; hashes match files.
- Check: `pnpm --filter heart-ui test`

### P1-16 `list`

- Status: todo
- Owner: agent
- Depends on: P1-13
- Deliver: `list` with `--type`, `--category`, `--json`.
- Accept: `--json` output parses and matches the registry index.
- Check: `pnpm --filter heart-ui test`

### P1-17 CLI end-to-end test

- Status: todo
- Owner: agent
- Depends on: P1-15, P1-01 to P1-12
- Deliver: `test:cli-e2e`. It copies committed minimal Nuxt and Vite
  templates to a temp folder, serves the local registry build, runs
  `init` and `add` for every Tier 1 item, builds the app, and renders a
  page that uses each component.
- Accept: passes for both templates; added to `pnpm check`.
- Check: `pnpm test:cli-e2e`

## Release

### P1-18 Registry publish

- Status: todo
- Owner: agent, with human for Cloudflare credentials
- Depends on: P1-17
- Read: [registry.md](../docs/registry.md#hosting)
- Deliver: `scripts/registry-publish.ts` that uploads the build to R2,
  including immutable `/r/<name>@<version>.json` files; a release workflow.
- Accept: a dry run lists the exact objects to upload; a published item
  version is never overwritten.
- Check: `pnpm registry:publish --dry-run`

### P1-19 Docs for alpha

- Status: todo
- Owner: agent
- Depends on: P1-01 to P1-16
- Deliver: pages for getting started, installation (Nuxt and Vite),
  theming basics, dark mode, and every Tier 1 component.
- Accept: a new user can follow "getting started" on a fresh project
  with no step missing; verified by running it in the e2e templates.
- Check: `pnpm --filter docs build`

### P1-20 Alpha release

- Status: todo
- Owner: human
- Depends on: P1-18, P1-19
- Deliver: `heart-ui` published under the `alpha` dist-tag with provenance;
  registry and docs deployed.

### P1-21 Gate: alpha

- Status: todo
- Owner: human
- Depends on: P1-20
- Accept: a new Nuxt app and a new Vite app, outside this repo, install
  and render every Tier 1 component from the published CLI.
