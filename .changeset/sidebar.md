---
'heart-ui': minor
---

Add the `sidebar` component: the app's main navigation on Reka `Collapsible`, rendered as a `nav` named by `navLabel`, with `SidebarHeader`, `SidebarContent`, `SidebarGroup` (named by `heading`), `SidebarItem` (`href`, `active`, `as`, `asChild`, a `leading` icon slot), `SidebarFooter` and `SidebarTrigger` parts. `v-model:collapsed` narrows it to a rail of icons; below 768 px it is hidden and `v-model:open` shows it in a `drawer` from the start edge (P2-18).
