# Input

Single-line text field; choose it for short free text. Use `textarea` for
multi-line text, `number-input` for numbers with steppers, and `combobox`
for a filterable list.

## Usage

```vue
<Label for="email">Email</Label>
<Input id="email" v-model="email" type="email" />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `modelValue` | `string` | `''` | `v-model` |
| `size` | `sm \| md \| lg` | `md` | |
| `invalid` | `boolean` | `false` | Sets `aria-invalid` and the danger border |
| `disabled` | `boolean` | `false` | |
| `class` | `string` | none | Applied to the wrapper |

Native attributes (`type`, `placeholder`, `readonly`, `autocomplete`,
`required`, `id`) fall through to the `input` element, not the wrapper.

## Slots

| Slot | Content |
| --- | --- |
| `leading` | Icon or text before the value |
| `trailing` | Icon, text, or a small button after the value |

## Events

| Event | Payload | When |
| --- | --- | --- |
| `update:modelValue` | `string` | On input |

Native `focus`, `blur`, and `keydown` pass through from the `input`.

## Tokens

| Token | Falls back to | Controls |
| --- | --- | --- |
| `--tre-input-radius` | `--tre-radius-md` | Corner radius |

## States

default, hover, focus-visible, filled, placeholder, disabled, readonly,
invalid; three sizes; with leading slot, trailing slot, and both.

## Keyboard

Native text input behavior. No custom keys.

## Accessibility

- The component renders no label. Pair it with `label` by `id`, or let
  `form` wire it.
- The focus ring is drawn on the wrapper when the inner `input` has focus.
- Placeholder text uses `subtle-foreground` and never replaces a label.
- Clicking a non-interactive slot focuses the `input`.

## Do

```vue
<Input v-model="query" type="search" placeholder="Search customers">
  <template #leading><Icon name="search" /></template>
</Input>
```

## Do not

```vue
<!-- Placeholder used as the only label: it disappears on input. -->
<Input v-model="email" placeholder="Email" />
```
