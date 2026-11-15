# P1-07 Dropdown menu

## Why

**Request (verbatim):** "you build all planned tasks by yourself, when done i will do only 1 review round with you." (working mode in docs/questions.md, 2026-11-15).

Task [P1-07](../../../tasks/phase-1.md#tier-1-components), Recipe C: `dropdown-menu`. Catalog row: Reka DropdownMenu, parts Trigger, Content, Item, CheckboxItem, RadioGroup, RadioItem, Label, Separator, Sub, SubTrigger, SubContent; "Item `variant`: default, danger. Item slots `leading`, `trailing`." The spec is [registry/ui/dropdown-menu/dropdown-menu.md](../../../registry/ui/dropdown-menu/dropdown-menu.md), committed on its own (a9e5e76).

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| One file per catalog part over Reka's parts; `DropdownMenu` and `DropdownMenuSub` render no element; `DropdownMenuTrigger` passes `as`/`asChild` through like `DialogTrigger` | — | The dialog reference for multi-part components. |
| Content and sub content share the select list's surface: `surface-raised`, `border`, `shadow-md`, `rounded-md`, `p-1`, `z-popover`, fade animation, `min-w-48`; `align` prop (default `start`), `sideOffset` 4 | more positioning props | The catalog names none; `align` is the one a row-actions menu needs. |
| A danger item reads `danger-subtle-foreground`, and `danger-subtle` when highlighted | `text-danger` | Status fills aren't used as text (docs/questions.md, P0-05); the subtle pair is a checked text-on-surface pair. |
| Checkbox and radio items keep an indicator column at the inline start (`check` and a dot), so labels line up with plain items' text | indicators at the end | Common menu layout; leading icons of plain items sit in the same column. |
| The sub trigger's chevron points to where the submenu opens: `chevron-right`, or `chevron-left` when Reka's menu direction is RTL (read from Reka's root context) | a CSS direction selector | Direction selectors break in production builds (knowledge/gotchas/registry-items.md); Reka's own direction also drives its arrow keys, so they agree. |
| The demo starts closed; the menu's own axe test opens it, as for `select` | open on load | An open modal menu hides the page; the every-demo axe check needs it closed (docs/questions.md, P1-06). |

## Acceptance criteria

- **AC-001** Spec, Props, Events: a click on the trigger opens the menu; choosing an item emits `select` and closes; `v-model:open` follows; `select` with `preventDefault()` keeps it open.
- **AC-002** Spec, Keyboard: `Enter` on the trigger opens with the first item highlighted; arrows skip disabled items; letters jump; `Escape` closes and focus returns to the trigger.
- **AC-003** Spec, Props and Slots: a danger item uses the danger subtle colours; `leading` and `trailing` slots render around the name, the leading one `aria-hidden`; a disabled item can't be chosen; `class` merges last on each part.
- **AC-004** Spec, Props: a checkbox item toggles its `v-model` with `aria-checked` and a check; a radio group sets its `v-model` with `aria-checked` on the chosen item.
- **AC-005** Spec, Keyboard: `ArrowRight` opens a submenu and `ArrowLeft` closes it; the sub trigger's chevron points right, or left in RTL.
- **AC-006** Definition of done 3: axe reports no violations in the demo (closed) and in the open menu with an open submenu, light and dark.
- **AC-007** Definition of done 1, 4–6 and the docs page: `pnpm check:item dropdown-menu` passes and the docs site builds a `dropdown-menu` page whose tables match the types.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | registry/ui/dropdown-menu/DropdownMenu.test.ts › DropdownMenu › opening and choosing | `pnpm test:browser registry/ui/dropdown-menu/ -t "opening and choosing"` |
| AC-002 | registry/ui/dropdown-menu/DropdownMenu.test.ts › DropdownMenu › keyboard | `pnpm test:browser registry/ui/dropdown-menu/ -t "keyboard"` |
| AC-003 | registry/ui/dropdown-menu/DropdownMenu.test.ts › DropdownMenu › items | `pnpm test:browser registry/ui/dropdown-menu/ -t "items"` |
| AC-004 | registry/ui/dropdown-menu/DropdownMenu.test.ts › DropdownMenu › checkbox and radio | `pnpm test:browser registry/ui/dropdown-menu/ -t "checkbox and radio"` |
| AC-005 | registry/ui/dropdown-menu/DropdownMenu.test.ts › DropdownMenu › submenu | `pnpm test:browser registry/ui/dropdown-menu/ -t "submenu"` |
| AC-006 | registry/ui/dropdown-menu/DropdownMenu.test.ts › DropdownMenu › axe | `pnpm test:browser registry/ui/dropdown-menu/ -t "axe"` |
| AC-007 | manual | whole-gate runs, not one test: `pnpm check:item dropdown-menu` and `pnpm --filter docs build`, at Build and Ship |

## Must never break

- `pnpm check` passes; every approved baseline is unchanged.

## Out of scope

- `DropdownMenuGroup`, `DropdownMenuArrow`, `DropdownMenuFilter`: not in the catalog row.
- Human approval of the new dropdown-menu baselines (the final review round).

## Review

- **Fired and ran:** code (`## Public Surface` adds twelve parts and `dropdownMenuItemVariants`) and security (`.changeset/**`); low risk, so run without asking.
- **Security r1:** PASS, no findings.
- **Code r1** (built-in `code-review high --max-findings all`): FAIL on bugs, fixed test first: Reka left a radio group with a label outside it pointing `aria-labelledby` at nothing (the group now renders its own element and keeps the caller's naming unless a label sits inside); long menus ran off short screens (capped at Reka's available height, scrolling); the View menu was never axe-checked; the trailing hint stayed bright on disabled rows; the default `side-offset` overrode a caller's; the radio group took no `class`; indicators weren't `aria-hidden`; keyboard, RTL and disabled-item tests; records. Not bugs: chevron vs a collision flip (ticket), closed-only baselines (runner limit), the danger pair the generator doesn't check (theme task, recorded), RTL through Reka's `ConfigProvider` (documented).
- **Code r2** (closing check): PASS. Its low bugs fixed: a caller's `style` can now set a lower max height; a test that a caller's `aria-labelledby` is kept, and a strict one that the dangling reference is gone; one label per group documented; small cleanups.
- **Tickets:** chevron after a collision flip; `textValue` so hidden leading text doesn't count for typeahead; SSR naming of a labelled radio group before hydration; shared test helpers and duplicate `describe` names; export the content classes for `context-menu` (P3-06); a theme check for `danger-subtle-foreground` on `surface-raised`.
- **Manual AC-007:** `pnpm check:item dropdown-menu` and `pnpm --filter docs build` passed; `verify.py` ran the full suite.
- **Deviations:** the part file list (the plan's was garbled by shell word splitting); exports of the item variants type, the content classes and style, and the group labels key.
- **Lessons filed:** none beyond docs/questions.md.
