# Dropdown Menu

A list of actions or options opened from a button: row actions, an
account menu, view settings. Use `select` to pick a form value, and
`command` for a searchable list of commands.

## Usage

```vue
<DropdownMenu>
  <DropdownMenuTrigger as-child><Button>Actions</Button></DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem @select="rename">Rename</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="danger" @select="remove">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `DropdownMenu` | `open` | `boolean` | none | `v-model:open` |
| `DropdownMenu` | `modal` | `boolean` | `true` | `false` keeps the page usable while open |
| `DropdownMenuTrigger` | `asChild` | `boolean` | `false` | Merge onto the child, such as a `Button` |
| `DropdownMenuTrigger` | `as` | `string \| Component` | none | Element to render; Reka renders a `button` |
| `DropdownMenuContent` | `align` | `start \| center \| end` | `start` | Against the trigger |
| `DropdownMenuItem` | `variant` | `default \| danger` | `default` | `danger` for destructive actions |
| `DropdownMenuItem` | `disabled` | `boolean` | `false` | |
| `DropdownMenuCheckboxItem` | `modelValue` | `boolean` | `false` | `v-model` |
| `DropdownMenuCheckboxItem` | `disabled` | `boolean` | `false` | |
| `DropdownMenuRadioGroup` | `modelValue` | `string` | none | `v-model`; the chosen item's `value` |
| `DropdownMenuRadioItem` | `value` | `string` | none | Required |
| `DropdownMenuRadioItem` | `disabled` | `boolean` | `false` | |
| `DropdownMenuSub` | `open` | `boolean` | none | `v-model:open` |
| `DropdownMenuSubTrigger` | `disabled` | `boolean` | `false` | |

Every part that renders an element takes `class`, merged last.
`DropdownMenu` and `DropdownMenuSub` render no element of their own.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `DropdownMenu` | `default` | The trigger and the content |
| `DropdownMenuTrigger` | `default` | The control that opens the menu |
| `DropdownMenuContent` | `default` | Items, labels, separators and submenus |
| `DropdownMenuItem` | `default` | The action's name |
| `DropdownMenuItem` | `leading` | An icon before the name |
| `DropdownMenuItem` | `trailing` | A shortcut hint or icon after the name |
| `DropdownMenuCheckboxItem` | `default` | The option's name |
| `DropdownMenuRadioGroup` | `default` | Radio items |
| `DropdownMenuRadioItem` | `default` | The option's name |
| `DropdownMenuLabel` | `default` | A heading for the items that follow |
| `DropdownMenuSub` | `default` | The sub trigger and the sub content |
| `DropdownMenuSubTrigger` | `default` | The submenu's name |
| `DropdownMenuSubContent` | `default` | The submenu's items |

## Events

| Part | Event | Payload | When |
| --- | --- | --- | --- |
| `DropdownMenu` | `update:open` | `boolean` | The menu opens or closes |
| `DropdownMenuItem` | `select` | `Event` | Chosen by click, `Enter` or `Space`; `preventDefault()` keeps the menu open |
| `DropdownMenuCheckboxItem` | `update:modelValue` | `boolean` | Toggled |
| `DropdownMenuCheckboxItem` | `select` | `Event` | Chosen |
| `DropdownMenuRadioGroup` | `update:modelValue` | `string` | An item is chosen |
| `DropdownMenuRadioItem` | `select` | `Event` | Chosen |
| `DropdownMenuSub` | `update:open` | `boolean` | The submenu opens or closes |

## Tokens

None of its own. The menu is `surface-raised` with `shadow-md`, stacked at
`z-popover`; the highlighted item is `muted`; a danger item uses
`danger-subtle-foreground`, and `danger-subtle` when highlighted.

## States

closed, open; item hover and keyboard highlight; disabled item; danger
item; items with leading icons and trailing shortcuts; checkbox items on
and off; radio items; labels and separators; an open submenu.

## Keyboard

| Key | Action |
| --- | --- |
| `Enter`, `Space`, `ArrowDown` | Open the menu on the trigger, first item highlighted |
| `ArrowDown`, `ArrowUp` | Move between items, skipping disabled ones |
| `Enter`, `Space` | Choose the highlighted item |
| `ArrowRight` (`ArrowLeft` in RTL) | Open a submenu |
| `ArrowLeft` (`ArrowRight` in RTL) | Close a submenu |
| Letters | Jump to the next item starting with them |
| `Escape` | Close; focus returns to the trigger |

## Accessibility

- The content is `role="menu"`; items are `menuitem`, `menuitemcheckbox`
  and `menuitemradio`, with `aria-checked` on the last two.
- The trigger has `aria-haspopup="menu"` and `aria-expanded`.
- Leading icons and the check and radio marks are `aria-hidden`.
- A trailing shortcut hint is text; it is read as part of the item's name.

## Do

```vue
<DropdownMenuItem @select="duplicate">
  <template #leading><Icon name="add" /></template>
  Duplicate
  <template #trailing>⌘D</template>
</DropdownMenuItem>
```

## Do not

```vue
<!-- A menu as a form field: use a select, so the value submits with the form. -->
<DropdownMenu>
  <DropdownMenuTrigger as-child><Button>{{ country }}</Button></DropdownMenuTrigger>
</DropdownMenu>
```
