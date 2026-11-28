# 2026-11-28-m-p2-17-empty-state
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-28-m-p2-17-empty-state.md   (this feature's record for people)
Track: M   (sized up because: new item folder, spec, demo, tests, two test lists, changeset, baselines; footprint: 26 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-28
Base: c84c28c
Owner: 3235400+tammai@users.noreply.github.com
Tool: claude-code
Verified: c84c28c tree b8dc82686f6e24331a43f09102ce7cfcf6a39c69
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline: this session builds it, one part

## Handoff
- closest models: registry/ui/alert (no Reka, data-slot parts) and registry/ui/card/CardTitle.vue, CardDescription.vue for the text styles

## Tasks
1. **EmptyState component** — AC-001 AC-002 AC-003 AC-004 AC-005 AC-006 AC-007
   - Files: ``registry/ui/empty-state/empty-state.md``, ``registry/ui/empty-state/EmptyState.vue``, ``registry/ui/empty-state/index.ts``, ``registry/ui/empty-state/item.json``, ``registry/ui/empty-state/empty-state.api.json``, ``registry/ui/empty-state/EmptyState.demo.vue``, ``registry/ui/empty-state/EmptyState.test.ts``, ``tests/docs-pages.test.ts``, ``tests/registry-build.test.ts``, ``.changeset/empty-state.md``, ``docs/questions.md``, ``tasks/phase-2.md``, ``apps/playground-vite/visual/__screenshots__/ui-empty-state-default-light-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-empty-state-default-dark-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-empty-state-forest-light-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-empty-state-forest-dark-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-empty-state-graphite-light-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-empty-state-graphite-dark-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-empty-state-rose-light-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-empty-state-rose-dark-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-empty-state-sunset-light-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-empty-state-sunset-dark-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-empty-state-violet-light-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-empty-state-violet-dark-1024.png``

## Public Surface
- export `EmptyState` — AC-001

## Test lock
- `registry/ui/empty-state/EmptyState.test.ts` sha256:96f8f026de594c392ced12100339b499b8fa26ccde527ee0095e95b441979df2
- `tests/registry-build.test.ts` sha256:177f8bff65e932472244533e1d020d2750f77c90eb02459b18c2472f9fb32e40

## Gate log
- 2026-11-28 Stage 1: pass — plan not stopped for approval: low-risk M
- 2026-11-28 Stage 2: pass
- 2026-11-28 review: ran code, security (Public Surface not none, areas.sensitive .changeset/**), not asked: low risk
- 2026-11-28 Stage 3: fail — review r1: F1, F2, F4 to fix; F3 fixed in passing
- 2026-11-28 Stage 2: pass
- 2026-11-28 Stage 3: pass — review r2: no high; G1, G2, G4, G5 fixed now, test first; G3 spec note; G6 in the PR
- 2026-11-28 Stage 2: pass
- 2026-11-28 Stage 3: pass

## Deviations
- 2026-11-28 test-change registry/ui/empty-state/EmptyState.test.ts What: the layout test's host is w-content-max, not a 1200px inline width. Why: the no-raw-values lint rule covers test files. Effect: same check, the host is still wider than content-narrow.
- 2026-11-28 test-change tests/registry-build.test.ts What: empty-state sits after dropdown-menu in the sorted name list (and in docs-pages.test.ts's lists). Why: the list is sorted and was written in the wrong place. Effect: none on what is checked.
- 2026-11-28 test-change registry/ui/empty-state/EmptyState.test.ts What: Prettier formatting only. Why: the lint step checks formatting. Effect: none on what is checked.
- 2026-11-28 test-change registry/ui/empty-state/EmptyState.test.ts What: tests for a slot that renders nothing (icon, actions) and an unbroken word in a narrow region (layout). Why: review F1, F4. Effect: stricter.
- 2026-11-28 test-change registry/ui/empty-state/EmptyState.test.ts What: blank-text slot tests (icon, actions) and unbroken-word tests in a table cell, grid and flex row held to a fixed 12rem. Why: review G1, G2. Effect: stricter.
- 2026-11-28 item title What: 'Empty State', not 'Empty state', in item.json, the spec heading and tests/docs-pages.test.ts. Why: review G4, title case as the other items. Effect: docs sidebar text.
- 2026-11-28 knowledge/gotchas/registry-items.md What: wrap-break-word vs wrap-anywhere gotcha. Why: Learn. Effect: docs only.

## Open questions
-
