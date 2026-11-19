# Toast follow-ups

## Why

**Request (verbatim):** auto start next item when the current item done, working unattended until 8:00AM tomorrow.

A code review run during P1-13 by mistake against the toast commit (P1-12) found nine problems in `registry/ui/toast/` (`.sdlc/.work/toast-followups-from-p1-13.md`). Four are bugs against the toast's own spec, fixed here; the rest are left for the maintainer's review round:

- Kept for the review round, because P1-12 settled them on purpose over six review rounds, with the maintainer choosing to own the timers: a toast added while focus sits on the emptied list waits (a test asserts it), and any window blur pauses toasts, a blur into an iframe included.
- Small cleanups ride along: the dead `loading` branch, the two watchers that depend on their order, and the redundant `as="button"`.

**The user's words:** "auto start next item when the current item done, working unattended until 8:00AM tomorrow" (2026-11-18).

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| A timer belongs to one toast object, not only its id: a toast dismissed and added again with that id in the same tick starts its time over | Comparing `updateKey` alone | Reka's store gives the new toast `updateKey` 0 again, so the old timer was reused. |
| The list renders the toasts oldest first | Reka's order (newest first) | toast.md says newest at the bottom; toasts added in one tick came out newest on top. |
| An action with an empty `altText` uses its `label` for it | Throwing | Reka's `ToastAction` throws without `altText` and takes the whole list down; the label is the honest fallback. |
| The window counts as in the background from mount when it lacks focus (`document.hasFocus()`) | Assuming focus | A Toaster mounted in a background tab counted down toasts no one could see. |

**Proposals not asked for:** None.

## Acceptance criteria

- **AC-001** Given the window lacks focus when the Toaster mounts, when a timed toast is shown, then it stays open until the window gets focus, and then closes after its duration.
- **AC-002** Given a timed toast with an `id`, when it is dismissed and added again with that `id` in the same tick, then the new toast gets its full duration.
- **AC-003** Given two toasts added in the same tick, then the older one is above the newer one.
- **AC-004** Given an action with an empty `altText`, then the toast renders with its action, whose alternative text is the label, and nothing throws.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | registry/ui/toast/Toast.test.ts › follow-ups › waits while the window had no focus at mount | `pnpm --dir apps/playground-vite exec vitest run --config vitest.config.ts ../../registry/ui/toast/Toast.test.ts -t "waits while the window had no focus at mount"` |
| AC-002 | registry/ui/toast/Toast.test.ts › follow-ups › gives a re-added toast its full time | `pnpm --dir apps/playground-vite exec vitest run --config vitest.config.ts ../../registry/ui/toast/Toast.test.ts -t "gives a re-added toast its full time"` |
| AC-003 | registry/ui/toast/Toast.test.ts › follow-ups › stacks toasts from one tick oldest first | `pnpm --dir apps/playground-vite exec vitest run --config vitest.config.ts ../../registry/ui/toast/Toast.test.ts -t "stacks toasts from one tick oldest first"` |
| AC-004 | registry/ui/toast/Toast.test.ts › follow-ups › renders an action with an empty altText | `pnpm --dir apps/playground-vite exec vitest run --config vitest.config.ts ../../registry/ui/toast/Toast.test.ts -t "renders an action with an empty altText"` |

## Must never break

- Every existing toast test, the axe checks and the visual baselines.

## Out of scope

- The two design points kept for the review round (above).

## Review

- **Recommended and chosen:** security (`.changeset/` is in `areas.sensitive`); chosen by the trigger list (low risk, not asked). Code review did not fire: there is no public surface, and the diff has fewer than 6 source files and under 300 code lines.
- **Verdicts:** security → `.sdlc/.work/findings/2026-11-19-m-toast-followups/security-r1.md` → PASS.
- **Fixed:** none beyond the four ACs.
- **Tickets:**
  - S-01: an action with both `label` and `altText` empty still makes Reka throw (as before this change).
  - S-02: the AC-004 test could also assert the alternative text equals the label, and catch render errors through Vue's error handler.
  - For the maintainer's review round:
    - a toast added while focus sits on the emptied list waits until focus leaves (settled on purpose in P1-12);
    - a blur into an iframe pauses toasts.
- **Drift and manual checks:**
  - The test file now mocks `document.hasFocus` to true by default: Vitest runs tests in an iframe that may never get focus.
  - Cleanups: the dead `loading` branch, merged watchers, the redundant `as`.
  - See the state file's Deviations. No `manual` AC.
- **Security:** No finding is open, and the diff holds no secrets.
- **Lessons filed:** none.
