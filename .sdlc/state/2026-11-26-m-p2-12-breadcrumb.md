# 2026-11-26-m-p2-12-breadcrumb
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-26-m-p2-12-breadcrumb.md   (this feature's record for people)
Track: M   (sized up because: new Tier 2 item folder, demo, browser/axe/SSR/visual tests, baselines, changeset; footprint: 26 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-26
Base: f684739
Owner: 3235400+tammai@users.noreply.github.com
Tool: claude-code
Verified: f684739 tree 9d41b8978981bf6ffa99aa4ba018674f4d52805b
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline: this session builds it, one part

## Handoff
- No Reka primitive: Primitive for the link (as/asChild like button); separator chevron from Reka useDirection like DropdownMenuSubTrigger.vue:21 (no rtl:/:dir()).

## Tasks
1. **Breadcrumb component, demo, baselines and docs** — AC-001 AC-002 AC-003 AC-004 AC-005 AC-006 AC-007
   - Files: ``registry/ui/breadcrumb/breadcrumb.md``, ``registry/ui/breadcrumb/Breadcrumb.vue``, ``registry/ui/breadcrumb/BreadcrumbItem.vue``, ``registry/ui/breadcrumb/BreadcrumbLink.vue``, ``registry/ui/breadcrumb/BreadcrumbPage.vue``, ``registry/ui/breadcrumb/BreadcrumbSeparator.vue``, ``registry/ui/breadcrumb/index.ts``, ``registry/ui/breadcrumb/item.json``, ``registry/ui/breadcrumb/breadcrumb.api.json``, ``registry/ui/breadcrumb/Breadcrumb.demo.vue``, ``registry/ui/breadcrumb/Breadcrumb.test.ts``, ``tests/docs-pages.test.ts``, ``tests/registry-build.test.ts``, ``.changeset/breadcrumb.md``, ``docs/questions.md``, ``tasks/phase-2.md``, ``apps/playground-vite/visual/__screenshots__/ui-breadcrumb-default-light-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-breadcrumb-default-dark-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-breadcrumb-forest-light-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-breadcrumb-forest-dark-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-breadcrumb-graphite-light-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-breadcrumb-graphite-dark-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-breadcrumb-sunset-light-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-breadcrumb-sunset-dark-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-breadcrumb-violet-light-1024.png``, ``apps/playground-vite/visual/__screenshots__/ui-breadcrumb-violet-dark-1024.png``

## Public Surface
- export `Breadcrumb` — AC-001
- export `BreadcrumbItem` — AC-001
- export `BreadcrumbLink` — AC-002
- export `BreadcrumbPage` — AC-001
- export `BreadcrumbSeparator` — AC-003

## Test lock
- `registry/ui/breadcrumb/Breadcrumb.test.ts` sha256:4d4199beea8c0c01dd0b7ed9c1b0652f0e6913bb54e3f73c1b93191feb4c0086
- `tests/registry-build.test.ts` sha256:d69f3acf8ea8ba2fb624b0c66eda5c58e5cca946193ae3b6ded6c9e4237b9f64

## Gate log
- 2026-11-26 Stage 1: pass — plan not stopped for approval: low-risk M
- 2026-11-26 Stage 2: pass
- 2026-11-26 review: ran code, security (Public Surface not none, areas.sensitive .changeset/**), not asked: low risk
- 2026-11-26 Stage 3: fail — review r1: CR-001, CR-002 high
- 2026-11-26 verify: two runs failed on a 5 s timeout in tests/registry-publish.test.ts (a different case each time) under load; it passes alone (19/19) and the third full run passed
- 2026-11-26 Stage 2: pass
- 2026-11-26 paused before the final verify: another session's edits (README, docs config, community files, tests/docs-build.test.ts) are in this working tree; the user chose to wait for that work
- 2026-11-26 resumed: the other session's edits stashed for verify; final verify passed; the user asked to add those edits to this PR as their own commit
- 2026-11-26 Stage 2: pass
- 2026-11-26 Stage 3: pass

## Deviations
- 2026-11-26 registry/ui/breadcrumb/BreadcrumbLink.vue What: href is a declared prop. Why: spec examples are type-checked, and a fallthrough href failed scripts/spec-examples.ts. Effect: BreadcrumbLink's API lists href.
- 2026-11-26 test-change registry/ui/breadcrumb/Breadcrumb.test.ts What: router-link tests (a component child computing its own href, through asChild and as) and a 375 px test with labels that have no spaces. Why: review CR-001, CR-002. Effect: stricter.
- 2026-11-26 test-change registry/ui/breadcrumb/Breadcrumb.test.ts What: return types on the router-link test's child functions. Why: TS7024 in pnpm typecheck. Effect: types only.
- 2026-11-26 test-change registry/ui/breadcrumb/Breadcrumb.test.ts What: the styles test checks text styles on the nav and that the list inherits the root's class; a test that asChild leaves href to the child. Why: review r2 CR-003, CR-004. Effect: the ol class assertion moved to the nav; stricter.
- 2026-11-26 knowledge/gotchas/registry-items.md, knowledge/log.md, docs/sdlc/recurring-defects.md What: RouterLink fallthrough href gotcha and the undefined-attr defect. Why: Learn. Effect: docs only.

## Open questions
-
