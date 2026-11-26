# Popover

A small panel anchored to a button, for content people interact with: a
few filter fields, a short form, or details with a link. Use `tooltip`
for a text-only hint, `dropdown-menu` for a list of actions, and `dialog`
when the task needs the whole page's attention.

## Usage

```vue
<Popover>
  <PopoverTrigger as-child>
    <Button variant="outline">Filters</Button>
  </PopoverTrigger>
  <PopoverContent>
    <Label for="owner">Owner</Label>
    <Input id="owner" v-model="owner" />
  </PopoverContent>
</Popover>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Popover` | `open` | `boolean` | none | `v-model:open` |
| `Popover` | `modal` | `boolean` | `false` | `true` traps focus inside, hides the rest of the page from screen readers and stops it scrolling; a click outside only closes the popover |
| `PopoverTrigger` | `asChild` | `boolean` | `false` | Merge onto the child, such as a `Button` |
| `PopoverTrigger` | `as` | `string \| Component` | none | Element to render; Reka renders a `button` |
| `PopoverContent` | `side` | `top \| right \| bottom \| left` | `bottom` | Flips when there is no room |
| `PopoverContent` | `align` | `start \| center \| end` | `center` | Edge of the trigger the panel lines up with |
| `PopoverClose` | `asChild` | `boolean` | `false` | Merge onto the child, such as a `Button` |
| `PopoverClose` | `as` | `string \| Component` | none | Element to render; Reka renders a `button` |

`PopoverContent` takes `class`, merged last. `Popover` renders no element
of its own.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `Popover` | `default` | The trigger and the content |
| `PopoverTrigger` | `default` | The control that opens the panel |
| `PopoverContent` | `default` | The panel's content |
| `PopoverClose` | `default` | The control that closes the panel |

## Events

| Part | Event | Payload | When |
| --- | --- | --- | --- |
| `Popover` | `update:open` | `boolean` | The popover opens or closes |

## Tokens

None of its own. The panel is `surface-raised` with a `border` edge,
`shadow-md`, corners `radius-md`, at `z-popover`. It is `w-72` wide and
never wider or taller than the room beside the trigger; longer content
scrolls.

## States

closed; open on a click of the trigger; open from `v-model:open`; each
side; each alignment; modal; content that scrolls at the available
height; 375 px.

## Keyboard

| Key | Action |
| --- | --- |
| `Enter`, `Space` | On the trigger: opens or closes the popover |
| `Tab` | Moves through the content; in a modal popover, wraps at the ends |
| `Escape` | Closes the popover and returns focus to the trigger |

## Accessibility

- The content has `role="dialog"` and is always named by its trigger
  (Reka sets `aria-labelledby` to the trigger's `id`), so give an
  icon-only trigger an `aria-label` that names the panel too.
- The trigger has `aria-haspopup="dialog"`, `aria-expanded`, and, while
  open, `aria-controls` pointing at the content.
- Opening moves focus to the first focusable control in the content;
  closing returns it to the trigger.
- A click outside or `Escape` closes a popover. A modal popover also
  traps focus, hides the rest of the page from screen readers and stops
  it scrolling until it closes; its outside click closes it without
  reaching the control under the pointer.
- A `PopoverTrigger` or `PopoverClose` that renders its own button is
  `type="button"`, so it never submits a form.

## Do

```vue
<Popover>
  <PopoverTrigger as-child>
    <Button variant="ghost" aria-label="Filters"><Icon name="search" /></Button>
  </PopoverTrigger>
  <PopoverContent>
    <Label for="filter-owner">Owner</Label>
    <Input id="filter-owner" />
    <PopoverClose as-child>
      <Button size="sm">Apply</Button>
    </PopoverClose>
  </PopoverContent>
</Popover>
```

## Do not

```vue
<!-- An icon trigger with no name: the popover is named by its trigger, so it has no name either. -->
<Popover>
  <PopoverTrigger as-child>
    <Button variant="ghost"><Icon name="search" /></Button>
  </PopoverTrigger>
  <PopoverContent>Owner, status and due date filters</PopoverContent>
</Popover>
```
