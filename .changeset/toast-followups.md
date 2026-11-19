---
---

Fix `toast`: toasts wait while the window had no focus when the `Toaster` mounted; a toast dismissed and added again with its `id` gets its full time; toasts added together stack oldest first; an action with an empty `altText` falls back to its label instead of breaking the list.
