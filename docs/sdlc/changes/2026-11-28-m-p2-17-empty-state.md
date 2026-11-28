# P2-17 Empty state

## Why

**Request (verbatim):** P2-17 empty-state component (tasks/phase-2.md)

Task [P2-17](../../../tasks/phase-2.md#tier-2-components), Recipe C: `empty-state`. Catalog row: built on nothing, no parts, "`title`, `description`. Slots `icon`, `actions`." The spec is [registry/ui/empty-state/empty-state.md](../../../registry/ui/empty-state/empty-state.md). Every data region renders an empty state that names the next action ([layout-rules.md, States](../../layout-rules.md#states)); the `first-run-state` (P2-42) and `no-results-state` (P2-45) blocks build on it.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| `title` (required) and `description` (optional) are string props; `icon` and `actions` are slots, each rendered only when given | Title and description slots; parts | The catalog row. One way to set each thing. |
| The title is a `div` in `text-base` semibold `foreground`, the description `text-sm muted-foreground`, as `card`'s title and description | A heading element or an `as` prop | The heading level depends on the page; a `div` never breaks the outline, as `alert` decided. |
| A centred column (`flex-col items-center text-center`, `gap-gap-md`, `p-6`), the text capped at `max-w-content-narrow` | A left-aligned layout; a border or background | Empty states sit inside a region that already has its frame (a card, a table body); centred is what users expect there. |
| The `icon` slot sits in a `size-12` circle of `bg-muted text-muted-foreground`, and the wrapper is `aria-hidden` | Letting the slot content set its own size and colour | One look across screens; the title says it in words. |
| No live role | `role="status"` | The state shows on load, not as news; a role would make every page load announce it. |

## Acceptance criteria

- **AC-001** Spec, Props: the `title` renders in semibold `foreground` text and the `description` in `muted-foreground` text below it; without a `description` no description element renders.
- **AC-002** Spec, Slots: the `icon` slot renders above the title inside an `aria-hidden` wrapper; without the slot no wrapper renders.
- **AC-003** Spec, Slots: the `actions` slot renders below the description, its children in a row; without the slot no wrapper renders.
- **AC-004** Spec, Props: the content is centred in a column, and the text column is no wider than `content-narrow`.
- **AC-005** Spec, Props: other attributes fall through to the root `div`, and `class` merges last.
- **AC-006** Definition of done 3: axe reports no violations in the demo, light and dark.
- **AC-007** Definition of done 1, 4–6 and the docs page: the registry build includes `empty-state`, and the docs site builds its page and demo.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | registry/ui/empty-state/EmptyState.test.ts › EmptyState › text | `pnpm test:browser registry/ui/empty-state/ -t "text"` |
| AC-002 | registry/ui/empty-state/EmptyState.test.ts › EmptyState › icon | `pnpm test:browser registry/ui/empty-state/ -t "icon"` |
| AC-003 | registry/ui/empty-state/EmptyState.test.ts › EmptyState › actions | `pnpm test:browser registry/ui/empty-state/ -t "actions"` |
| AC-004 | registry/ui/empty-state/EmptyState.test.ts › EmptyState › layout | `pnpm test:browser registry/ui/empty-state/ -t "layout"` |
| AC-005 | registry/ui/empty-state/EmptyState.test.ts › EmptyState › attributes | `pnpm test:browser registry/ui/empty-state/ -t "attributes"` |
| AC-006 | registry/ui/empty-state/EmptyState.test.ts › EmptyState › axe | `pnpm test:browser registry/ui/empty-state/ -t "axe"` |
| AC-007 | tests/registry-build.test.ts › writes valid items and index; tests/docs-pages.test.ts › demo pages: bare pages that mount the demo | `pnpm exec vitest run tests/registry-build.test.ts tests/docs-pages.test.ts -t "writes valid items and index|demo pages"` |

## Must never break

- Every other item, its baselines and its docs page stay as they are.
- No raw values, no user-facing literals in the component (text enters by prop or slot).

## Out of scope

- The `first-run-state`, `no-results-state` and `error-state` blocks (P2-42, P2-45, P2-44).
- A size prop or a compact variant.

## Review

Code review fired (`## Public Surface` adds `EmptyState`) and security review fired (the diff touches `.changeset/**`, in `areas.sensitive`). Risk is low, so both ran without asking. The code review was `code-review high --max-findings all`, rated by the agent; the security review was `sdlc:code-reviewer` on opus. No dependency changed, so no dependency audit ran.

**Security** (round 1, VERDICT: PASS): no findings. Text renders through escaped interpolation only, there is no I/O, and the changeset is a plain minor bump.

**Code, round 1** (VERDICT: FAIL on F1, F2, F4)

| Finding | Rating | Fix |
|---|---|---|
| F1 A long unbroken word overflowed both edges | medium, bug | The text column wraps it; narrow-host test |
| F2 The spec's long wrapping description had no demo entry | high (recurring defect: a state the visual and axe runs never see) | Demo entry whose description wraps past `content-narrow` |
| F3 The title-only demo entry had no next step, against the spec's Do not | low | It has a description now; "title only" left the spec's States |
| F4 An icon or actions slot that renders nothing still left its wrapper | low, bug | `rendersSomething`, as in `badge`; tests for both slots |

**Code, round 2** (closing check, VERDICT: PASS). Its bugs were fixed test first, and `verify.py` closed them:

| Finding | Rating | Fix |
|---|---|---|
| G1 F1 held only in a block host: in a table cell or grid an unbroken word still widened the region | medium, bug | `wrap-anywhere` (as `breadcrumb`); tests in a table cell, grid and flex row held to 12rem |
| G2 A slot holding blank text kept its wrapper | low, bug | Blank text counts as nothing; tests. A child component that renders nothing can't be seen from the slot; the spec says to put the `v-if` in the slot |
| G3 A focusable child in the `aria-hidden` icon circle | low | Spec: the icon slot holds nothing focusable |
| G4 Title "Empty state" broke the title case of other items | low | "Empty State" in `item.json`, the spec and the docs test |
| G5 The spec's unbroken-word state had no demo entry | medium, not the recurring high: the layout tests prove the state, and the entry adds its baseline | Demo entry in a 12rem box |
| G6 The 12 new baselines need human approval | low | Listed in the PR |

Round 1's `c84c28c` target reviewed the merged combobox commit by mistake; that run was set aside and the review rerun on this diff. Its combobox findings are tickets below.

**Drift:** see the state file's `## Deviations` (test-list order, test-file changes for the lint rule and the review fixes, the title case).

**Manual checks:** none.

**Lessons filed:** [knowledge/gotchas/registry-items.md](../../../knowledge/gotchas/registry-items.md) (`wrap-break-word` vs `wrap-anywhere` in table cells and grids).

**Tickets:**
- `combobox`: the post-flush re-highlight also fires when Reka clears the highlight on pointer leave, so Enter can pick the first option (from the mistaken review of `c84c28c`, important).
- `combobox`: writing `ComboboxInput`'s `v-model` from code doesn't update Reka's `filterSearch` (important).
- `combobox`: `name` goes to Reka's hidden input, which fires form `input`/`change` on programmatic value changes; `select` avoids this with `fireFormEvents` (important).
- `combobox`: Reka's immediate reset in `ComboboxInput` writes `v-model` at setup when a value is chosen (recurring defect, medium).
- `combobox`: the closed list's hidden copy re-renders any slot content outside Reka's content context (low).
