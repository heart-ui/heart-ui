# P2-21 List with filters

## Why

**Request (verbatim):** P2-21 list-filters layout (tasks/phase-2.md). Unattended run: take recommended options, record delegated decisions, open a PR per task, ask before merging to public main.

Task [P2-21](../../../tasks/phase-2.md#layouts), Recipe B. Catalog row: `list-filters`, "Users scan, search, and filter many records of one type", regions `header`, `filters`, `data`, `pagination` ([layout-rules.md](../../../docs/layout-rules.md#layout-catalog)). It is the screen agents reach for most (benchmark tasks name it), and it encodes the list rules: filters directly above the data, pagination below it on the trailing side. The spec is [registry/layouts/list-filters/list-filters.md](../../../registry/layouts/list-filters/list-filters.md).

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| `ListFilters` arranges its four regions as named slots and nothing else: `header`, then (after `section-gap`) `filters`, `data` and `pagination` held together by `gap-md`, with `pagination` on the trailing side. A region with no slot content renders nothing | Rendering the data, its table or its states | The blocks that fill the regions (`page-header`, `filter-bar`, `table-toolbar`) are later tasks; the layout owns the arrangement `layout-rules.md` writes down (Lists and data). |
| A `loading` prop sets `aria-busy="true"` on the data region | Leaving `aria-busy` to each page | `loading` is a shared prop name; the region is the layout's element, so the layout marks it busy for assistive tech. |
| It sits in `app-shell`'s `default` slot and renders no landmark of its own; its demo is a full screen, `AppShell` around `ListFilters` | A `main` or `section` landmark in `ListFilters` | `app-shell` owns `main` (P2-20); a nested landmark per layout would repeat it. The demo's root must be a layout (A1) and its content must sit in landmarks (axe `region`). |
| `meta.states` lists all four: the demo's data region shows each (an empty state, skeleton rows, an error alert with Retry, 36 rows) | `long` only, as `app-shell` | A list screen's data is the point of the layout; Recipe B asks for the four-state switch and A5 for each state on a data region. |

## Acceptance criteria

- **AC-001** Spec, Regions: the regions render in the order header, filters, data, pagination; the filters sit `gap-md` above the data and the header `section-gap` above the filters; a region with no slot content renders no element.
- **AC-002** Spec, Regions (`pagination`): pagination sits below the data, flush with its trailing edge: the right edge in left-to-right text, the left edge in right-to-left text.
- **AC-003** Spec, Data (`loading`): `loading: true` sets `aria-busy="true"` on the data region; without it the region has no `aria-busy`.
- **AC-004** Spec, Responsive: in every demo state at 375 px nothing scrolls sideways (the table scrolls inside its own container).
- **AC-005** Definition of done 3: axe reports no violations in each demo state (default, empty, loading, error, long), light and dark, and at 375 px.
- **AC-006** Recipe B accept: `heart-ui audit` passes every check on the demo.
- **AC-008** Spec, States (review r1): in the demo, a search from a later page shows its matching rows, and a search that matches nothing shows a no-results state with a Clear search action instead of an empty table.
- **AC-007** Definition of done 1, 4–6: the registry build includes `list-filters` as a layout with every `meta` field.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | registry/layouts/list-filters/ListFilters.test.ts › ListFilters › regions | `pnpm test:browser registry/layouts/list-filters/ -t "regions"` |
| AC-002 | registry/layouts/list-filters/ListFilters.test.ts › ListFilters › pagination | `pnpm test:browser registry/layouts/list-filters/ -t "pagination"` |
| AC-003 | registry/layouts/list-filters/ListFilters.test.ts › ListFilters › loading | `pnpm test:browser registry/layouts/list-filters/ -t "loading"` |
| AC-004 | registry/layouts/list-filters/ListFilters.test.ts › ListFilters › responsive | `pnpm test:browser registry/layouts/list-filters/ -t "responsive"` |
| AC-005 | registry/layouts/list-filters/ListFilters.test.ts › ListFilters › axe | `pnpm test:browser registry/layouts/list-filters/ -t "axe"` |
| AC-006 | tests/layout-audit.test.ts › layout demos › include every layout built so far; pass heart-ui audit: list-filters | `pnpm exec vitest run tests/layout-audit.test.ts` |
| AC-008 | registry/layouts/list-filters/ListFilters.test.ts › ListFilters › demo search | `pnpm test:browser registry/layouts/list-filters/ -t "demo search"` |
| AC-007 | tests/registry-build.test.ts › writes valid items and index | `pnpm exec vitest run tests/registry-build.test.ts -t "valid items and index"` |

## Must never break

- Every other item, its baselines and its demo; `app-shell` and the components the demo uses are not changed.
- No token value or name changes, and `@heart-ui/theme` is not changed.
- No `window` or `document` at setup: the demo renders under Nuxt SSR with no hydration warning.

## Out of scope

- The `filter-bar`, `page-header` and `table-toolbar` blocks: their own tasks. The demo fills the regions with bare components until they exist.
- Sorting, selection and server-side paging: `data-table` (Phase 3).

## Review

- **What fired, and who chose it:** code and security, run together from round 1 without asking (low risk). Code fired because `## Public Surface` is not `- none` (`ListFilters`). Security fired because `.changeset/list-filters.md` matches `areas.sensitive` (`.changeset/**`). UI didn't fire: config has no `areas.ui`.
- **Verdicts:**
  - Security r1 (`sdlc:code-reviewer` on opus) → `security-r1.md` → `VERDICT: PASS`. The demo's search text only reaches `trim`, `toLowerCase` and `includes`; everything renders escaped; there is no dependency change, and the threshold change has no security impact.
  - Dependency audit r1 (`pnpm audit --prod`) → `dependency-audit-r1.md` → `VERDICT: PASS`.
  - Code r1 (built-in `code-review high`) → `code-reviewer-r1.md` → `VERDICT: FAIL — C1, C2, C3`. C1: a search from a later page left the table empty under the pager (Pagination clamps the page only for display). C2: a search that matched nothing showed an empty table instead of a no-results state. C3: a lone header left an empty wrapper and a `section-gap` below it. C4–C6 were documentation fixes; C7 flagged the screenshot threshold, which the user chose.
  - Code r2 (closing check) → `code-reviewer-r2.md` → `VERDICT: PASS`. Its bug C2-4 was fixed without another round: the loading skeleton is now shaped like the table. C2-5 removed a history note from the config comment. C2-2 and C2-3 became documentation and a `docs/questions.md` entry.
- **Fixed:** a search resets the demo to page 1; a search with no matches shows a no-results `EmptyState` with Clear search, and pagination hides; the layout drops the inner wrapper when only the header is passed; the loading skeleton has a header row and four columns. C1–C3 each have a test that failed first (new AC-008 and one more AC-001 test; the user accepted the change at the Trust anchor).
- **Tickets:** C2-1: the 0.01 threshold applies to every screenshot, not only pages with a table. It stays global because that was the option the user chose; it is flagged in the PR. C2-6: the demo's search stays live in the first-run empty state; that is a demo state switch, not a real flow.
- **Drift and manual checks:** see the state file's `## Deviations`. They cover the visual flake: raster flags were tried and reverted, and the per-pixel threshold went from 0 to 0.01 by user choice. They also cover test-lock changes (each re-run red) and the review fixes. There are no manual ACs. `pnpm check:item list-filters` passed after the last fix. The 180 visual baselines need human approval.
