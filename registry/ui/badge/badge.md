# Badge

A short label for a status or category next to other content: "Paid",
"Draft", "Admin". Use `button` for anything clickable, and `alert` for a
message.

## Usage

```vue
<Badge variant="success">Paid</Badge>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `neutral \| primary \| success \| warning \| danger \| info` | `neutral` | Colour; pair it with text that says the same thing |
| `size` | `sm \| md` | `md` | |
| `class` | `string` | none | Merged last |

## Slots

| Slot | Content |
| --- | --- |
| `default` | The label, one or two words |
| `leading` | An icon before the label |

## Events

None.

## Tokens

None of its own. Each status variant uses its `-subtle` pair
(`success-subtle` behind `success-subtle-foreground`, and so on);
`primary` uses `primary-subtle`, `neutral` uses `muted` behind
`muted-foreground`. Corners are `radius-full`.

## States

every variant at each size; with a leading icon; inside a table cell and
next to a heading.

## Keyboard

None. A badge is not focusable.

## Accessibility

- A badge is plain text; colour alone never carries the meaning, so the
  label says it ("Overdue", not a red dot).
- The leading icon is `aria-hidden`.

## Do

```vue
<Badge variant="warning">
  <template #leading><Icon name="warning" /></template>
  Overdue
</Badge>
```

## Do not

```vue
<!-- Colour as the only signal: the badge has no words. -->
<Badge variant="danger" aria-label="Overdue" />
```
