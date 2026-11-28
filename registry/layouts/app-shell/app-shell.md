# App shell

The frame of every signed-in screen: the app's navigation down the start
edge, a topbar across the top, and the page in between.

## Use when

Any signed-in screen that shares navigation. Every other layout except
`auth` sits inside it.

## Avoid when

Signed-out screens (sign in, sign up, reset password): use `auth`. A
screen that is only a dialog or a drawer belongs to the page that opens it.

## Regions

| Region | Belongs here |
| --- | --- |
| `sidebar` | `SidebarHeader`, `SidebarContent` with groups of `SidebarItem`s, `SidebarFooter` (a `user-menu`). A `SidebarTrigger` in the header collapses it |
| `topbar` | `breadcrumb-bar`, search, `notification-list` in a popover, `user-menu`. Below 768 px it follows the menu button |
| `default` | The page: one `page-header`, then its sections, or another layout (`list-filters`, `dashboard`) |

## Data

```ts
interface AppShellProps {
  /** v-model:collapsed: the sidebar is a rail of icons. */
  collapsed?: boolean
  /** Accessible name of the navigation. Default `Navigation`. */
  navLabel?: string
  /** Text of the menu button below 768 px. Default `Menu`. */
  menuLabel?: string
  /** Accessible name of the drawer's close button. Default `Close`. */
  closeLabel?: string
}
```

## States

`long` only: the shell holds no data of its own, so `empty`, `loading`
and `error` belong to the blocks in `default`. With long content the page
scrolls while the sidebar and topbar stay in place.

## Responsive

- 375 px: the sidebar is hidden; the topbar starts with a `Menu` button
  that opens it as a drawer from the start edge. An item click closes it.
- 768 px: the sidebar shows beside the page, `sidebar-width` wide or
  collapsed to `sidebar-width-collapsed`; the menu button is gone.
- 1280 px: the same; the page content stops at `content-max` and centres.

The sidebar is sticky at the full window height and the topbar sticks to
the top (`topbar-height`, `z-sticky`). While mounted, the shell sets the
document's scroll padding to `topbar-height`, so an in-page link (`#billing`)
or a focused element never scrolls under the topbar.
The page is padded by `page-px` across and `section-gap` down. The menu
button is `control-md` tall, the touch target size below 768 px.

## Built from

`sidebar` (with `drawer` below 768 px) and `button`. The shell renders the
`Sidebar` itself: put its parts, not a `Sidebar`, in the `sidebar` slot.
It renders the page's only `main`, so pages inside it don't add one.

## Usage

```vue
<AppShell v-model:collapsed="collapsed">
  <template #sidebar>
    <SidebarHeader>
      <span class="font-semibold">Acme</span>
      <SidebarTrigger />
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup heading="Sales">
        <SidebarItem href="/invoices" active>
          <template #leading><Icon name="info" class="size-4" /></template>
          Invoices
        </SidebarItem>
      </SidebarGroup>
    </SidebarContent>
  </template>
  <template #topbar>
    <span class="font-medium">Invoices</span>
  </template>
  <h1 class="text-2xl font-semibold">Invoices</h1>
</AppShell>
```
