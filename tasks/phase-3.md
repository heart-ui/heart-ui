# Phase 3: Complete

Goal: full component set, upgrade path, audited quality. Ends in release
candidate.

## Tier 3 components

Recipe C. Specs: [components/index.md](../docs/components/index.md#tier-3-phase-3).

| ID | Item | Depends on | Status |
| --- | --- | --- | --- |
| P3-01 | `scroll-area` | P2-56 | todo |
| P3-02 | `slider` | P2-56 | todo |
| P3-03 | `number-input` | P2-56 | todo |
| P3-04 | `tags-input` | P2-56 | todo |
| P3-05 | `stepper` | P2-56 | todo |
| P3-06 | `context-menu` | P2-56 | todo |
| P3-07 | `tree` | P2-56 | todo |
| P3-08 | `navigation-menu` | P2-56 | todo |
| P3-09 | `file-upload` | P2-56 | todo |
| P3-10 | `calendar` | P2-56 | todo |
| P3-11 | `date-picker` | P3-10 | todo |
| P3-12 | `date-range-picker` | P3-10 | todo |
| P3-13 | `command` | P2-56 | todo |
| P3-14 | `data-table` | P2-56 | todo |
| P3-15 | `chart` | P2-56 | todo |

Extra acceptance for specific items:

- P3-09: `file-upload-panel` switches to the component in the same pull
  request.
- P3-11, P3-12: tests cover a non-Gregorian locale and a right-to-left
  locale.
- P3-14: tests cover 1,000 client-side rows and a server-side (`manual`)
  mode; `table-toolbar` works with it unchanged.
- P3-15: the chart parts depend on an adapter interface defined in this
  task (`ChartAdapter`: render line, bar, area, donut from a common series
  shape). The Unovis adapter is the default. `chart-card` switches to the
  component in the same pull request.

### P3-16 ECharts adapter

- Status: todo
- Owner: agent
- Depends on: P3-15
- Deliver: `packages/chart-echarts` implementing `ChartAdapter`, plus a
  docs page on writing an adapter.
- Accept: the `chart` demos render through either adapter with the same
  props; colors come from `chart-1` to `chart-6` in both.
- Check: `pnpm --filter @trevui/chart-echarts test`

## Upgrade path

### P3-17 `diff`

- Status: todo
- Owner: agent
- Depends on: P2-56
- Read: [registry.md](../docs/registry.md#commands)
- Deliver: the `diff` command.
- Accept: e2e test installs an old item version from a local registry,
  publishes a new one, and asserts the diff output and exit code.
- Check: `pnpm test:cli-e2e`

### P3-18 `update`

- Status: todo
- Owner: agent
- Depends on: P3-17
- Deliver: the `update` command with three-way merge.
- Accept: e2e tests cover three cases: unmodified file is replaced;
  modified file without overlap merges cleanly and keeps the local edit;
  overlapping edit writes conflict markers and exits 1. The lock file is
  correct after each.
- Check: `pnpm test:cli-e2e`

## Quality

### P3-19 Accessibility test scripts

- Status: todo
- Owner: agent
- Depends on: P2-56
- Deliver: `docs/a11y/<name>.md` for every Tier 1 and Tier 2 component:
  manual steps for NVDA with Firefox and VoiceOver with Safari, with the
  expected announcement at each step, and a results table.
- Accept: every interactive state in the component's spec has a step.

### P3-20 Accessibility audit

- Status: todo
- Owner: human
- Depends on: P3-19
- Deliver: completed results tables; one issue per failure, with severity.

### P3-21 Accessibility fixes

- Status: todo
- Owner: agent
- Depends on: P3-20
- Deliver: a fix and a regression test per issue.
- Accept: no open issue rated high.
- Check: `pnpm check`

### P3-22 Right-to-left and labels

- Status: todo
- Owner: agent
- Depends on: P3-01 to P3-15
- Deliver: the visual matrix gains `dir=rtl` for Tier 1 components and all
  layouts; a docs page listing every `*Label` prop with its default; a
  lint rule that rejects physical direction utilities (`pl-*`, `left-*`)
  in `registry/`.
- Accept: no layout breaks in right-to-left at any of the three widths.
- Check: `pnpm check`

### P3-23 Size budgets

- Status: todo
- Owner: agent
- Depends on: P3-01 to P3-15
- Deliver: `size-limit` config with a budget per component, measured on
  its demo bundle minus Vue and Reka UI; added to `pnpm check`.
- Accept: budgets are set at measured size plus 10%, listed in the pull
  request for approval.
- Check: `pnpm check`

### P3-24 Example app

- Status: todo
- Owner: agent
- Depends on: P3-01 to P3-15, P3-18
- Deliver: `apps/example`, a small admin app (sign in, dashboard,
  customers, orders, settings) on Nuxt. Every UI file comes from
  `trevui add` or composes installed items; no bare HTML controls.
  Deployed config for Cloudflare Pages.
- Accept: `trevui audit` passes on every screen; axe passes on every
  route; the app builds under SSR.
- Check: `pnpm --filter example build && pnpm --filter example audit`

### P3-25 Benchmark rerun

- Status: todo
- Owner: agent, human reviews each fix
- Depends on: P3-01 to P3-15
- Deliver: a full run with Tier 3 available, with fixes as in P2-53.
- Accept: pass rate has not dropped below the beta result.
- Check: `pnpm benchmark`

## Release

### P3-26 Docs for release candidate

- Status: todo
- Owner: agent
- Depends on: P3-16, P3-18, P3-22
- Deliver: pages for every Tier 3 component; guides for upgrading with
  `diff` and `update`, data tables, dates and locales, charts and adapters.
- Check: `pnpm --filter docs build`

### P3-27 Release candidate

- Status: todo
- Owner: human
- Depends on: P3-21 to P3-26
- Deliver: packages published under `rc`.

### P3-28 Gate: release candidate

- Status: todo
- Owner: human
- Depends on: P3-27
- Accept: no open high-severity accessibility or SSR bug; the example app
  is built only on the library.
