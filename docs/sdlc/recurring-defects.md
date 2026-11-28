# Recurring defects

One line per defect: what it looks like, then the severity.

- An axe or visual test that sees only the demo state open on load, when the spec lists more states (closed, each size, each variant, 375 px): high.
- A spec line that promises a failure ("a missing title fails the browser test") with no test that triggers it: high.
- A client that types data from the network or disk (registry items, config) with fields it never validates, such as a file `path` or `target` that may be absolute, contain `..`, or point into `.git`: high.
- A catch-all that prints a raw system or library error message (`EACCES: …`, `fetch failed`, a bare `JSON.parse` `SyntaxError` with no file name) instead of a fixed line: high.
- A command printed for the user to paste, or passed to a shell, that holds text from a registry or other untrusted source: high.
- A file edit through temp-and-rename that replaces a symlink, or follows one out of the project: high.
- A setup step that writes its "already set up" marker before the rest, so a failed run blocks every re-run: high.
- Deciding whether the user changed a copied file by comparing it with the latest upstream content instead of the hash recorded at install: high.
- A step promised to leave nothing behind ("a failed add leaves files and the lock as they were") whose later step (an install) runs outside the rollback: high.
- Untrusted text (a registry's index, item fields) printed to the terminal with only some fields cleaned of control characters: high.
- A signature or checksum computed over a re-encoded string instead of the exact bytes sent: high.
- An entry-point guard (`argv[1] === import.meta.url`) that silently does nothing when run through a symlink: medium.
- A recursive walk (or a recursive parser) over untrusted nested input with no depth cap, so a crafted file overflows the stack and reports "Unexpected error": high.
- A scan of untrusted input that is quadratic: a regex with overlapping quantifiers, a per-item rescan of the whole file, a per-item copy of growing state (including a library's, such as a parser's lookahead cloning): high.
- A parser-free reading of code by regex or token walk that is meant to match a real rule or compiler: it diverges on each new syntax shape; use the real parser: medium.
- A check that the task's own gate never runs: wired into a unit test that the per-item plan (`check:item`) skips, or into a script that other callers bypass: high.
- A size or count budget (bytes, lines, items) checked only against today's data when the plan says the data grows; size it on the planned count and test that projection: medium.
- A component `<style>` block that declares a Tailwind layer (`@layer base|components|utilities`) and gets bundled before `@import 'tailwindcss'`, locking that layer below Preflight: high.
- An expanding or collapsing panel that keeps `overflow-hidden` while open, clipping the focus rings of controls inside it: high.
- A part that binds an attribute (`href`, `id`) onto an `asChild` or `as` child even when unset, replacing what a `RouterLink` or `NuxtLink` child computes: high.
- A component that corrects its `v-model` value by emitting at setup or from an immediate watch (clamping, defaulting), which resets a deep-linked value while data loads, emits during SSR and passes `NaN` through: medium.
- A `tabindex` or role tied to a measured state (overflow, size) that is removed while the element has focus, or on a `blur` from a window switch, dropping keyboard focus to the page: medium.
- An enter or exit animation tested only at its first frame and after `finish()`, so a property that can't interpolate (to or from `auto`) and jumps midway passes: high.
- A hidden copy of a primitive's parts (rendered to measure or to read text) that still registers with the primitive, so its keyboard and ARIA act on elements nobody can see: high.
- A highlight or `aria-activedescendant` that keeps pointing at an element after it unmounts (the list closed or filtered to nothing), so the reference names a removed id and Enter falls through to the form: high.
- A part whose root is a wrapper (`li`, a layer) that leaves fallthrough attributes (`target`, `rel`, `to`, `aria-*`) on the wrapper instead of the element they belong to: high.
- A click handler that skips its work on `event.defaultPrevented`, which a `RouterLink` or `NuxtLink` sets on every click it navigates: high.
- `sr-only` (absolutely positioned) text inside a scrolling box with no positioned ancestor in between, so the scroller doesn't clip it and the page grows to hold it: high.
- A fix that puts library classes after the caller's `class` in `cn()` to protect a behaviour; protect it with a variant the caller's class doesn't conflict with (`max-md:hidden`) and keep `class` last: high.
- An overlay closed by a condition only after it rendered, so its exit animation still plays; gate its `open` on the condition instead: medium.
- A value read from `useAttrs()` in another component's render (through a context): attributes aren't reactive and compiled slots don't rerender children, so mirror it into a ref in `onBeforeUpdate`: medium.
- A focus fallback written as one `querySelector('a, b')` expecting `a` to win: a selector list returns the first match in document order: medium.
