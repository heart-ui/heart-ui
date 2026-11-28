# Sidebar

The app's main navigation, down the start edge of the screen. It collapses
to a rail of icons and, below 768 px, becomes a drawer the page opens from
its menu button. Use it as the `sidebar` region of `app-shell`
([layout-rules.md](../../../docs/layout-rules.md#responsive)); use `tabs`
to switch views inside one page.

## Usage

```vue
<Sidebar v-model:collapsed="collapsed" v-model:open="menuOpen">
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
      <SidebarItem href="/customers">
        <template #leading><Icon name="search" class="size-4" /></template>
        Customers
      </SidebarItem>
    </SidebarGroup>
  </SidebarContent>
  <SidebarFooter>Signed in as Ada</SidebarFooter>
</Sidebar>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Sidebar` | `collapsed` | `boolean` | `false` | `v-model:collapsed`. Narrows to `sidebar-width-collapsed`, icons only |
| `Sidebar` | `open` | `boolean` | `false` | `v-model:open`. The drawer below 768 px; it closes on a wider window |
| `Sidebar` | `navLabel` | `string` | `Navigation` | Accessible name of the `nav` and the drawer |
| `Sidebar` | `closeLabel` | `string` | `Close` | Accessible name of the drawer's close button |
| `SidebarGroup` | `heading` | `string` | none | Names the group; visually hidden while collapsed |
| `SidebarItem` | `href` | `string` | none | The page's address. Ignored with `asChild`: the child's link applies |
| `SidebarItem` | `active` | `boolean` | `false` | The current page: sets `aria-current="page"` |
| `SidebarItem` | `as` | `string \| Component` | none | Element to render; without it, an `a` with an `href`, else a `button`. An explicit `a` needs an `href` |
| `SidebarItem` | `asChild` | `boolean` | `false` | Merge onto the child, such as a `RouterLink` |
| `SidebarTrigger` | `toggleLabel` | `string` | `Toggle sidebar` | Accessible name of the collapse button |

Every part takes `class`. `Sidebar`'s `class` and attributes go to the
`nav`, not to the drawer; a `SidebarItem`'s go to its link or button (or
its `asChild` child), not to the list item around it. Items sit inside a
`SidebarGroup`, which holds their list. The `nav` is hidden below 768 px
whatever its `class`; above, a display class such as `md:grid` applies. Its
Reka collapsible reaches the slot, so a `Collapsible` part in sidebar content
needs its own root. Collapsed, header and
footer content stays on one line and is clipped to the rail. The `nav` is `sidebar-width` wide and as tall
as its parent lets it be, so give it a height (`h-dvh`, or a full-height
grid row in `app-shell`). Below 768 px nothing shows in its place: the page
needs its own menu button, shown only there (`md:hidden`), that sets `open`.

While the drawer is open its content is a second copy of the slot, so keep
fixed `id`s and work done on mount (fetching) out of sidebar content. A plain
click on a `SidebarItem` closes the drawer; a click that opens a new tab
(Ctrl, Cmd, Shift, middle button) doesn't, and neither does a link elsewhere
in the header or footer, which should set `open` to `false` itself. With
`asChild`, the child holds the icon and the text, and a collapsed rail shows
only its start.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `Sidebar` | `default` | Header, content and footer |
| `SidebarHeader` | `default` | Brand or workspace switcher, and the trigger |
| `SidebarContent` | `default` | Groups; it scrolls when they don't fit |
| `SidebarGroup` | `default` | Items |
| `SidebarItem` | `default` | The item's text |
| `SidebarItem` | `leading` | The item's icon; the only thing that shows while collapsed |
| `SidebarFooter` | `default` | User menu or settings link |
| `SidebarTrigger` | `default` | The button's icon, replacing the chevron |

## Events

| Part | Event | Payload | When |
| --- | --- | --- | --- |
| `Sidebar` | `update:collapsed` | `boolean` | The trigger collapses or expands it |
| `Sidebar` | `update:open` | `boolean` | The drawer opens or closes |

## Tokens

`sidebar-width` and `sidebar-width-collapsed` set the width. The `nav` is
`surface` with a `border` on its end edge; the active item is `muted` with
`foreground` text, the others `muted-foreground` until hovered. Items are
`control-md` tall with `radius-md`. The drawer is `drawer`'s.

## States

expanded, collapsed; an active item; groups with and without a heading;
long content that scrolls inside `SidebarContent`; right-to-left text;
below 768 px: hidden, and the drawer open.

## Keyboard

| Key | Action |
| --- | --- |
| `Tab`, `Shift+Tab` | Move through the trigger and items |
| `Enter`, `Space` | On the trigger, collapse or expand |
| `Escape` | Close the drawer below 768 px |

## Accessibility

- The `nav` is a landmark named by `navLabel`. Each group is a `group`
  named by its heading.
- The current page's item has `aria-current="page"`.
- Collapsed, the text is visually hidden, not removed, so every item keeps
  its name. Give every item a `leading` icon, or a collapsed item shows
  nothing.
- The trigger has `aria-expanded` and `aria-controls` pointing at the `nav`.
- Below 768 px the drawer is a modal `dialog` named by `navLabel`; focus
  moves into it and the page behind it is inert.

## Do

```vue
<Sidebar v-model:open="menuOpen">
  <SidebarContent>
    <SidebarGroup heading="Reports">
      <SidebarItem as-child :active="route.path === '/reports'">
        <RouterLink to="/reports">Reports</RouterLink>
      </SidebarItem>
    </SidebarGroup>
  </SidebarContent>
</Sidebar>
```

## Do not

```vue
<!-- A trigger outside the Sidebar has no sidebar to toggle. Below 768 px,
     open the drawer from the page's own button: @click="menuOpen = true". -->
<header><SidebarTrigger /></header>
<Sidebar>...</Sidebar>
```
