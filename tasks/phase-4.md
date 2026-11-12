# Phase 4: Customizer and 1.0

Goal: the theme tool, complete docs, a frozen API. Ends in 1.0.

## Customizer

A static Vite and Vue app in `apps/customizer`, built from TrevUI's own
components. State is one knob object ([tokens.md](../docs/tokens.md#knobs)).
No account, no backend.

### P4-01 Shell and state

- Status: todo
- Owner: agent
- Depends on: P3-28
- Deliver: the app scaffold; a knob store; `generateTheme` run on every
  change with the result injected as a style element scoped to the
  preview; knob state encoded in the URL hash as base64url JSON.
- Accept: reloading or sharing the URL restores the same theme; an
  invalid hash falls back to the default with a notice.
- Check: `pnpm --filter customizer test`

### P4-02 Controls

- Status: todo
- Owner: agent
- Depends on: P4-01
- Deliver: controls for the six knobs; a preset picker for the five
  presets; reset.
- Accept: every control is keyboard-operable; each change updates the
  preview within one frame.
- Check: `pnpm --filter customizer test`

### P4-03 Preview

- Status: todo
- Owner: agent
- Depends on: P4-01, P3-24
- Deliver: a preview that renders four screens from the example app with
  fixture data (dashboard, customer list, create form, settings); light
  and dark side by side; a width toggle for 375, 768, and 1280 px.
- Accept: the preview uses the same components as the registry, not
  copies; the app chrome keeps the default theme while the preview changes.
- Check: `pnpm --filter customizer test`

### P4-04 Contrast panel

- Status: todo
- Owner: agent
- Depends on: P4-02
- Deliver: a panel listing token pairs the generator had to adjust, with
  the requested and applied values, and a button to accept the adjusted
  primary color as the new knob value.
- Accept: a primary color that fails on white shows in the panel.
- Check: `pnpm --filter customizer test`

### P4-05 Exports

- Status: todo
- Owner: agent
- Depends on: P4-02
- Deliver: download `tokens.css`; download the knob JSON; copy a
  `trevui theme <url>` command; copy the share link.
- Accept: the downloaded CSS is byte-identical to `generateTheme` output
  for the same knobs.
- Check: `pnpm --filter customizer test`

### P4-06 `theme` command

- Status: todo
- Owner: agent
- Depends on: P4-05
- Read: [registry.md](../docs/registry.md#commands)
- Deliver: `trevui theme` accepting a knob file path, a preset name, or a
  customizer share link.
- Accept: e2e test applies each of the three input kinds and rebuilds.
- Check: `pnpm test:cli-e2e`

### P4-07 Customizer release

- Status: todo
- Owner: agent, with human for deploy
- Depends on: P4-03 to P4-06
- Deliver: browser tests for the full flow (pick preset, change each
  knob, export); axe on the app itself; Cloudflare Pages config.
- Check: `pnpm --filter customizer test`

## 1.0

### P4-08 Docs complete

- Status: todo
- Owner: agent
- Depends on: P4-07
- Deliver: theming guide, customizer guide, accessibility statement,
  comparison page, contributing guide with the component checklist, code
  of conduct, security policy, issue templates for bug, component
  request, and block request.
- Accept: every guide's commands are run by a docs test.
- Check: `pnpm --filter docs build`

### P4-09 Definition-of-done audit

- Status: todo
- Owner: agent
- Depends on: P4-07
- Deliver: `scripts/audit-items.ts`, which checks every registry item for
  required files, required Markdown sections, baselines in all themes and
  modes, and a changelog entry; a report in the pull request.
- Accept: the script exits 0; it is added to `pnpm check`.
- Check: `pnpm audit:items`

### P4-10 API freeze

- Status: todo
- Owner: agent
- Depends on: P4-09
- Deliver: an API report (props, slots, events, and tokens per item)
  generated from types and committed under `api/`; a CI step that fails
  when the report changes without an updated snapshot and a changeset.
- Accept: renaming a prop on a branch fails CI.
- Check: `pnpm check`

### P4-11 Final benchmark

- Status: todo
- Owner: agent, human reviews each fix
- Depends on: P4-08
- Accept: pass rate at or above 90% on two consecutive full runs.
- Check: `pnpm benchmark`

### P4-12 Launch material

- Status: todo
- Owner: human
- Depends on: P4-08
- Deliver: site home page, announcement, example app link, benchmark
  results page.

### P4-13 1.0 release

- Status: todo
- Owner: human
- Depends on: P4-09 to P4-12
- Deliver: all packages at 1.0.0 under `latest`; registry, docs,
  customizer, and example app deployed.

### P4-14 Gate: 1.0

- Status: todo
- Owner: human
- Depends on: P4-13
- Accept: every item meets the definition of done; the public API is
  frozen; all success measures in `docs/spec.md` are met or have a
  recorded exception.
