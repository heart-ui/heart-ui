# Textarea

Multi-line text field; choose it for free text longer than one line
(notes, descriptions, messages). Use `input` for a single line.

## Usage

```vue
<Label for="notes">Notes</Label>
<Textarea id="notes" v-model="notes" rows="4" />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `modelValue` | `string` | `''` | `v-model` |
| `size` | `sm \| md \| lg` | `md` | |
| `invalid` | `boolean` | `false` | Sets `aria-invalid` and the danger border |
| `autoresize` | `boolean` | `false` | Grows with its content; cap it with a `max-h-*` class |
| `disabled` | `boolean` | `false` | |
| `class` | `string` | none | Merged last |

Native attributes (`rows`, `placeholder`, `readonly`, `maxlength`,
`required`, `name`, `id`) fall through to the `textarea`.

Without `autoresize`, `rows` sets the height and the reader can drag it
taller. With `autoresize`, the field starts one control height tall and
grows line by line, where the browser supports `field-sizing`; elsewhere it
keeps a fixed height and scrolls.

## Slots

None.

## Events

| Event | Payload | When |
| --- | --- | --- |
| `update:modelValue` | `string` | On input |

Native `focus`, `blur`, and `keydown` pass through.

## Tokens

| Token | Falls back to | Controls |
| --- | --- | --- |
| `--h-input-radius` | `--h-radius-md` | Corner radius, shared with `input` so fields match |

## States

default, hover, focus-visible, filled, placeholder, disabled, readonly,
invalid; three sizes; autoresize empty and after several lines.

## Keyboard

Native textarea behavior: `Enter` adds a line. No custom keys.

## Accessibility

- The component renders no label. Pair it with `label` by `id`, or let
  `form` wire it.
- Placeholder text uses `subtle-foreground` and never replaces a label.
- `invalid` sets `aria-invalid="true"`; describe the error with
  `aria-describedby`.

## Do

```vue
<Label for="message">Message</Label>
<Textarea id="message" v-model="message" autoresize class="max-h-60" />
```

## Do not

```vue
<!-- Enter submits a form here only by your own handler; never for a
     textarea that users expect to break lines. -->
<Textarea v-model="message" @keydown.enter.prevent="send" />
```
