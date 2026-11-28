# Combobox

Pick one option from a long list by typing to filter it. Use `select` when
the list is short enough to scan, and `command` for a palette of actions.

## Usage

```vue
<Label for="country">Country</Label>
<Combobox v-model="country" name="country">
  <ComboboxInput id="country" placeholder="Search countries" />
  <ComboboxContent>
    <ComboboxItem value="de">Germany</ComboboxItem>
    <ComboboxItem value="fr">France</ComboboxItem>
    <ComboboxEmpty>No country matches.</ComboboxEmpty>
  </ComboboxContent>
</Combobox>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Combobox` | `modelValue` | `string` | none | `v-model`; the chosen item's `value` |
| `Combobox` | `open` | `boolean` | none | `v-model:open` |
| `Combobox` | `disabled` | `boolean` | `false` | |
| `Combobox` | `name` | `string` | none | Form field name; submits the chosen `value`, not the text |
| `Combobox` | `filter` | `boolean` | `true` | Hides items whose text doesn't contain the typed text, ignoring case and accents. `false` shows every item, for a list the caller loads as the text changes |
| `Combobox` | `class` | `ClassValue` | none | On the element around the field |
| `ComboboxInput` | `modelValue` | `string` | `''` | `v-model`; the text in the field. Read it to load results when `filter` is `false` |
| `ComboboxInput` | `size` | `sm \| md \| lg` | `md` | Same heights as `input` |
| `ComboboxInput` | `invalid` | `boolean` | `false` | Sets `aria-invalid` and the danger border |
| `ComboboxInput` | `placeholder` | `string` | none | Shown while the field is empty |
| `ComboboxInput` | `displayValue` | `(value: string) => string` | none | Text shown for the chosen value. Without it, the chosen item's text, once the list has rendered; until then the value itself |
| `ComboboxInput` | `toggleLabel` | `string` | `Show options` | Accessible name of the button that opens the list |
| `ComboboxItem` | `value` | `string` | none | Required, not empty |
| `ComboboxItem` | `disabled` | `boolean` | `false` | |
| `ComboboxGroup` | `heading` | `string` | none | Shown above the group's items, and names the group |

Every part takes `class`, merged last; on `ComboboxInput` it goes to the
box around the field. Other attributes on `ComboboxInput` (`id`, `aria-*`)
go to the `input`, so a `label` with `for` names it. With a `name`, a
hidden field submits the chosen `value` in its form.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `Combobox` | `default` | The input and the content |
| `ComboboxContent` | `default` | Items, groups and the empty message |
| `ComboboxItem` | `default` | The option's text; filtering matches it |
| `ComboboxGroup` | `default` | Items |
| `ComboboxEmpty` | `default` | Shown when no item matches, or when there are no items |

## Events

| Part | Event | Payload | When |
| --- | --- | --- | --- |
| `Combobox` | `update:modelValue` | `string` | An item is chosen |
| `Combobox` | `update:open` | `boolean` | The list opens or closes |
| `ComboboxInput` | `update:modelValue` | `string` | The text in the field changes, by typing or when it resets to the chosen item's text |

## Tokens

None of its own. The field shares `input`'s radius (`--h-input-radius`),
heights and colours; the list is `surface-raised` with `shadow-md`, as wide
as the field, stacked at `z-popover`.

## States

empty with placeholder, chosen; typing with matches, with no match (the
empty message); hover, focus-visible, open; invalid; disabled field,
disabled item; three sizes; groups with headings; a list longer than the
room below the field (scrolls); `filter` off with results the caller loads.

## Keyboard

| Key | Action |
| --- | --- |
| Letters | Type in the field; the list opens and shows the matches, the first highlighted |
| `ArrowDown`, `ArrowUp` | Open the list; move between items, skipping disabled ones |
| `Home`, `End` | Highlight the first or last item |
| `Enter` | Choose the highlighted item and close; the field shows its text |
| `Escape` | Close without choosing; focus stays in the field |
| `Tab` | Leave the field and close the list; the field shows the chosen item's text again |

## Accessibility

- The field is an `input` with `role="combobox"`, `aria-expanded`,
  `aria-controls`, `aria-autocomplete="list"` and `aria-activedescendant`
  following the highlighted item; the list is `role="listbox"` with
  `role="option"` items. Focus stays in the field while the list is open.
- Name the field with a `label` (`for` its `id`) or `aria-label`.
- The chosen item shows a check icon (`aria-hidden`) and has
  `aria-selected="true"`.
- A group with a `heading` is a `group` named by it.
- The button beside the field opens and closes the list for pointer users.
  It is out of the Tab order and named by `toggleLabel`.

## Do

```vue
<Combobox v-model="assignee" :filter="false">
  <ComboboxInput v-model="query" aria-label="Assignee" placeholder="Search people" />
  <ComboboxContent>
    <ComboboxItem v-for="person in people" :key="person.id" :value="person.id">
      {{ person.name }}
    </ComboboxItem>
    <ComboboxEmpty>No one matches.</ComboboxEmpty>
  </ComboboxContent>
</Combobox>
```

## Do not

```vue
<!-- Three options need no search: use a select or a radio group. -->
<Combobox v-model="priority">
  <ComboboxInput aria-label="Priority" />
  <ComboboxContent>
    <ComboboxItem value="low">Low</ComboboxItem>
    <ComboboxItem value="medium">Medium</ComboboxItem>
    <ComboboxItem value="high">High</ComboboxItem>
  </ComboboxContent>
</Combobox>
```
