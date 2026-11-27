# P2-13 Pagination

## Why

**Request (verbatim):** continue (the next ready task after P2-12: P2-13 pagination, Recipe C in tasks/README.md)

Task [P2-13](../../../tasks/phase-2.md#tier-2-components), Recipe C: `pagination`. Catalog row: Reka Pagination, no parts, "`total`, `pageSize`, `v-model:page`." The spec is [registry/ui/pagination/pagination.md](../../../registry/ui/pagination/pagination.md). Tables, result lists and the later `data-table` need a themed, accessible way to page through items.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| One `Pagination` component over Reka `PaginationRoot` and `PaginationList`; it renders the buttons itself | Exposing Reka's parts (List, ListItem, Prev, Next, Ellipsis) | The catalog row lists no parts. |
| Fixed range: first and last page, one sibling either side, gaps between (Reka `showEdges`, `siblingCount` 1) | `siblingCount`/`showEdges` props | Not in the catalog row; one sibling keeps nine buttons inside 375 px. |
| Accessible names from `navLabel`, `previousLabel`, `nextLabel` and `pageLabel` (`Page {page}`, as `Toaster`'s `regionLabel` holds `{hotkey}`) | Reka's own English `aria-label`s (`Previous Page`, `Page 3`) | User-facing text enters by a `*Label` prop. |
| Previous and next are our own buttons, `aria-disabled` at the ends and still focusable | Reka `PaginationPrev`/`Next`, which set `disabled` | A button that becomes `disabled` under focus drops focus to the page when you reach the last page by keyboard. |
| Buttons use `buttonVariants` (`outline` for the current page, `ghost` otherwise) from the `button` item | New pagination styles | Same look and states as buttons; `dialog` and `toast` already depend on `button`. |

## Acceptance criteria

- **AC-001** Spec, Accessibility: the root is a `nav` named `Pagination` by default or by `navLabel`, holding a `ul` of `li`; the current page's button has `aria-current="page"`; page buttons are named by `pageLabel` (`Page 3` by default, `{page}` replaced).
- **AC-002** Spec, Accessibility (range): with 20 pages the buttons are 1–5 … 20 on page 1, 1 … 9 10 11 … 20 on page 10 and 1 … 16–20 on page 20; one page (or `total` 0) shows only page 1; gaps are `aria-hidden`.
- **AC-003** Spec, Events: pressing a page, previous or next emits `update:page` with the new page and moves `aria-current`, with or without `v-model`; previous on page 1 and next on the last page are `aria-disabled="true"`, emit nothing and stay focusable.
- **AC-004** Spec, Keyboard: `Tab` moves through previous, each page and next; `Enter` and `Space` go to that page; pressing next by keyboard until the last page keeps focus on next.
- **AC-005** Spec, Accessibility: previous and next are named by `previousLabel` and `nextLabel`; their chevrons point the reading way (previous left in LTR, right in RTL from `ConfigProvider`).
- **AC-006** Spec, Tokens & States: the current page uses the `outline` button variant and the others `ghost`, all at `h-control-md`; `class` merges last on the `nav`; page 5 000 of 10 000 fits inside 375 px without overflow.
- **AC-007** Definition of done 3: axe reports no violations in the demo (first, middle and last page), light and dark, and at 375 px.
- **AC-008** Definition of done 1, 4–6 and the docs page: the registry build includes `pagination`, and the docs site builds its page and demo.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | registry/ui/pagination/Pagination.test.ts › Pagination › structure | `pnpm test:browser registry/ui/pagination/ -t "structure"` |
| AC-002 | registry/ui/pagination/Pagination.test.ts › Pagination › range | `pnpm test:browser registry/ui/pagination/ -t "range"` |
| AC-003 | registry/ui/pagination/Pagination.test.ts › Pagination › events | `pnpm test:browser registry/ui/pagination/ -t "events"` |
| AC-004 | registry/ui/pagination/Pagination.test.ts › Pagination › keyboard | `pnpm test:browser registry/ui/pagination/ -t "keyboard"` |
| AC-005 | registry/ui/pagination/Pagination.test.ts › Pagination › previous and next | `pnpm test:browser registry/ui/pagination/ -t "previous and next"` |
| AC-006 | registry/ui/pagination/Pagination.test.ts › Pagination › styles | `pnpm test:browser registry/ui/pagination/ -t "styles"` |
| AC-007 | registry/ui/pagination/Pagination.test.ts › Pagination › axe | `pnpm test:browser registry/ui/pagination/ -t "axe"` |
| AC-008 | tests/registry-build.test.ts › writes valid items and index; tests/docs-pages.test.ts › demo pages: bare pages that mount the demo | `pnpm exec vitest run tests/registry-build.test.ts tests/docs-pages.test.ts` |

## Must never break

- Every other item, its baselines and its docs page stay as they are.
- No token value or name changes.
- Built CSS never uses `:lang(` (logical properties only, checked by `tests/playgrounds.test.ts`).

## Out of scope

- Clamping `page` when `total` shrinks below it, a `disabled` prop, page-size pickers, first/last buttons, and links (`href`) for each page.

## Review

- **Recommended and chosen:** code and security, because `## Public Surface` is not `- none` (the `Pagination` export) and `.changeset/pagination.md` matches `areas.sensitive` (`.changeset/**`). These came from the trigger list, without asking (low risk). UI didn't fire: config has no `areas.ui`.
- **Verdicts:**
  - Security r1 → `.sdlc/.work/findings/2026-11-27-m-p2-13-pagination/security-r1.md` → `VERDICT: PASS` (no findings; labels reach the DOM only through escaped attribute bindings).
  - Dependency audit r1 → `dependency-audit-r1.md` → `VERDICT: PASS`. There are no critical or high advisories. Two pre-existing moderates, in `glob` and `minimatch` under the `apps/playground-nuxt` build chain, are rated low.
  - Code r1 (built-in `code-review high`) → `code-reviewer-r1.md` → `VERDICT: FAIL — CR-001–005`. CR-001 is medium: the page was not brought back into range when `total` shrank. CR-002–005 are low: spec wording for the range, `update:page` and Enter/Space, and `pageLabel` replacing only the first `{page}`. CR-006 (`375 px` in prose) and CR-007 (the `…` glyph) are rated not bugs. The glyph is `aria-hidden` like the chevrons, and that is recorded in `docs/questions.md`.
  - Code r2 (closing check) → `code-reviewer-r2.md` → `VERDICT: PASS`. CR-002–005 held. The r1 clamp fix emitted the corrected page from an immediate watch, which added five medium bugs (CR2-001–005): a deep-linked page reset to 1 while `total` was 0, `NaN` passed through, an emit during SSR, a raw page drawn when a parent ignores the update, and fractional pages. All were fixed without another round, test first (below).
- **Fixed:**
  - CR-001 and CR2-001–005, one structural fix. `Pagination` shows a clamped page (`current`: rounded, `NaN` as 1, inside 1..pageCount) and never emits a correction. Previous and next step from the shown page, and `pageCount` is 1 when `total`/`pageSize` aren't positive finite numbers. Reka receives the sanitized count. **Decision:** a page out of range is shown as the nearest end, and the next press emits from there. This supersedes the out-of-scope line above, and the spec says so. Tests: `events › shows the last page when total shrinks…`, `keeps a deep-linked page while total is still 0`, `shows a page of 0/-3/99/2.4/NaN as …`, `treats a total that is not a number as one page`.
  - CR-005: `replaceAll`; test `replaces every {page} in pageLabel`. CR-002–004, CR2-007 and CR2-008: spec, JSDoc and API snapshot wording.
- **Tickets:**
  - A `{total}` placeholder in `pageLabel`, so screen readers can hear "of 20" (CR-005 proposal).
- **Drift and manual checks:** see the state file's `## Deviations`. Three test-lock changes (Prettier formatting, the r1 clamp tests, the r2 rewrite of those tests to expect no emit) were each re-run red at Base, and `pagination.api.json` is generated. There are no manual ACs. `pnpm check:item pagination` passed all 8 steps before review. The 12 visual baselines need human approval.
- **Security:** no findings.
- **Lessons filed:** [knowledge/gotchas/registry-items.md](../../../knowledge/gotchas/registry-items.md), [knowledge/log.md](../../../knowledge/log.md), [docs/sdlc/recurring-defects.md](../recurring-defects.md).
