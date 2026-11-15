# 2026-11-15-m-p1-04-radio-group
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-15-m-p1-04-radio-group.md   (this feature's record for people)
Track: M   (sized up because: —; footprint: 14 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-15
Base: eb5d04a
Owner: tam.mai@bigin.vn
Tool: claude-code
Verified: eb5d04a tree 19a66e0ea42f882d1e8705b907a59b79c1692220
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
1. **Component** — AC-001 AC-002 AC-003 AC-004
   - Files: `registry/ui/radio-group/RadioGroup.vue`, `registry/ui/radio-group/RadioGroupItem.vue`, `registry/ui/radio-group/radio-group.variants.ts`, `registry/ui/radio-group/index.ts`, `registry/ui/radio-group/item.json`, `registry/ui/radio-group/RadioGroup.test.ts`
2. **Demo, changeset, baselines** — AC-005 AC-006
   - Files: `registry/ui/radio-group/RadioGroup.demo.vue`, `.changeset/radio-group.md`, `apps/playground-vite/visual/__screenshots__/ui-radio-group-default-light-1024.png`, `apps/playground-vite/visual/__screenshots__/ui-radio-group-default-dark-1024.png`
3. **Records** — AC-006
   - Files: `tests/docs-pages.test.ts`, `tests/registry-build.test.ts`, `tasks/phase-1.md`, `docs/questions.md`

## Public Surface
- export `RadioGroup` — AC-001
- export `RadioGroupItem` — AC-001
- export `radioGroupItemVariants` — AC-002

## Gate log
- 2026-11-15 Stage 1: pass — plan not stopped for approval: low-risk M
- 2026-11-15 Stage 2: pass
- 2026-11-15 review: ran code, security (Public Surface not none; .changeset/** sensitive), not asked: low risk
- 2026-11-15 Stage 3: fail — round 1: F1-F8
- 2026-11-15 Stage 2: pass
- 2026-11-15 Stage 3: fail — round 2 FAIL R2-1; maintainer chose one more fix round
- 2026-11-15 Stage 2: pass
- 2026-11-15 Stage 3: pass — round 3 PASS; fixing its medium bug R3-1 test first
- 2026-11-15 Stage 2: pass
- 2026-11-15 Stage 3: pass

## Deviations
- 2026-11-15 registry/ui/radio-group What: also exports RadioGroupItemVariants (type), and RadioGroup.vue exports sizeKey and RadioGroupSize for its items. Why: same type-export pattern as the other items; the key follows DialogContent.vue's descriptionKey. Effect: three more exports.
- 2026-11-15 knowledge/gotchas/registry-items.md What: a gotcha about Reka radio arrow keys needing a held key in tests. Why: cost a debugging round. Effect: docs only.
- 2026-11-15 registry/ui/radio-group registry/ui/checkbox/Checkbox.test.ts What: items render native radio inputs for forms instead of Reka's (the Decisions row 'Form input from Reka' is reversed); RadioGroup.vue exports radioGroupKey and RadioGroupContext instead of sizeKey; two regression tests added to checkbox for reset and input position. Why: review r1 F1-F3. Effect: no name submitted until chosen; reset keeps the form in step; checkbox already behaved.
- 2026-11-15 registry/ui/checkbox/Checkbox.vue registry/ui/radio-group What: both hidden form inputs sit under the control in a relative span, hand focus to the visible control, and fire input and change; the reset resync is removed (Vue already writes checked as an attribute); required reaches Reka only with a name. Why: review r2 R2-1 (high), R2-2, R2-3, R2-11, R2-12. Effect: checkbox changes in this feature too.

## Open questions
-
