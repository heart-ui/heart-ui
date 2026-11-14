---
type: gotcha
title: Docs site (VitePress) traps
description: Unlayered VitePress CSS vs Tailwind, iframe previews, re-exported .vue meta, link rewriting
---

# Docs site traps

- **VitePress's base CSS is unlayered.** It beats Tailwind's layered preflight and utilities (`button { background: transparent }` strips every button fill). Demo pages reset with `all: revert-layer` on `body` and `body *`. The selector must out-rank `button:focus:not(:focus-visible)`, hence `:root:root:has(.tre-demo)`. Remember `body` itself too: it carries `min-height: 100vh`, `min-width: 320px` and VitePress's font.
- **A frame sized from its own content loops.** If `body` has a `100vh` minimum, the content always equals the frame, so it never shrinks. Under Tailwind's `border-box` reset, setting the frame's height to the content height makes it 2px short on every pass. Size it as content plus `offsetHeight - clientHeight`.
- **A demo that focuses itself on load pulls the parent page's focus into the iframe** (Reka's dialog autofocus). `DemoPreview.vue` hands focus back unless the reader clicked, typed in or tabbed into the frame.
- **The iframe can finish loading before hydration**, so `@load` never fires on the component. Check `contentDocument.readyState` in `onMounted` too.
- **`vue-component-meta` can't follow `export { default as X } from './X.vue'`.** `getComponentMeta(index.ts, 'X')` throws "Export not found". Read each `.vue` file on its own. Also, its meta has its own `name: undefined`, so spread it before your own `name`.
- **Rewrite Markdown links with a markdown-it rule, not regexes.** Two review rounds kept finding link forms a line parser missed. The rule in `.vitepress/links.ts` works on parsed `link_open` tokens.
- **`@tailwindcss/vite` binds to whichever Vite the importer resolves.** The workspace has Vite 8 (playground) and VitePress 1.6 bundles Vite 5, so `apps/docs` pins `vite` 5.4.21 to keep the plugin's types and runtime on VitePress's Vite.
