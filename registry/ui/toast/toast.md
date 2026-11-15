# Toast

A short message about something that just happened ("Invoice sent"),
shown in a corner and dismissed on its own after a few seconds. Use
`alert` for messages that must stay on the page, and `dialog` for a
decision people must make.

## Usage

```vue
<!-- Once, at the app root. -->
<Toaster />
```

```ts
import { toast } from '@/components/ui/toast'

toast({ title: 'Invoice sent', description: 'Ada Lovelace will get it by email.', variant: 'success' })

toast({
  title: 'Invoice archived',
  action: { label: 'Undo', altText: 'Undo archiving from the Archive page', onClick: restore },
})
```

`toast()` works anywhere: in a component, a store or a plain module. A
toast added before `Toaster` mounts shows once it mounts; one added
during server rendering is dropped.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `duration` | `number` | `5000` | Milliseconds before a toast closes on its own; a toast's own `duration` wins |
| `closeLabel` | `string` | `'Close'` | Accessible name of each toast's close button |
| `regionLabel` | `string` | `'Notifications ({hotkey})'` | Name of the toast region; `{hotkey}` becomes the key that focuses it |
| `announceLabel` | `string` | `'Notification'` | Read before each toast's text by screen readers |

`Toaster` takes `class`, merged last on the toast list.

## Slots

None; toasts come from `toast()`.

## Events

None.

## Function

`toast(options)` adds a toast and returns its `id`.

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string` | required | The message, in a few words |
| `description` | `string` | none | One sentence more |
| `variant` | `neutral \| success \| warning \| danger \| info` | `neutral` | The colour; say the outcome in the title too |
| `action` | `{ label, altText, onClick }` | none | One button; `altText` tells screen reader users where else they can do it |
| `duration` | `number` | the `Toaster`'s | `0` or `Infinity` keeps it open until closed |
| `id` | `string` | generated | Adding a toast with an open toast's `id` replaces it and restarts its timer |

`toast.dismiss(id)` closes that toast; `toast.dismiss()` closes every
toast. `useToast()` returns `{ toast, dismiss }` for use in components.

## Tokens

None of its own. A `neutral` toast is `surface-raised` with `border`;
each other variant is its `-subtle` background and text pair with a
border in the status colour. Shadow `shadow-lg`, corners `radius-md`,
at `z-toast`.

## States

open; closing; each variant; with a description; with an action; several
at once; paused while hovered or focused.

## Keyboard

| Key | Action |
| --- | --- |
| `F8` | Focuses the toast region |
| `Tab` | Moves through the toasts and their buttons |
| `Escape` | Closes the focused toast |

## Accessibility

- Each toast is announced through a live region, so its title and
  description are read without moving focus.
- Toasts pause their timer while hovered, focused or while the window
  is in the background.
- Colour is never the only cue: the title says what happened
  ("Payment failed"), not just the colour.
- An action must not be the only way to do something; its `altText`
  names the other way. Never put a decision people must make in a
  toast.
- Swipe to dismiss is off: the close button, `Escape` and the timer
  close a toast.

## Do

```ts
toast({ title: 'Payment failed', description: 'The card was declined.', variant: 'danger' })
```

## Do not

```ts
// A question in a toast: it closes on its own, and people may miss it.
toast({ title: 'Delete 3 invoices?', action: { label: 'Delete', altText: 'Delete', onClick: remove } })
```
