# 2026-11-15-m-p1-07-dropdown-menu
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-15-m-p1-07-dropdown-menu.md   (this feature's record for people)
Track: M   (sized up because: —; footprint: 22 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-15
Base: a9e5e76
Owner: tam.mai@bigin.vn
Tool: claude-code
Verified: a9e5e76 tree d0594e17aefba5d989678365e583aa24a9345730
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline: this session builds it, one part

## Handoff
-

## Tasks
1. **Parts** — AC-001 AC-002 AC-003 AC-004 AC-005
   - Files: `registry/ui/dropdown-menu/DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent.vue`, `registry/ui/dropdown-menu/dropdown-menu.variants.ts`, `registry/ui/dropdown-menu/index.ts`, `registry/ui/dropdown-menu/item.json`, `registry/ui/dropdown-menu/DropdownMenu.test.ts`
2. **Demo, changeset, baselines** — AC-006 AC-007
   - Files: `registry/ui/dropdown-menu/DropdownMenu.demo.vue`, `.changeset/dropdown-menu.md`, `apps/playground-vite/visual/__screenshots__/ui-dropdown-menu-default-light-1024.png`, `apps/playground-vite/visual/__screenshots__/ui-dropdown-menu-default-dark-1024.png`
3. **Records** — AC-007
   - Files: `tests/docs-pages.test.ts`, `tests/registry-build.test.ts`, `tasks/phase-1.md`, `docs/questions.md`

## Public Surface
- export `DropdownMenu` — AC-001
- export `DropdownMenuTrigger` — AC-001
- export `DropdownMenuContent` — AC-001
- export `DropdownMenuItem` — AC-003
- export `DropdownMenuCheckboxItem` — AC-004
- export `DropdownMenuRadioGroup` — AC-004
- export `DropdownMenuRadioItem` — AC-004
- export `DropdownMenuLabel` — AC-003
- export `DropdownMenuSeparator` — AC-003
- export `DropdownMenuSub` — AC-005
- export `DropdownMenuSubTrigger` — AC-005
- export `DropdownMenuSubContent` — AC-005
- export `dropdownMenuItemVariants` — AC-003

## Gate log
- 2026-11-15 Stage 1: pass — plan not stopped for approval: low-risk M
- 2026-11-15 Stage 2: pass
- 2026-11-15 review: ran code, security (Public Surface not none; .changeset/** sensitive), not asked: low risk
- 2026-11-15 Stage 3: fail — round 1: F1-F3, F5-F8, F10, F11
- 2026-11-15 Stage 2: pass
- 2026-11-15 Stage 3: pass — round 2 PASS; fixing its low bugs
- 2026-11-15 Stage 2: pass
- 2026-11-15 Stage 3: pass

## Deviations
- 2026-11-15 registry/ui/dropdown-menu/DropdownMenu.vue registry/ui/dropdown-menu/DropdownMenuTrigger.vue registry/ui/dropdown-menu/DropdownMenuContent.vue registry/ui/dropdown-menu/DropdownMenuItem.vue registry/ui/dropdown-menu/DropdownMenuCheckboxItem.vue registry/ui/dropdown-menu/DropdownMenuRadioGroup.vue registry/ui/dropdown-menu/DropdownMenuRadioItem.vue registry/ui/dropdown-menu/DropdownMenuLabel.vue registry/ui/dropdown-menu/DropdownMenuSeparator.vue registry/ui/dropdown-menu/DropdownMenuSub.vue registry/ui/dropdown-menu/DropdownMenuSubTrigger.vue registry/ui/dropdown-menu/DropdownMenuSubContent.vue What: the part files of Task 1, named here in full (the plan's file list was garbled by shell word splitting); index.ts also exports the DropdownMenuItemVariants type, and the variants file a shared content class list. Why: one file per catalog part; type-export pattern. Effect: none on behaviour.
- 2026-11-15 registry/ui/dropdown-menu/dropdown-menu.variants.ts What: also exports dropdownMenuContentClasses, the class list content and sub content share. Why: one source for both surfaces. Effect: one more export.
- 2026-11-15 registry/ui/dropdown-menu/DropdownMenuRadioGroup.vue registry/ui/dropdown-menu/DropdownMenuLabel.vue What: the radio group renders its own element (as-child), takes class, exports groupLabelsKey, and drops Reka's dangling aria-labelledby unless a label sits inside; content caps its height and scrolls; side-offset default yields to the caller's. Why: review r1 F1, F2, F6, F7. Effect: one more export.
- 2026-11-15 registry/ui/dropdown-menu/dropdown-menu.variants.ts What: also exports dropdownMenuContentStyle (the max-height cap), bound before the caller's attributes. Why: review r2 R2-1, R2-7. Effect: one more export; a caller's style wins.

## Open questions
-
