# Tooltip

A short text hint for a control, shown on hover and keyboard focus: the
name of an icon button, or a shortcut. Use `popover` for content people
interact with, and visible text for anything they must read.

## Usage

```vue
<!-- Once, at the app root. -->
<TooltipProvider>
  <App />
</TooltipProvider>

<Tooltip>
  <TooltipTrigger as-child>
    <Button variant="ghost" aria-label="Archive"><Icon name="close" /></Button>
  </TooltipTrigger>
  <TooltipContent>Archive</TooltipContent>
</Tooltip>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `TooltipProvider` | `delayDuration` | `number` | `700` | Milliseconds of hover before a tooltip opens |
| `TooltipProvider` | `skipDelayDuration` | `number` | `300` | Moving to another trigger within this time opens it at once |
| `TooltipProvider` | `ignoreNonKeyboardFocus` | `boolean` | `true` | Only keyboard focus opens a tooltip; `false` lets any focus open it |
| `Tooltip` | `open` | `boolean` | none | `v-model:open` |
| `Tooltip` | `delayDuration` | `number` | none | Overrides the provider's for this tooltip |
| `TooltipTrigger` | `asChild` | `boolean` | `false` | Merge onto the child, such as a `Button` |
| `TooltipTrigger` | `as` | `string \| Component` | none | Element to render; Reka renders a `button` |
| `TooltipContent` | `side` | `top \| right \| bottom \| left` | `top` | Flips when there is no room |

`TooltipContent` takes `class`, merged last. `TooltipProvider` and
`Tooltip` render no element of their own.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `TooltipProvider` | `default` | The app |
| `Tooltip` | `default` | The trigger and the content |
| `TooltipTrigger` | `default` | The control the tooltip describes |
| `TooltipContent` | `default` | The hint text |

## Events

| Part | Event | Payload | When |
| --- | --- | --- | --- |
| `Tooltip` | `update:open` | `boolean` | The tooltip opens or closes |

## Tokens

None of its own. The tooltip inverts the page colours (`foreground`
behind `background` text), at `z-tooltip`, corners `radius-sm`.

## States

closed; open on hover after the delay; open on keyboard focus; each side;
text that wraps at the maximum width.

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | Focusing the trigger opens the tooltip at once |
| `Escape` | Closes the tooltip; focus stays on the trigger |

## Accessibility

- The content has `role="tooltip"`; the trigger's `aria-describedby`
  points at it while open.
- A tooltip only describes. Give an icon-only trigger its own accessible
  name (`aria-label`); the tooltip doesn't name it.
- Never put links, buttons or other interactive content in a tooltip.
- Only keyboard focus opens a tooltip. Focus moved by script after a
  mouse action (a menu closing on a click) doesn't, so tooltips don't pop
  up unasked.
- A `TooltipTrigger` that renders its own button is `type="button"`, so it
  never submits a form. With `as-child`, give a plain `<button>` child
  `type="button"` yourself (the `Button` component already does).

## Do

```vue
<Tooltip>
  <TooltipTrigger as-child>
    <Button variant="ghost" aria-label="Search"><Icon name="search" /></Button>
  </TooltipTrigger>
  <TooltipContent>Search (/)</TooltipContent>
</Tooltip>
```

## Do not

```vue
<!-- A tooltip as the only label of an icon button: it isn't its name. -->
<Tooltip>
  <TooltipTrigger as-child><Button variant="ghost"><Icon name="search" /></Button></TooltipTrigger>
  <TooltipContent>Search</TooltipContent>
</Tooltip>
```
