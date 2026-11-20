---
name: heart-ui
description: Build Vue and Nuxt screens with Heart UI, a copy-in component library on Reka UI and Tailwind CSS v4. Use when adding or changing UI in a project that has heart-ui.json, or when the user asks for Heart UI components, blocks or layouts.
---

# Heart UI

Heart UI items are source files the `heart-ui` CLI copies into the project. Build screens from
them; don't rebuild what an item already does.

## Workflow

1. Write a brief: the user, the one primary task, the content by importance, the primary action.
2. Pick one layout from the table below and check its "Need" against the brief; when none fits,
   or the table has no layouts yet, compose the page from components.
3. Fill each region with blocks; use bare components only where no block fits.
4. Build the empty, loading, error and long-content states of every data region.
5. Run `npx heart-ui audit <files>` and fix every finding.

Add a missing item with `npx heart-ui add <name>`; list them with `npx heart-ui list`.

## Rules

- Style with semantic token utilities only (`bg-primary`, `text-muted-foreground`, `p-page-px`,
  `gap-gap-md`). No hex, `rgb()` or named colors, no pixel or rem values, no Tailwind palette
  classes (`bg-red-500`), no arbitrary values (`w-[13px]`), no `dark:` variants.
- Where the table below has an item for an element (`button`, `input`, `select`, `dialog`), use
  it, never the bare element.
- At most one `variant="primary"` button per view; the others are secondary, ghost or outline.
- Give every interactive element an accessible name: visible text, a `Label` with `for`, or
  `aria-label`.
- Never open a dialog from inside another dialog.
- Import from the project's aliases (`@/components/ui/<name>`, `@/components/blocks/<name>`,
  `@/layouts/<name>`, `@/lib/<name>`), never from `reka-ui`.
- Sizes are `sm`, `md` (default) and `lg`. `class` is merged last, so it can override.
- Icons come from `Icon` in `@/lib/icon` by name.

The exports and props of every item are in the project's `AGENTS.md` index (`npx heart-ui init`
writes it), and at `https://registry.heart.tammai.me/agents/api-index.md`.

## Need → use

{{items}}
