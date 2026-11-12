# Dialog

Modal window for a short, blocking decision or a small form. Use `drawer`
to keep list context and a full page for long tasks
([layout-rules.md](../layout-rules.md#detail-and-editing)).

## Usage

```vue
<Dialog v-model:open="open">
  <DialogTrigger as-child><Button>Rename</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Rename project</DialogTitle>
      <DialogDescription>The URL does not change.</DialogDescription>
    </DialogHeader>
    <Input v-model="name" />
    <DialogFooter>
      <DialogClose as-child><Button variant="ghost">Cancel</Button></DialogClose>
      <Button variant="primary" @click="rename">Rename</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Dialog` | `open` | `boolean` | `false` | `v-model:open` |
| `Dialog` | `modal` | `boolean` | `true` | |
| `DialogContent` | `size` | `sm \| md \| lg` | `md` | Max width 24, 32, 48 rem |
| `DialogContent` | `dismissible` | `boolean` | `true` | `false` blocks Escape and outside click |
| `DialogContent` | `showClose` | `boolean` | `true` | Corner close button |
| `DialogContent` | `closeLabel` | `string` | `Close` | Accessible name of the close button |

`DialogContent` renders the portal and the overlay. The other parts take
`class` only.

## Slots

Every part has a `default` slot.

## Events

| Part | Event | Payload | When |
| --- | --- | --- | --- |
| `Dialog` | `update:open` | `boolean` | Open state changes |
| `DialogContent` | `close` | none | After the close animation ends |

## Tokens

| Token | Falls back to | Controls |
| --- | --- | --- |
| `--tre-dialog-radius` | `--tre-radius-lg` | Corner radius |

Surface is `surface-raised`; overlay is `overlay`; stacking is `z-modal`.

## States

closed, open; three sizes; with and without description; long content
that scrolls inside the dialog; not dismissible; at 375 px (full-width
with page margin).

## Keyboard

| Key | Action |
| --- | --- |
| `Escape` | Close, when `dismissible` |
| `Tab`, `Shift+Tab` | Cycle focus inside the dialog |

## Accessibility

- `DialogTitle` is required. A missing title fails the browser test.
- Focus moves into the dialog on open and returns to the trigger on close.
- Content behind the dialog is inert and does not scroll.
- The close button's accessible name comes from the `closeLabel` prop on
  `DialogContent`, default `Close`.

## Do

```vue
<DialogFooter>
  <DialogClose as-child><Button variant="ghost">Cancel</Button></DialogClose>
  <Button variant="danger" @click="remove">Delete project</Button>
</DialogFooter>
```

## Do not

```vue
<!-- A dialog opened from inside a dialog. Use one dialog with steps. -->
<DialogContent>
  <Dialog><DialogTrigger>More</DialogTrigger></Dialog>
</DialogContent>
```
