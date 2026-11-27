# Drawer

Panel that slides in from an edge of the window for a quick view or edit
while the list behind it stays in context. Use `dialog` for a short,
blocking decision and a full page for long tasks
([layout-rules.md](../../../docs/layout-rules.md#detail-and-editing)).

## Usage

```vue
<Drawer v-model:open="open">
  <DrawerTrigger as-child><Button>Edit</Button></DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Edit invoice</DrawerTitle>
      <DrawerDescription>Changes save when you press Save.</DrawerDescription>
    </DrawerHeader>
    <Input v-model="customer" />
    <DrawerFooter>
      <DrawerClose as-child><Button variant="ghost">Cancel</Button></DrawerClose>
      <Button variant="primary" @click="save">Save</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Drawer` | `open` | `boolean` | `false` | `v-model:open` |
| `Drawer` | `modal` | `boolean` | `true` | |
| `DrawerContent` | `side` | `start \| end \| bottom` | `end` | Edge it slides in from; `start` and `end` follow the page's text direction (the `dir` on `html`) |
| `DrawerContent` | `size` | `sm \| md \| lg` | `md` | Side drawers: max width 24, 32, 48 rem. Bottom drawer: max height a third, a half, three quarters of the window |
| `DrawerContent` | `dismissible` | `boolean` | `true` | `false` blocks Escape and outside click |
| `DrawerContent` | `showClose` | `boolean` | `true` | Corner close button |
| `DrawerContent` | `closeLabel` | `string` | `Close` | Accessible name of the close button |
| `DrawerTrigger` | `asChild` | `boolean` | `false` | Merge onto the child, such as a `Button` |
| `DrawerTrigger` | `as` | `string \| Component` | none | Element to render; Reka renders a `button` |
| `DrawerClose` | `asChild` | `boolean` | `false` | Merge onto the child, such as a `Button` |
| `DrawerClose` | `as` | `string \| Component` | none | Element to render; Reka renders a `button` |
| `DrawerTitle` | `asChild` | `boolean` | `false` | Merge onto the child |
| `DrawerTitle` | `as` | `string \| Component` | none | Element to render; Reka renders an `h2` |
| `DrawerDescription` | `asChild` | `boolean` | `false` | Merge onto the child |
| `DrawerDescription` | `as` | `string \| Component` | none | Element to render; Reka renders a `p` |

`DrawerContent` renders the portal and the overlay. Its `class` styles the
drawer panel, so `class="w-sidebar-width"` sets a fixed width. A side
panel's width must be a fixed length: the layer around it is only as wide as
the panel, so a percentage such as `w-1/2` resolves against the panel's own
content. Padding and gap sit on the scrolling body inside it. A side drawer is the full height
of the window and fills its width up to the size's maximum, so on a phone
it covers the page. `Drawer` renders no element of its own, so it takes no
`class`; every other part does. `DrawerHeader` and `DrawerFooter` take
nothing else. The footer sits at the bottom of a side drawer whose content
is short.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `Drawer` | `default` | The trigger and the content |
| `DrawerTrigger` | `default` | The control that opens the drawer |
| `DrawerContent` | `default` | Header, body and footer |
| `DrawerHeader` | `default` | Title and description |
| `DrawerTitle` | `default` | The drawer's name |
| `DrawerDescription` | `default` | One line under the title |
| `DrawerFooter` | `default` | Actions, the primary one last |
| `DrawerClose` | `default` | The control that closes the drawer |

## Events

| Part | Event | Payload | When |
| --- | --- | --- | --- |
| `Drawer` | `update:open` | `boolean` | Open state changes |
| `DrawerContent` | `close` | none | After the close animation ends; not when the drawer is removed while open |

## Tokens

None of its own. The panel is `surface-raised` with a `border` on its inner
edge and `shadow-lg`; a bottom drawer has `radius-lg` top corners. The
overlay is `overlay`; stacking is `z-modal`. The overlay fades
(`fade-*`) and the panel slides from its edge, both over
`--h-duration-normal`, which is 0 ms under reduced motion.

## States

closed, open; each side (`start`, `end`, `bottom`), with `start` and `end`
in right-to-left text; three sizes on a side and on the bottom; with and
without description; long content that scrolls inside the drawer; not
dismissible; non-modal; at 375 px (full width).

## Keyboard

| Key | Action |
| --- | --- |
| `Escape` | Close, when `dismissible` |
| `Tab`, `Shift+Tab` | Cycle focus inside the drawer |

## Accessibility

- The panel is a `dialog`. `DrawerTitle` is required: a missing title
  fails the browser test.
- Focus moves into the drawer on open and returns to the trigger on close.
  When the content scrolls, the drawer itself takes focus, so reading starts
  at the top.
- While modal, content behind the drawer is inert and does not scroll.
- The close button's accessible name comes from the `closeLabel` prop on
  `DrawerContent`, default `Close`.
- Without a `DrawerDescription` the panel has no `aria-describedby`.

## Do

```vue
<DrawerContent side="end" size="sm">
  <DrawerHeader>
    <DrawerTitle>Invoice 1042</DrawerTitle>
  </DrawerHeader>
  <p>Paid on 12 March.</p>
</DrawerContent>
```

## Do not

```vue
<!-- A dialog opened from a drawer. Edit in the drawer, or use a full page. -->
<DrawerContent>
  <Dialog><DialogTrigger>Confirm</DialogTrigger></Dialog>
</DrawerContent>
```
