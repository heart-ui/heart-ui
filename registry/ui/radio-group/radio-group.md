# Radio Group

Exactly one choice from a short list of options that are all worth
seeing at once (up to about five). Use `select` for a longer list, and
`checkbox` when several options can be chosen.

## Usage

```vue
<RadioGroup v-model="plan" name="plan" aria-label="Plan">
  <RadioGroupItem value="free">Free</RadioGroupItem>
  <RadioGroupItem value="team">Team</RadioGroupItem>
</RadioGroup>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `RadioGroup` | `modelValue` | `string` | none | `v-model`; the chosen item's `value` |
| `RadioGroup` | `size` | `sm \| md \| lg` | `md` | Applies to every item |
| `RadioGroup` | `orientation` | `vertical \| horizontal` | `vertical` | Layout only; all four arrow keys move either way |
| `RadioGroup` | `disabled` | `boolean` | `false` | Disables every item |
| `RadioGroup` | `name` | `string` | none | Form field name; submits the chosen `value` |
| `RadioGroup` | `required` | `boolean` | `false` | Blocks submit until one is chosen; needs `name` |
| `RadioGroupItem` | `value` | `string` | none | Required |
| `RadioGroupItem` | `disabled` | `boolean` | `false` | |

Every part takes `class`, merged last: on `RadioGroup` the group element,
on `RadioGroupItem` the label that wraps the radio and its text. Other
attributes on `RadioGroupItem` (`id`, `aria-*`) go to the radio itself.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `RadioGroup` | `default` | The items |
| `RadioGroupItem` | `default` | The option's label; a click on it selects the item |

## Events

| Part | Event | Payload | When |
| --- | --- | --- | --- |
| `RadioGroup` | `update:modelValue` | `string` | An item is chosen |

## Tokens

None of their own. The radio uses `border-control`, and `primary` with a
`primary-foreground` dot when chosen.

## States

none chosen, one chosen; hover, focus-visible; a disabled item and a
disabled group; three sizes; vertical and horizontal; a label that wraps.

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | Into the group, on the chosen item (or the first); out of the group |
| `ArrowDown`, `ArrowRight` | Choose the next item, wrapping at the end |
| `ArrowUp`, `ArrowLeft` | Choose the previous item |
| `Space` | Choose the focused item |

## Accessibility

- `RadioGroup` renders `role="radiogroup"`; name it with `aria-label` or
  `aria-labelledby` (a `fieldset` legend nearby doesn't name it).
- Each item renders `role="radio"` with `aria-checked`, named by its slot.
- A disabled item's label text turns `muted-foreground`, not translucent,
  so it still meets contrast.

## Do

```vue
<RadioGroup v-model="billing" orientation="horizontal" aria-label="Billing">
  <RadioGroupItem value="monthly">Monthly</RadioGroupItem>
  <RadioGroupItem value="yearly">Yearly</RadioGroupItem>
</RadioGroup>
```

## Do not

```vue
<!-- Twelve options: use a select. -->
<RadioGroup v-model="month" aria-label="Month">
  <RadioGroupItem v-for="m in months" :key="m" :value="m">{{ m }}</RadioGroupItem>
</RadioGroup>
```
