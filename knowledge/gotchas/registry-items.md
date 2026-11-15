---
type: gotcha
title: Registry item gotchas
description: Import paths, tailwind-merge and token utilities, loading and disabled states, Playwright clicks, Reka Dialog events, attrs tracking.
---

# Registry item gotchas

- **Import shared code as `@/lib/...`, never `../../lib`.** The CLI writes `ui` and `lib` under different aliases. The registry build rejects a relative import that leaves the item.
- **`cn()` must know every token utility.** tailwind-merge doesn't read the Tailwind theme. Without the extension in `registry/lib/utils` it dropped `ring-offset-focus` next to `ring-offset-background`, and kept two `duration-*` classes. A new token utility needs a line there and a test.
- **Pin `item.json` dependencies.** Use `name@version`, matching the root `package.json`; the build checks it.
- **Don't block clicks with `pointer-events-none`.** The click lands on the parent instead. Block it in a capture handler; `opacity-0` (not `invisible`) keeps hidden text in the accessibility tree.
- **Playwright's real click waits for an `aria-disabled` element to become enabled.** Pass `{ force: true }` to test that a click on it is blocked.
- **Single-word component files need an `H`-prefixed name.** Keep `vue/multi-word-component-names` and set `defineOptions({ name: 'HButton' })`.
- **Reka's Dialog focus events aren't mount and unmount signals.** `openAutoFocus` is skipped when focus is already inside the content (a field that focuses itself). `closeAutoFocus` fires while the element is still in the DOM, and also when `modal` changes while open, because Reka swaps the modal and non-modal content. Follow the root's `open` state, and check it before treating `closeAutoFocus` as closed.
- **Reka always sets `aria-describedby` on dialog content.** It points at the description id even without a description, and warns in development. `DialogContent` drops it until a `DialogDescription` registers.
- **A computed doesn't track `in` or spread on `useAttrs()`.** The attrs proxy tracks only property reads. Do such checks in the render, which reruns when attrs change.
