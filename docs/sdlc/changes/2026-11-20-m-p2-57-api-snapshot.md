# P2-57 API snapshot

## Why

**Request (verbatim):** P2-57 API snapshot (tasks/phase-2.md): registry build writes committed <name>.api.json per item via vue-component-meta (shared with the docs build), pnpm check fails when stale, published at /docs/<name>.api.json, removed/renamed members reported as breaking

The task is [tasks/phase-2.md, P2-57](../../../tasks/phase-2.md#p2-57-api-snapshot), adopted from the agent-first proposal ([docs/questions.md](../../questions.md), 2026-11-20). Each item's API becomes a committed file: every API change shows in review, agents get the API as structured data, and P2-59 builds the `AGENTS.md` index from it.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| A new command, `pnpm registry:api`, writes the snapshots into `registry/`; `registry:build` only checks them and copies them to its output | `registry:build` writing into `registry/` | The build never writes into its sources today (it refuses an `--out` that overlaps them), and a check step that rewrites files can't fail on staleness. |
| One shared module, `scripts/api-snapshot.ts`, holds the extraction and the type, default and payload text; the docs build imports it | Two copies | The task says "shared with the docs build"; a snapshot and a docs table can't then disagree. |
| A snapshot exists for each item whose `index.ts` re-exports a `.vue` component (the docs build's rule); none for `lib` items without one | One per item | There is no component API to record for `utils` or `form-control`. |
| Snapshot shape: `{ name, version, components: [{ name, props: [{ name, type, required, default?, description? }], slots: [{ name, description? }], events: [{ name, payload, description? }] }] }`, members in source order, two-space JSON with a final newline | Raw `vue-component-meta` output | The raw output is large and changes with the tool; this keeps diffs to what users rely on. |
| Breaking = an item, component, prop, slot or event removed (a rename is a removal) or a prop newly required, judged against the snapshots as committed at the merge base with `origin/main` (else `HEAD`, with a warning; CI refuses without `origin/main`, so the workflows fetch full history). `registry:api` refuses to write one and `--check` fails on one unless the item's `meta.version` rose at the breaking position (minor while 0.x, else major) and a changeset added on the branch has a line with `BREAKING` and the item's name in backticks | The working-tree snapshot as the baseline (the first build) | Review round 1: a deleted or conflicted file, or a removed item, hid breaks from it, and CI never applied the rule. |
| The build script checks only that each snapshot exists (no type checker); the `registry:build` package script runs `registry:api --check` first, so `pnpm check`, `check:item` and CI fail on a stale snapshot | Extracting in every build | The checker adds 2.2 s to each build (0.24 s before), and the tests spawn many builds directly. |
| Published at `docs/<name>.api.json` beside `r/` in the build output; `registry:publish` uploads it with the other files | A separate upload | The publish uploads whatever the build's marker lists. |

## Acceptance criteria

- **AC-001** `pnpm registry:api` writes `<name>.api.json` next to each item whose `index.ts` re-exports a `.vue` component, holding the item's name, `meta.version` and each component's props (name, type, required, default, description), slots and events; it writes none for other items, and a second run changes nothing.
- **AC-002** A snapshot's prop types, defaults and event payloads are the ones the docs page shows for the same item.
- **AC-003** `registry:build` fails, naming the file and `pnpm registry:api`, when a snapshot is missing or left over for an item without components; `registry:api --check` (run by `pnpm check` through AC-006's test) fails the same way when one is stale (a prop default changed in the `.vue` file); both pass when every snapshot is current.
- **AC-004** `registry:build` writes `docs/<name>.api.json` with the snapshot's exact bytes, and the publish plan uploads it.
- **AC-005** `registry:api` refuses, and `--check` fails on, a breaking change since the committed baseline (a prop removed, a prop made required, components or the item removed), listing each breaking member, unless the item's version rose at the breaking position and a changeset added on the branch says `BREAKING` and names the item; with both it writes the snapshot. An item not yet on main is free to change.
- **AC-006** Every committed snapshot in the repo is current.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | tests/api-snapshot.test.ts › AC-001 writes a snapshot per component item | `pnpm exec vitest run tests/api-snapshot.test.ts -t "AC-001"` |
| AC-002 | tests/api-snapshot.test.ts › AC-002 snapshot matches the docs page | `pnpm exec vitest run tests/api-snapshot.test.ts -t "AC-002"` |
| AC-003 | tests/api-snapshot.test.ts › AC-003 build fails on a missing or orphaned snapshot, the check on a stale one | `pnpm exec vitest run tests/api-snapshot.test.ts -t "AC-003"` |
| AC-004 | tests/api-snapshot.test.ts › AC-004 build publishes the snapshot | `pnpm exec vitest run tests/api-snapshot.test.ts -t "AC-004"` |
| AC-005 | tests/api-snapshot.test.ts › AC-005 breaking changes need a version and a changeset | `pnpm exec vitest run tests/api-snapshot.test.ts -t "AC-005"` |
| AC-006 | tests/api-snapshot.test.ts › AC-006 committed snapshots are current | `pnpm exec vitest run tests/api-snapshot.test.ts -t "AC-006"` |

## Must never break

- Every docs page renders as before (the docs-pages and docs-build tests pass unchanged).
- `registry:build` still refuses to write into its sources, and an item's `files` (what users get) never include the snapshot.
- The registry build tests' fixture registries, which have no components, build without a type checker.

## Failure modes

- A failed `registry:api` run leaves every snapshot as it was: it checks all items before writing any.

## Out of scope

- The `AGENTS.md` index and skill (P2-59) and type-checked examples (P2-58).
- Detecting a narrowed prop type as breaking.

## Review

- **What fired and why:** code (the Public Surface adds the `registry:api` command and a root dev dependency). Security did not fire: no sensitive area, and the scripts read only the repo's own registry. Chosen by the trigger table (low risk, not asked).
- **Rounds and verdicts** (reports in `.sdlc/.work/findings/2026-11-20-m-p2-57-api-snapshot/`):
  - Round 1: code-review FAIL. C1 (high): `pnpm check:item button` never ran the stale check. C2 to C5 (medium): the breaking guard could be bypassed by a deleted or conflicted snapshot, by removing components or the item, by loose changeset matching, and CI never applied it. C6 and C9 (low bugs), C7 and C8 (nits).
  - Round 2: code-review PASS (no high). Its medium and low bugs (R2C1 to R2C10) were fixed test-first and closed by `verify.py`.
- **High findings and what fixed them:**
  - C1: the `registry:build` package script runs `registry:api --check` first, so `pnpm check`, `check:item` and CI fail on a stale snapshot; the build script itself stays fast for the many test builds.
- **Other fixes:** the guard judges against the snapshots as committed at the merge base with `origin/main` (CI fetches full history and refuses without it); removed components and items count; announcements need the backticked item name in a changeset added on the branch; items not yet on main are free; the checker requires the registry's tsconfig; `--check` refuses a registry with no kind folder; stale comments moved with the code.
- **Tickets:**
  - `lib/icon`'s `Icon` (a `.ts` `defineComponent`) has no snapshot; recorded in `docs/questions.md`.
  - `pnpm registry:build --registry <dir>` checks `registry/`, not `<dir>`; `registry:publish` trusts that check and CI (documented in `docs/registry.md`).
- **Drift and manual checks:** see the state file's Deviations (the snapshot is written by `registry:api`, not the build; the stale check moved out of the build script for speed; CI workflows fetch full history). No `manual` AC.
- **Lessons filed:** `knowledge/gotchas/registry-build.md` (build script vs package script, `pnpm run` argument placement, git-ignored fixtures) and one line in `docs/sdlc/recurring-defects.md`.

