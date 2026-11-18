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
