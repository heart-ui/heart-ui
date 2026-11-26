# Theming

Your theme is two files beside each other in `assets/css/`:

- `tokens.css` holds the values, as CSS variables named `--h-*`: colours,
  radii, control heights, spacing, shadows and fonts, with a light and a dark
  set.
- `theme.css` imports Tailwind and `tokens.css`, and maps each variable to a
  Tailwind utility. It doesn't hold values; leave it as it is.

## Utilities

Components style themselves with utilities that read the variables, so a
change to `tokens.css` reaches every component:

| Utility | Reads |
| --- | --- |
| `bg-background`, `text-foreground` | The page |
| `bg-surface`, `bg-muted`, `text-muted-foreground` | Cards, panels, quiet text |
| `bg-primary`, `text-primary-foreground` | The primary action |
| `border-border`, `ring-ring` | Borders and focus rings |
| `rounded-md`, `shadow-md` | Radius and elevation |
| `h-control-md`, `px-control-px-md` | Control sizes |

Use the same utilities in your own code, instead of palette colours like
`bg-blue-600` or arbitrary values, and your screens follow the theme too.

## Change a value

Edit the variable in `tokens.css`. For example, a different primary colour:

```css
:root {
  --h-primary: oklch(0.55 0.2 150);
}
```

Change its pair too (`--h-primary-foreground`, and the dark set's values), so
text on it keeps its contrast.

## Pick a preset

`npx heart-ui init --theme <preset>` writes a preset's `tokens.css` when you
set a project up. The presets are listed by `npx heart-ui init --help`.

| Preset | Primary | Radius | Density | Shadow |
| --- | --- | --- | --- | --- |
| `default` | blue | 0.5 rem | default | soft |
| `graphite` | near black | 0.25 rem | compact | crisp |
| `forest` | green | 0.75 rem | comfortable | soft |
| `rose` | rose | 0.75 rem | default | crisp |
| `sunset` | orange | 0.5 rem | default | soft |
| `violet` | violet | 1 rem | default | none |

To switch presets on one page, install the theme package at your CLI's
version (`npm install @heart-ui/theme@<heart-ui version>`; `init` copies its
files but doesn't add it), import `@heart-ui/theme/presets.css` after
`theme.css`, and set `data-heart-theme="<preset>"` on `<html>`. Dark mode
still follows `.dark` or `data-theme="dark"`. Themes don't nest: set one per
page. A preset set this way wins over edits to your `tokens.css`; to change
values, edit `tokens.css` and leave `data-heart-theme` off.
