---
'@heart-ui/theme': minor
'heart-ui': minor
---

Add four theme presets, `graphite`, `forest`, `sunset` and `violet`, next to `default`. `heart-ui init --theme <preset>` offers all five. `generateTheme(knobs, { scoped: true })` puts a theme under `[data-heart-theme="<name>"]`, and `@heart-ui/theme/presets.css` holds every preset scoped that way, so one page can switch between them (P2-01).
