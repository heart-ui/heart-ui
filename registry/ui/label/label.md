# Label

Visible name for one form control, tied to it by `for`. Use `form` when
the field also needs a description or an error message; it renders this
label for you.

## Usage

```vue
<Label for="email" required>Email</Label>
<Input id="email" v-model="email" type="email" required />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `for` | `string` | none | `id` of the control it names |
| `required` | `boolean` | `false` | Shows the required marker |
| `requiredLabel` | `string` | `required` | Read by screen readers in place of the marker |
| `class` | `string` | none | Merged last |

Other attributes fall through to the `label` element.

## Slots

| Slot | Content |
| --- | --- |
| `default` | The control's name |

## Events

None. Native `click` passes through; a click focuses or toggles the
control named by `for`.

## Tokens

None of its own. Text is `foreground`; the marker is `muted-foreground`.

## States

default, required (with the default and a custom `requiredLabel`), long
text that wraps; next to an enabled and a disabled control.

## Keyboard

None. A label is not focusable; the control it names takes focus.

## Accessibility

- Renders a native `label`, so the control's accessible name is the label
  text, and a click on it focuses the control.
- The required marker is `aria-hidden`. Screen readers hear
  `requiredLabel` instead ("Email required"). Still set `required` on the
  control itself so the browser and assistive tech know it is required.
- A double click doesn't select the label text (Reka Label).

## Do

```vue
<Label for="name" required>Full name</Label>
<Input id="name" v-model="name" required />
```

## Do not

```vue
<!-- A label with no `for` and no control inside names nothing. -->
<Label>Full name</Label>
<Input v-model="name" />
```
