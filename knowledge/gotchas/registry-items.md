---
type: gotcha
title: Registry item gotchas
description: Import paths, tailwind-merge and token utilities, loading and disabled states, Playwright clicks.
---

# Registry item gotchas

- **Import shared code as `@/lib/...`, never `../../lib`.** The CLI writes `ui` and `lib` under different aliases. The registry build rejects a relative import that leaves the item.
- **`cn()` must know every token utility.** tailwind-merge doesn't read the Tailwind theme. Without the extension in `registry/lib/utils` it dropped `ring-offset-focus` next to `ring-offset-background`, and kept two `duration-*` classes. A new token utility needs a line there and a test.
- **Pin `item.json` dependencies.** Use `name@version`, matching the root `package.json`; the build checks it.
- **Don't block clicks with `pointer-events-none`.** The click lands on the parent instead. Block it in a capture handler; `opacity-0` (not `invisible`) keeps hidden text in the accessibility tree.
- **Playwright's real click waits for an `aria-disabled` element to become enabled.** Pass `{ force: true }` to test that a click on it is blocked.
- **Single-word component files need a `Trev` name.** Keep `vue/multi-word-component-names` and set `defineOptions({ name: 'TrevButton' })`.
