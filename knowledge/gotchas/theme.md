---
type: gotcha
title: Theme generator gotchas
description: Fixed-lightness scales and contrast, CSS color parsing, Tailwind namespaces.
---

# Theme generator gotchas

- **Scale lightness is fixed, so contrast is almost hue-independent.** Every scale takes its lightness from the tokens.md table, and WCAG luminance tracks OKLab lightness closely. So a 500 step on neutral-950 is about 4.2:1 for any hue, and the default dark theme always moves `primary`, `warning`, `danger` and `info` to 400. `checkContrast(knobs).adjustments` lists every move ([questions](../../docs/questions.md)).
- **Move a background with its states.** Moving `primary` alone makes it equal `primary-hover`. A state that fails as a background moves its owner's whole group, and a group moves only when every member can.
- **CSS color syntax differs by form.** Legacy comma `hsl()` needs `%`; modern `hsl(228 50 50)` reads bare numbers as percent. Legacy `rgb()` can't mix numbers and percentages. `deg` is only valid on hues.
- **Allow-list text that goes into CSS.** A deny-list of `; { }` missed `Inter(`: an open parenthesis swallows the rest of the stylesheet.
- **Tailwind v4 has no theme namespace for durations or z-index.** Use `@utility` in `theme.css`. A `--spacing-<name>` key does produce `h-<name>`, `px-<name>` and `gap-<name>`, and the playground builds prove it.
