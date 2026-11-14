# Docs: merged API tables with a drift check, and guide pages

## Why

**Request (verbatim):** "Two open questions -> what are your recommendations?" then "yes" (to both recommendations), and "when done, we stop here".

The two P0-13 entries in [docs/questions.md](../../questions.md), answered by the maintainer:

1. Keep the hand-written Props, Slots and Events tables in each item's Markdown (spec first). On the docs page, show one merged table per section: names, types and defaults from the types, notes from the spec. A check fails when the two disagree.
2. Publish `docs/layout-rules.md` and `docs/tokens.md` as site pages and point item links at them. Other repo-doc links stay plain text.

Follows [P0-13](2026-11-14-m-p0-13-docs-site.md).

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| In each `## Props`, `## Slots` and `## Events` section, the spec's table is replaced by a merged table. Its type, default and payload come from the types. Its notes come from the spec, falling back to JSDoc. The section's prose stays. The separate `## API` section goes. | keeping `## API` beside the hand tables; replacing whole sections | One table per section; prose such as "native attributes fall through" is spec content. |
| A multi-part item's table keeps a `Part` column; a single-component item has none. | always a Part column | Matches the spec template and `dialog.md`. |
| The drift check runs in the generator, so `pnpm --filter docs build` (and so `pnpm test` and `pnpm check`) fails. It names the item, section, part and member. It compares names per part (props, slots, events) and defaults (props). | comparing types too | Defaults and names are what the maintainer's answer names. A hand type like `sm \| md \| lg` would need its own parser. |
| What counts as equal: backticks and quotes are ignored; `none`, `—` and empty mean no default; a `boolean` prop with no default equals `false`. `class` and `style` may be listed in the spec without being in the types (Vue reports them as global). A spec row `—` means none. A section with no table (dialog's "every part has a default slot") isn't checked. | strict text equality | The specs write defaults for people (`md`, `false`); Vue gives booleans an implicit `false`. |
| `dialog.md` gains `as` and `asChild` rows for `DialogTrigger`, `DialogClose`, `DialogTitle` and `DialogDescription`, which the types expose (Reka). Its "take `class` only" sentence is corrected. | exempting them | The check found real drift; the spec is the source agents read. |
| Guides: the generator copies `docs/layout-rules.md` and `docs/tokens.md` to `guide/<name>.md`, listed in the nav and in a sidebar group. | a hand-written copy | No hand-written copies (agent-support.md). |
| The link rule maps by source path. A page's source is `registry/ui/<n>/<n>.md` or `docs/<g>.md`. A link that resolves to another published source becomes its site page (`/components/<n>`, `/guide/<g>`), one to the page itself becomes an anchor, and any other relative link keeps its text. | per-pattern rules | One rule for items and guides; an unpublished item stays text, not a dead link. |
| `docs/conventions.md#docs-site` and the spec template say the tables are checked against the types. | — | The answer moves into the docs (tasks/README.md, Questions). |

**Proposals not asked for:** None

## Acceptance criteria

- **AC-001** Answer 1: the button page's Props section has one table whose rows carry the types' type and default and the spec's note. Its Slots section works the same way. No `## API` section remains.
- **AC-002** Answer 1: the dialog page's Props table has a `Part` column with every part's props, including the new `as` and `asChild` rows. Its Events table merges `update:open` and `close`. The section prose stays.
- **AC-003** Answer 1, drift: generation fails with a message naming item, section, part and member in each of these cases:
  - a prop, slot or event is in the types but not the spec;
  - one is in the spec but not the types;
  - a prop's default differs.
  The listed equivalences don't fail: `class`, a boolean `false`, `none`, a `—` row, a section without a table.
- **AC-004** Answer 2: the build emits `/guide/layout-rules` and `/guide/tokens` from `docs/`, linked from the nav and sidebar, and the dialog page links its layout-rules mention to `/guide/layout-rules#detail-and-editing`.
- **AC-005** Answer 2: by source path, a link to a published item or guide becomes its site page, a link to the page itself an anchor, and a link to an unpublished item or any other repo doc keeps only its text, on item and guide pages alike.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | tests/docs-pages.test.ts › docs pages › button page | `pnpm vitest run tests/docs-pages.test.ts -t "button page"` |
| AC-002 | tests/docs-pages.test.ts › docs pages › dialog page | `pnpm vitest run tests/docs-pages.test.ts -t "dialog page"` |
| AC-003 | tests/docs-pages.test.ts › spec and types drift | `pnpm vitest run tests/docs-pages.test.ts -t "spec and types drift"` |
| AC-004 | tests/docs-build.test.ts › docs build › guide pages | `pnpm vitest run tests/docs-build.test.ts -t "guide pages"` |
| AC-005 | apps/docs/test/links.test.ts › site links | `pnpm vitest run apps/docs/test/links.test.ts -t "site links"` |

## Must never break

- `pnpm check` passes; the three pilot pages build with previews; no component code, token or baseline changes.
- The spec Markdown stays the raw source agents read: the generator never writes into `registry/` or `docs/`.

## Out of scope

- Comparing types between spec and code; raw `/docs/*.md` and `llms.txt` for agents (P2).

## Review

- **Recommended and chosen:** code, because `## Public Surface` isn't `- none`. Security, UI and advisor didn't fire. Chosen by the trigger list without asking: low risk, maintainer delegated.
- **Verdicts:**
  - Code r1 (`code-review high`): FAIL (`.sdlc/.work/findings/2026-11-14-m-docs-api-guides/code-reviewer-r1.md`). 20 findings. Highs: C3 (valid GFM tables skipped, so their drift went unreported) and C4 (a section with no table, or none at all, never reported members only in the types).
  - Code r2 closing check: PASS (`code-reviewer-r2.md`). 16 findings, no high; its medium and low bugs were fixed test first and closed by `verify.py`.
- **Correction to AC-003 and the decisions table above:** they still say a section without a table isn't checked. Since C4, the check fails when the types have members of a kind the spec has no table for. `dialog.md`'s Slots section became a table. `docs/conventions.md` states the rule as it now is.
- **Fixed, each with a test in `tests/docs-pages.test.ts` or `tests/docs-build.test.ts`:**
  - Defaults:
    - An empty string, a literal `'none'` and no default are told apart.
    - An explicit `undefined` default means none.
    - Any type that includes boolean defaults to `false`.
  - Tables:
    - Detected as GFM does: no leading pipe, indent, short delimiters, matching column counts.
    - Ended as markdown-it ends them.
    - Spec alignment kept.
    - A section may be split over several tables.
  - Headings: closing `#`s and indent handled. A fence line with an info string doesn't close a fence.
  - Duplicate rows reported, `class` included.
  - Merged cells:
    - Payloads read as types (`boolean`, `none`, `Record<string, number>`).
    - Default cells say `none` consistently.
    - Notes fill only a notes column.
  - Guides: wrapped in a `v-pre` container whose marker outruns any `:::` inside, with frontmatter kept first.
  - Every item's drift is reported in one run.
  - The nav's Guides entry is active on every guide page.
  - The dialog spec's `class` sentence was corrected, and the gotcha text matches the code.
- **Tickets:**
  - `class` and `style` rows keep the spec's type, since Vue reports them as global with no declared type (C11).
  - Factory defaults (`() => []`) are compared as source text; decide when the first one lands (D11).
  - Relative images in guides (C13).
- **Drift and manual checks:** the state file's Deviations list each change from the plan:
  - P0-13's pilot test now checks the merged Props table.
  - The link rule was renamed to `siteLinks` and resolves by source path.
  - The new exports are recorded.
  - `specTables` and `SpecTable` are private now; the Public Surface line naming them is out of date.
  - No manual ACs. Screenshots of the dialog Props table and a guide page were checked by eye.
- **Lessons filed:** [knowledge/gotchas/docs-site.md](../../../knowledge/gotchas/docs-site.md) (what `vue-component-meta` reports vs what a spec writes)
