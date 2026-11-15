# Checkbox

On/off choice that takes effect on submit, or one item in a list of
independent choices. Use `switch` for a setting that applies at once, and
`radio-group` when exactly one of several options must be chosen.

## Usage

```vue
<Checkbox v-model="terms" name="terms" required>I accept the terms</Checkbox>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `modelValue` | `boolean \| 'indeterminate'` | `false` | `v-model`; `'indeterminate'` shows a dash |
| `size` | `sm \| md \| lg` | `md` | Box and text size |
| `disabled` | `boolean` | `false` | |
| `class` | `string` | none | Applied to the wrapping label |

`id`, `name`, `value`, `required` and `aria-*` attributes go to the
checkbox control, not the wrapper. With a `name`, the checkbox submits
`value` (default `on`) in its form while checked.

## Slots

| Slot | Content |
| --- | --- |
| `default` | The label text; a click on it toggles the box |

## Events

| Event | Payload | When |
| --- | --- | --- |
| `update:modelValue` | `boolean` | On toggle; an indeterminate box becomes `true` |

## Tokens

None of its own. The box uses `border-control`, and `primary` with
`primary-foreground` when checked or indeterminate; corners are
`radius-sm`.

## States

unchecked, checked, indeterminate; hover, focus-visible, disabled
(unchecked and checked); three sizes; label that wraps; no visible label
(`aria-label`).

## Keyboard

| Key | Action |
| --- | --- |
| `Space` | Toggle |

`Enter` does not toggle, as for a native checkbox.

## Accessibility

- Renders `role="checkbox"` with `aria-checked` `true`, `false` or `mixed`.
- The default slot sits inside a `label` around the control, so it names
  the checkbox. Without a slot, pass `aria-label`.
- The check and dash icons are `aria-hidden`.

## Do

```vue
<Checkbox v-model="all" :model-value="some ? 'indeterminate' : all">Select all</Checkbox>
```

## Do not

```vue
<!-- A checkbox that saves on click: use a switch for instant settings. -->
<Checkbox v-model="notifications" @update:model-value="save">Email me</Checkbox>
```
