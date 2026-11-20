# Phase 2: Layouts and agents

Goal: whole screens from the catalog, and agents that can use it. Ends in
beta. Order: themes and infrastructure first, then components, layouts,
blocks, agent surface, benchmark.

## Themes and infrastructure

### P2-01 Presets

- Status: review
- Owner: agent
- Depends on: P1-21
- Read: [tokens.md](../docs/tokens.md)
- Deliver: four more knob files in `registry/themes/`: `graphite`
  (neutral primary, radius 0.25, compact, crisp shadow), `forest` (green,
  radius 0.75, comfortable, soft), `sunset` (orange, radius 0.5, default,
  soft), `violet` (violet, radius 1, default, no shadow). The visual
  matrix now covers five themes.
- Accept: all contrast pairs pass in every preset, light and dark; new
  baselines for existing components are listed for approval.
- Check: `pnpm --filter @heart-ui/theme test && pnpm test:visual`

### P2-02 Form decision record

- Status: todo
- Owner: agent drafts, human decides
- Depends on: P1-21
- Deliver: `docs/decisions/form.md` comparing TanStack Form, vee-validate,
  Regle, and a thin in-house layer on Standard Schema. Criteria: bundle
  size, SSR, typed field paths, async validation, maintenance activity,
  how much API the `form` component must wrap.
- Accept: one recommendation with a working spike of a three-field form.

### P2-03 Block infrastructure

- Status: review
- Owner: agent
- Depends on: P1-21
- Read: [registry.md](../docs/registry.md#item-metadata)
- Deliver: `meta` schema validation for blocks and layouts in the registry
  build; `registry/blocks/_fixtures` with typed sample data (customers,
  orders, activity, stats); a demo helper that switches between `empty`,
  `loading`, `error`, and `long`; visual runner support for the three
  widths.
- Accept: a placeholder block passes `check:item` at three widths and
  four states; a block missing `useWhen` fails the build.
- Check: `pnpm check:item placeholder-block`

### P2-04 `audit` command

- Status: review
- Owner: agent
- Depends on: P1-21
- Read: [agent-support.md](../docs/agent-support.md#audit-checklist)
- Deliver: `heart-ui audit` implementing A1 to A8 with `--json`.
- Accept: each check has one passing and one failing fixture screen.
- Check: `pnpm --filter heart-ui test`

## Tier 2 components

Recipe C. Specs: [components/index.md](../docs/components/index.md#tier-2-phase-2).

| ID | Item | Depends on | Status |
| --- | --- | --- | --- |
| P2-05 | `separator` | P2-01 | todo |
| P2-06 | `avatar` | P2-01 | todo |
| P2-07 | `skeleton` | P2-01 | todo |
| P2-08 | `alert` | P2-01 | todo |
| P2-09 | `progress` | P2-01 | todo |
| P2-10 | `popover` | P2-01 | todo |
| P2-11 | `accordion` | P2-01 | todo |
| P2-12 | `breadcrumb` | P2-01 | todo |
| P2-13 | `pagination` | P2-01 | todo |
| P2-14 | `table` | P2-01 | todo |
| P2-15 | `drawer` | P2-01 | todo |
| P2-16 | `combobox` | P2-10 | todo |
| P2-17 | `empty-state` | P2-01 | todo |
| P2-18 | `sidebar` | P2-15 | todo |
| P2-19 | `form` | P2-02 | todo |

## Layouts

Recipe B. Specs: [layout catalog](../docs/layout-rules.md#layout-catalog).
All depend on P2-03 and P2-04.

| ID | Item | Also depends on | Status |
| --- | --- | --- | --- |
| P2-20 | `app-shell` | P2-18 | todo |
| P2-21 | `list-filters` | P2-20 | todo |
| P2-22 | `list-detail` | P2-20 | todo |
| P2-23 | `dashboard` | P2-20 | todo |
| P2-24 | `form-page` | P2-20, P2-19 | todo |
| P2-25 | `settings` | P2-20 | todo |
| P2-26 | `detail-page` | P2-20 | todo |
| P2-27 | `auth` | P2-19 | todo |

## Blocks

Recipe B. Specs: [block catalog](../docs/layout-rules.md#block-catalog).
All depend on P2-03, P2-04, and the Tier 2 components they use.
`chart-card` ships with a placeholder slot until P3-15 adds `chart`.

| ID | Item | Status | ID | Item | Status |
| --- | --- | --- | --- | --- | --- |
| P2-28 | `page-header` | todo | P2-38 | `inline-edit-row` | todo |
| P2-29 | `breadcrumb-bar` | todo | P2-39 | `confirm-dialog` | todo |
| P2-30 | `user-menu` | todo | P2-40 | `wizard-footer` | todo |
| P2-31 | `notification-list` | todo | P2-41 | `file-upload-panel` | todo |
| P2-32 | `filter-bar` | todo | P2-42 | `first-run-state` | todo |
| P2-33 | `table-toolbar` | todo | P2-43 | `skeleton-page` | todo |
| P2-34 | `stats-row` | todo | P2-44 | `error-state` | todo |
| P2-35 | `chart-card` | todo | P2-45 | `no-results-state` | todo |
| P2-36 | `activity-feed` | todo | P2-46 | `sign-in-card` | todo |
| P2-37 | `form-section` | todo | P2-47 | `profile-summary` | todo |

`file-upload-panel` uses a native file input until P3-09 adds
`file-upload`.

## Agent surface

### P2-48 Agent docs build

- Status: todo
- Owner: agent
- Depends on: P2-20 to P2-47
- Read: [agent-support.md](../docs/agent-support.md#agent-docs)
- Deliver: a build step that emits `/docs/<name>.md`, `/llms.txt`, and the
  published copies of the layout rules and tokens; added to the registry
  publish.
- Accept: every registry item appears in `llms.txt`; every layout and
  block line includes `useWhen`.
- Check: `pnpm registry:build`

### P2-49 MCP server

- Status: todo
- Owner: agent
- Depends on: P2-48
- Read: [agent-support.md](../docs/agent-support.md#mcp-server)
- Deliver: `packages/mcp` with the seven tools.
- Accept: integration tests call each tool over stdio against the local
  registry build; `search_items("table with filters")` ranks
  `list-filters` first.
- Check: `pnpm --filter @heart-ui/mcp test`

### P2-50 Project rule files

- Status: todo
- Owner: agent
- Depends on: P2-04
- Read: [agent-support.md](../docs/agent-support.md#project-rule-files)
- Deliver: `init` writes `AGENTS.md` and links it from an existing
  `CLAUDE.md`; never overwrites user content.
- Accept: e2e test asserts both cases (no file, existing file).
- Check: `pnpm test:cli-e2e`

## Benchmark

### P2-51 Benchmark specs

- Status: todo
- Owner: agent drafts, human reviews
- Depends on: P2-20 to P2-47
- Read: [agent-support.md](../docs/agent-support.md#benchmark)
- Deliver: 20 files in `benchmark/specs/` with frontmatter
  `acceptedLayouts` and `mustInclude`.
- Accept: no spec names a Heart UI component, block, or layout in its body.

### P2-52 Benchmark runner

- Status: todo
- Owner: agent
- Depends on: P2-49, P2-50, P2-51
- Deliver: `benchmark/run.ts` and the scorer; `pnpm benchmark` and
  `pnpm benchmark --spec <n>`; results written to `benchmark/results/`.
- Accept: a hand-built passing screen and a hand-built failing screen
  score correctly for each of the five pass conditions.
- Check: `pnpm benchmark --self-test`

### P2-53 Benchmark fix loop

- Status: todo
- Owner: agent, human reviews each fix
- Depends on: P2-52
- Deliver: a full run; for every failure, a cause (docs gap, missing
  block, unclear rule, tool bug) and a fix in the library or docs.
  Specs and pass conditions are not edited to raise the score.
- Accept: pass rate at or above 80% on two consecutive full runs.
- Check: `pnpm benchmark`

## Release

### P2-54 Docs for beta

- Status: todo
- Owner: agent
- Depends on: P2-49
- Deliver: pages for every Tier 2 component, layout, and block; guides for
  building a screen, using Heart UI with coding agents, and the MCP server.
- Check: `pnpm --filter docs build`

### P2-55 Beta release

- Status: todo
- Owner: human
- Depends on: P2-53, P2-54
- Deliver: `heart-ui` and `@heart-ui/mcp` published under `beta`; benchmark
  result in the release notes.

### P2-56 Gate: beta

- Status: todo
- Owner: human
- Depends on: P2-55
- Accept: benchmark at or above 80%; no breaking change planned for
  Tier 1 props.
