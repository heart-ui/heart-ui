# P2-12 Breadcrumb

## Why

**Request (verbatim):** continue (the next ready task after P2-11: P2-12 breadcrumb, Recipe C in tasks/README.md)

Task [P2-12](../../../tasks/phase-2.md#tier-2-components), Recipe C: `breadcrumb`. Catalog row: no Reka primitive, parts Item, Link, Separator, Page, "Renders a `nav` with an ordered list." The spec is [registry/ui/breadcrumb/breadcrumb.md](../../../registry/ui/breadcrumb/breadcrumb.md). Deep pages and the `breadcrumb-bar` block (P2-29) need a themed, accessible trail back up.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| `Breadcrumb` renders `nav` named by a `navLabel` prop (default `Breadcrumb`) around an `ol` | Leaving the name to a caller's `aria-label` | Conventions: an accessible name the component supplies itself is a `*Label` prop with an English default. |
| `BreadcrumbSeparator` is its own `li` (`role="presentation"`, `aria-hidden`) with a direction-aware chevron from Reka's `useDirection` | A CSS `::before` separator; `rtl:` or `:dir()` flipping | The catalog names Separator as a part; `dropdown-menu`'s sub trigger picks its chevron the same way, since `rtl:`/`:dir()` break in production builds (gotcha). |
| `BreadcrumbLink` is Reka `Primitive` (`as` default `a`, `asChild`) | A `to` prop or router dependency | Works with `RouterLink` and `NuxtLink` through `asChild`, as `button` does. |
| `BreadcrumbPage` is a `span` with `aria-current="page"` | `role="link"` with `aria-disabled` | The current page isn't a link; `aria-current` is what the APG breadcrumb pattern asks. |

## Acceptance criteria

- **AC-001** Spec, Accessibility: the root is a `nav` named `Breadcrumb` by default or by `navLabel`, holding an `ol` whose items are `li`; the current page has `aria-current="page"` and is not a link.
- **AC-002** Spec, Props: `BreadcrumbLink` renders an `a` with the caller's `href`, or merges onto its child with `asChild`, keeping its classes.
- **AC-003** Spec, Accessibility: separators are `li` with `role="presentation"` and `aria-hidden="true"`; the default chevron points right in LTR and left in RTL (`ConfigProvider` `dir`); a slot replaces it.
- **AC-004** Spec, Keyboard: `Tab` moves through the links only, skipping the current page and the separators.
- **AC-005** Spec, Tokens & States: the trail is `text-sm text-muted-foreground`, links get the focus ring and turn `foreground` on hover, the page is `text-foreground`, `class` merges last on every part, and a long trail wraps inside 375 px without overflowing.
- **AC-006** Definition of done 3: axe reports no violations in the demo, light and dark, and at 375 px.
- **AC-007** Definition of done 1, 4–6 and the docs page: the registry build includes `breadcrumb`, and the docs site builds its page and demo.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | registry/ui/breadcrumb/Breadcrumb.test.ts › Breadcrumb › structure | `pnpm test:browser registry/ui/breadcrumb/ -t "structure"` |
| AC-002 | registry/ui/breadcrumb/Breadcrumb.test.ts › Breadcrumb › links | `pnpm test:browser registry/ui/breadcrumb/ -t "links"` |
| AC-003 | registry/ui/breadcrumb/Breadcrumb.test.ts › Breadcrumb › separators | `pnpm test:browser registry/ui/breadcrumb/ -t "separators"` |
| AC-004 | registry/ui/breadcrumb/Breadcrumb.test.ts › Breadcrumb › keyboard | `pnpm test:browser registry/ui/breadcrumb/ -t "keyboard"` |
| AC-005 | registry/ui/breadcrumb/Breadcrumb.test.ts › Breadcrumb › styles | `pnpm test:browser registry/ui/breadcrumb/ -t "styles"` |
| AC-006 | registry/ui/breadcrumb/Breadcrumb.test.ts › Breadcrumb › axe | `pnpm test:browser registry/ui/breadcrumb/ -t "axe"` |
| AC-007 | tests/registry-build.test.ts › writes valid items and index; tests/docs-pages.test.ts › demo pages: bare pages that mount the demo | `pnpm exec vitest run tests/registry-build.test.ts tests/docs-pages.test.ts` |

## Must never break

- Every other item, its baselines and its docs page stay as they are.
- No token value or name changes.
- Built CSS never uses `:lang(` (logical properties only, checked by `tests/playgrounds.test.ts`).

## Out of scope

- Collapsing a long trail behind an ellipsis menu, and a `to` prop or router integration.

## Review

- **Recommended and chosen:** code and security, because `## Public Surface` is not `- none` (the five `Breadcrumb*` exports) and `.changeset/breadcrumb.md` matches `areas.sensitive` (`.changeset/**`); chosen by the trigger list without asking (low risk). UI didn't fire: config has no `areas.ui`.
- **Verdicts:**
  - Security r1 → `.sdlc/.work/findings/2026-11-26-m-p2-12-breadcrumb/security-r1.md` → `VERDICT: PASS` (no findings; a caller's `href` is developer input, as for any link primitive).
  - Dependency audit r1 → `dependency-audit-r1.md` → `VERDICT: PASS` (0 critical/high; 2 pre-existing moderate in `glob`/`minimatch` under `apps/playground-nuxt`, rated low).
  - Code r1 (built-in `code-review high`) → `code-reviewer-r1.md` → `VERDICT: FAIL — CR-001, CR-002` (both rated high: they break AC-002/AC-004 and AC-005).
  - Code r2 (closing check) → `code-reviewer-r2.md` → `VERDICT: PASS`. Both fixes held; CR-003 (medium), CR-004, CR-006 and CR-007 fixed without another round.
- **Fixed:**
  - CR-001 (high): `BreadcrumbLink` bound `href` even when unset, wiping the `href` a `RouterLink`/`NuxtLink` child computes (no link role, out of the Tab order). It now binds `href` only when set and never with `asChild` (CR-004). Tests: `router links › keeps the href a router link computes (asChild|as)`, `with asChild, leaves the href to the child`.
  - CR-002 (high): a label with no spaces could overflow at 375 px. The trail uses `wrap-anywhere`, which lowers the minimum width (Chromium happened to break the label already). Test: `breaks a label with no spaces inside 375 px`.
  - CR-003: the root's `class` couldn't restyle the trail; text styles now sit on the `nav` before the caller's class.
  - CR-006, CR-007: the spec says RTL needs Reka's `ConfigProvider`; the changeset lists `href`.
- **Tickets:**
  - CR-008: keep each separator with the next item when a long trail wraps.
- **Drift and manual checks:** the state file's `## Deviations`: `href` became a declared prop (spec examples are type-checked); test-lock changes for the review fixes and a TS7024 return type, each re-red at Base; two verify runs failed on a 5 s timeout in `tests/registry-publish.test.ts` under load (a different case each time, 19/19 alone), and the next full run passed. No manual ACs.
- **Security:** no findings.
- **Lessons filed:** [knowledge/gotchas/registry-items.md](../../../knowledge/gotchas/registry-items.md), [knowledge/log.md](../../../knowledge/log.md), [docs/sdlc/recurring-defects.md](../recurring-defects.md).
