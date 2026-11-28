---
'heart-ui': minor
---

Add the `app-shell` layout, the first item under `layouts/`: the frame of every signed-in screen. It renders the `sidebar` (its `sidebar` slot takes the sidebar's parts) with `v-model:collapsed`, a sticky topbar whose `Menu` button opens the navigation as a drawer below 768 px, and the page's only `main`, padded by `page-px` and capped at `content-max` (P2-20).
