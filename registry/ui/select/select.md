# Select

Pick one option from a list of more than about five. Use `radio-group`
when every option should be visible, and `combobox` when the list needs
filtering.

## Usage

```vue
<Label for="country">Country</Label>
<Select v-model="country" name="country">
  <SelectTrigger id="country" placeholder="Choose a country" />
  <SelectContent>
    <SelectItem value="de">Germany</SelectItem>
    <SelectItem value="fr">France</SelectItem>
  </SelectContent>
</Select>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Select` | `modelValue` | `string` | none | `v-model`; the chosen item's `value` |
| `Select` | `open` | `boolean` | none | `v-model:open` |
| `Select` | `disabled` | `boolean` | `false` | |
| `Select` | `name` | `string` | none | Form field name; submits the chosen `value` |
| `Select` | `required` | `boolean` | `false` | Blocks submit until one is chosen; needs `name` |
| `SelectTrigger` | `size` | `sm \| md \| lg` | `md` | Same heights as `input` |
| `SelectTrigger` | `invalid` | `boolean` | `false` | Sets `aria-invalid` and the danger border |
| `SelectTrigger` | `placeholder` | `string` | none | Shown while nothing is chosen |
| `SelectItem` | `value` | `string` | none | Required |
| `SelectItem` | `disabled` | `boolean` | `false` | |

Every part except `Select` takes `class`, merged last. `Select` renders no
element of its own. Attributes on `SelectTrigger` (`id`, `aria-*`) go to the
trigger button, so a `label` with `for` names it.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `Select` | `default` | The trigger and the content |
| `SelectContent` | `default` | Items, groups and separators |
| `SelectItem` | `default` | The option's text |
| `SelectGroup` | `default` | A label and items |
| `SelectLabel` | `default` | The group's heading |

## Events

| Part | Event | Payload | When |
| --- | --- | --- | --- |
| `Select` | `update:modelValue` | `string` | An item is chosen |
| `Select` | `update:open` | `boolean` | The list opens or closes |

## Tokens

None of its own. The trigger shares `input`'s radius (`--h-input-radius`)
and colours; the list is `surface-raised` with `shadow-md`, stacked at
`z-popover`.

## States

empty with placeholder, chosen; hover, focus-visible, open; invalid;
disabled trigger, disabled item; three sizes; groups with labels and a
separator; a list longer than the viewport (scrolls).

## Keyboard

| Key | Action |
| --- | --- |
| `Enter`, `Space`, `ArrowDown`, `ArrowUp` | Open the list on the trigger |
| `ArrowDown`, `ArrowUp` | Move between items, skipping disabled ones |
| `Enter`, `Space` | Choose the highlighted item and close |
| Letters | Jump to the next item starting with them |
| `Escape` | Close without choosing; focus returns to the trigger |

## Accessibility

- The trigger is a `button` with `role="combobox"`, `aria-expanded` and
  `aria-controls`; the list is `role="listbox"` with `role="option"` items.
- Name the trigger with a `label` (`for` its `id`) or `aria-label`.
- The chosen item shows a check icon (`aria-hidden`) and has
  `aria-selected="true"`.

## Do

```vue
<Select v-model="role">
  <SelectTrigger aria-label="Role" placeholder="Choose a role" />
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Staff</SelectLabel>
      <SelectItem value="admin">Admin</SelectItem>
      <SelectItem value="editor">Editor</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

## Do not

```vue
<!-- Two options: use a radio group, or a switch for on/off. -->
<Select v-model="billing">
  <SelectTrigger aria-label="Billing" />
  <SelectContent>
    <SelectItem value="monthly">Monthly</SelectItem>
    <SelectItem value="yearly">Yearly</SelectItem>
  </SelectContent>
</Select>
```
