# Design system

<!-- Project-owned. Written at setup (design-system step) with the user's approval; change it only with the team's approval. Every UI change follows it: `.claude/rules/sdlc-ui.md` loads with UI files and `sdlc:ui-reviewer` checks diffs against it. Point at the source of truth; don't copy values that live in code. -->

Heart UI is a design system that other projects copy. This file only points
at its specs. The specs win where this file and they differ.

## Source of truth

- Library: Heart UI's own components in `registry/ui/`, built on Reka UI
  primitives. Reka owns focus, keyboard handling and ARIA.
- Tokens: [docs/tokens.md](../tokens.md) is the spec. The generated code
  lives in `@heart-ui/theme` (`generateTheme(knobs)` writes `tokens.css`)
  and the static `theme.css` Tailwind mapping (task P0-05). Preset knob
  files go in `registry/themes/<name>.json`.
- Components: `registry/ui/<name>/` (anatomy in
  [conventions.md](../conventions.md#item-anatomy)). The catalog is
  [components/index.md](../components/index.md), and the reference set is
  `button`, `input` and `dialog`.
- Blocks and layouts: `registry/blocks/` and `registry/layouts/`. The
  arrangement rules are in [layout-rules.md](../layout-rules.md).
- Icons: Fluent through `registry/lib/icon` with internal names. Never
  import an icon package directly, and never use emoji as icons.
- Fonts: the `font` knob (`--tre-font-sans`, `--tre-font-mono`).
- Themes: light and dark for every preset theme. Dark values live on
  `.dark, [data-theme="dark"]`.

## Tokens

Use tokens through Tailwind utilities by name. Their values come from the
generator.

- Color roles: `background`, `surface`, `surface-raised`,
  `surface-sunken`, `muted`, `foreground`, `muted-foreground`, `border`,
  `border-control`, `ring`, `overlay`, `primary*`, `success*`,
  `warning*`, `danger*`, `info*`, `link`, `chart-1` to `chart-6`.
- Size and spacing: `control-sm|md|lg`, `control-px-*` and `gap-sm|md|lg`
  (all scaled by `density`). Within an item, layout may use Tailwind's
  numeric spacing scale.
- Shape and depth: `radius-sm|md|lg|full`, `shadow-sm|md|lg`, and
  `ring-width` with `ring-offset`.
- Motion: `duration-fast|normal|slow` (0 ms under reduced motion) and
  `ease`.
- Page: `content-max`, `content-narrow`, `sidebar-width*`,
  `topbar-height`, `page-px`, `section-gap`, and the `z-*` layers.

## Components to reuse

| Need | Use | Not |
|---|---|---|
| An action | `Button` with `variant` and `size` | A styled `<button>` |
| A text field | `Input` with `v-model`, `invalid` and the `leading`/`trailing` slots | A raw `<input>` |
| A modal | `Dialog` parts over Reka | A hand-rolled overlay or portal |
| An icon | `Icon` from `registry/lib/icon` | `@iconify/*` or an SVG pasted inline |
| Class merging | `cn()` from `registry/lib/utils` | String concatenation |

## Patterns

The patterns are in [layout-rules.md](../layout-rules.md#rules): app shell
and page structure, actions, lists and data, forms, and feedback. Every
block and layout renders the `empty`, `loading`, `error` and `long` states,
at 375, 768 and 1280 px.

## Don't

On top of the AI-slop list in `.claude/rules/sdlc-ui.md`:

- No raw values in `registry/`: no hex, `rgb()`, `hsl()`, `oklch()` or
  named colors, no px or rem literals, and no palette or arbitrary-value
  classes. Don't reference `--tre-raw-*` or use the `dark:` variant.
  (`@heart-ui/eslint-plugin` `no-raw-values`.)
- Use logical properties only (`ps-*`, `me-*`, `start-*`), never left or
  right.
- No `<style>` blocks except for keyframes that utilities can't express.
- No hard-coded user-facing text except English defaults of `*Label`
  props.
- Use one primary button per view, and the `danger` variant with a
  `confirm-dialog` for destructive actions.

## Changing the system

A new token, component or variant is proposed in the feature's design
(Complexity Tracking) or in review, and the user approves it. It's then
added to `docs/tokens.md` or the component spec, and to the generator or
the component files, in the same change. A token's name or value changes
only in a task that says so (constitution, principle II).
