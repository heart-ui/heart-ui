# Switch

On/off setting that applies at once, like a light switch. Use `checkbox`
when the choice takes effect on submit, or for one item in a list.

## Usage

```vue
<Switch v-model="notifications" @update:model-value="save">Email notifications</Switch>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | `false` | `v-model` |
| `size` | `sm \| md \| lg` | `md` | Track and text size |
| `disabled` | `boolean` | `false` | |
| `name` | `string` | none | Form field name; without it the switch is not part of the form |
| `value` | `string` | `on` | Submitted while on |
| `class` | `string` | none | Applied to the wrapping label |

`id`, `required` and `aria-*` attributes go to the switch control, not the
wrapper.

## Slots

| Slot | Content |
| --- | --- |
| `default` | The setting's name; a click on it toggles the switch |

## Events

| Event | Payload | When |
| --- | --- | --- |
| `update:modelValue` | `boolean` | On toggle |

## Tokens

None of its own. The track uses `border-control` off and `primary` on; the
thumb is `background` off and `primary-foreground` on; corners are
`radius-full`.

## States

off, on; hover, focus-visible, disabled (off and on); three sizes; a label
that wraps; no visible label (`aria-label`).

## Keyboard

| Key | Action |
| --- | --- |
| `Space`, `Enter` | Toggle |

## Accessibility

- Renders `role="switch"` with `aria-checked`.
- The default slot sits inside a `label` around the control, so it names
  the switch. Without a slot, pass `aria-label`.
- Don't put "on" or "off" in the label; the state is announced.
- A disabled switch dims its track; its label text turns
  `muted-foreground`, so it still meets contrast.
- The thumb slides over `--h-duration-fast`, which is 0 ms under reduced
  motion.

## Do

```vue
<Switch v-model="darkMode">Dark mode</Switch>
```

## Do not

```vue
<!-- A switch in a form that saves on submit: use a checkbox. -->
<form @submit="save"><Switch v-model="terms">I accept the terms</Switch></form>
```
