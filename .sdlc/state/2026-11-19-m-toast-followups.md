# 2026-11-19-m-toast-followups
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-19-m-toast-followups.md   (this feature's record for people)
Track: M   (sized up because: —; footprint: 4 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-19
Base: 8736734
Owner: tam.mai@bigin.vn
Tool: claude-code
Verified: 8736734 tree de599a161e635b3dc8461afe8e553f5cf2161ad9
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline: this session builds it, one part

## Handoff
- browser tests run from apps/playground-vite (vitest browser, chromium); the follow-ups list is .sdlc/.work/toast-followups-from-p1-13.md

## Tasks
1. **Toast fixes** — AC-001 AC-002 AC-003 AC-004
   - Files: `registry/ui/toast/ToastList.vue`, `registry/ui/toast/toast.ts`, `registry/ui/toast/Toast.test.ts`, `.changeset/toast-followups.md`

## Public Surface
- none

## Test lock
- `registry/ui/toast/Toast.test.ts` sha256:c3ccf11f00578c5fd3070bb89fb26f5831f52ce7653961862931796467edc15d

## Gate log
- 2026-11-19 Stage 1: pass — plan not stopped for approval: low-risk M
- 2026-11-19 Stage 2: pass
- 2026-11-19 review: ran security (.changeset in areas.sensitive), not asked: low risk; code review did not fire (no public surface, under 6 source files and 300 code lines)
- 2026-11-19 Stage 3: pass

## Deviations
- 2026-11-19 test-change registry/ui/toast/Toast.test.ts What: every test now runs with document.hasFocus mocked to true (restored after each), and the AC-001 case mocks it false. Why: the browser runs the tests in an iframe that may never get focus, which the Toaster now correctly reads as a window in the background; without the default the existing timer tests depended on test order. Effect: no assertion changed.
- 2026-11-19 registry/ui/toast/ToastList.vue What: also removes the dead loading branch, merges the two post-flush watchers so focus and pointer are read before scheduling, and drops ToastAction's redundant as="button". Why: the follow-up list's cleanups (items 7-9). Effect: no behaviour change.

## Open questions
-
