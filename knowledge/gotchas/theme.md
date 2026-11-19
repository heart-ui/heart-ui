---
type: gotcha
title: Theme generator gotchas
description: Fixed-lightness scales and contrast, CSS color parsing, Tailwind namespaces.
---

# Theme generator gotchas

- **Scale lightness is fixed, so contrast is almost hue-independent.** Every scale takes its lightness from the tokens.md table, and WCAG luminance tracks OKLab lightness closely. So a 500 step on neutral-950 is about 4.2:1 for any hue. The tokens.md table was changed to steps that pass, and a test keeps the default theme at zero moves. If that test fails after a table edit, fix the table, not the test ([questions](../../docs/questions.md)).
- **Move a background with its states.** Moving `primary` alone makes it equal `primary-hover`. A state that fails as a background moves its owner's whole group, and a group moves only when every member can.
- **`culori` output isn't normalized.** `converter('oklch')` leaves `h` undefined for grays and hands an `oklch()` input back as written, so a hue of -100 stays -100. A `none` channel comes back undefined (CSS reads it as 0), and alpha `none` (transparent) looks the same as no alpha. `rgb()`, hex and named channels aren't clamped the way browsers clamp them, and `color(srgb …)` shares culori's `rgb` mode but isn't clamped by CSS. `parseColor` handles all of these; import from `culori/fn` and register only the CSS modes.
- **Allow-list text that goes into CSS.** A deny-list of `; { }` missed `Inter(`: an open parenthesis swallows the rest of the stylesheet.
- **Tailwind v4 has no theme namespace for durations or z-index.** Use `@utility` in `theme.css`. A `--spacing-<name>` key does produce `h-<name>`, `px-<name>` and `gap-<name>`, and the playground builds prove it.
- **Built CSS rewrites color values.** Lightning CSS turns `oklch(0.554 0.2 260)` into `oklch(55.4% .2 260)`, so a test comparing a computed custom property with the generator's text fails. Resolve both sides through the browser (set each as an element's `color`, compare `getComputedStyle().color`), as the visual spec does.
- **Generated CSS stays out of prettier.** `tokens.css` and `presets.css` are pinned byte for byte against the generator; prettier rewrites their quotes, so both are in `.prettierignore`.
