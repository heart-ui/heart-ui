# Accordion

A stack of headed sections that each show or hide their content: FAQs,
settings groups, or long details people scan by heading. Use `tabs` when
only one panel shows at a time and every heading fits on one row, and
`dialog` or a page for content people must read in full.

## Usage

```vue
<Accordion>
  <AccordionItem value="billing">
    <AccordionTrigger>When am I billed?</AccordionTrigger>
    <AccordionContent>On the first day of each month, for the seats in use.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="export">
    <AccordionTrigger>Can I export my data?</AccordionTrigger>
    <AccordionContent>Yes, as CSV from Settings, at any time.</AccordionContent>
  </AccordionItem>
</Accordion>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Accordion` | `type` | `single \| multiple` | `single` | `multiple` lets several items stay open |
| `Accordion` | `collapsible` | `boolean` | `true` | `false` keeps one item open in `single` |
| `Accordion` | `disabled` | `boolean` | `false` | Disables every item |
| `Accordion` | `defaultValue` | `string \| string[]` | none | The open item or items at first, without `v-model` |
| `Accordion` | `modelValue` | `string \| string[]` | none | `v-model`: the open item's `value`, or an array with `multiple` |
| `AccordionItem` | `value` | `string` | none | Required; names the item in `v-model` |
| `AccordionItem` | `disabled` | `boolean` | `false` | The item can't open or close |

`Accordion`, `AccordionItem`, `AccordionTrigger` and `AccordionContent`
take `class`, merged last.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `Accordion` | `default` | The items |
| `AccordionItem` | `default` | One trigger and one content |
| `AccordionTrigger` | `default` | The item's heading text |
| `AccordionContent` | `default` | What the item shows when open |

## Events

| Part | Event | Payload | When |
| --- | --- | --- | --- |
| `Accordion` | `update:modelValue` | `string \| string[] \| undefined` | An item opens or closes |

## Tokens

None of its own. Items are divided by `border`; the trigger is `text-sm`
`font-medium` with a chevron that turns when open, and gets the shared
focus ring. Content opens and closes with a height animation over
`duration-normal`, which is 0 ms under reduced motion.

## States

closed; one item open; several open (`multiple`); not collapsible;
an item disabled; the whole accordion disabled; focus-visible; long
content; RTL.

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | Moves focus to the next trigger, or into open content |
| `Enter`, `Space` | Opens or closes the focused item |
| `ArrowDown`, `ArrowUp` | Moves focus to the next or previous trigger |
| `Home`, `End` | Moves focus to the first or last trigger |

## Accessibility

- Each trigger is a `button` inside an `h3`, with `aria-expanded` and
  `aria-controls` pointing at its content.
- Each open content has `role="region"` named by its trigger.
- A disabled item's trigger is `disabled` and stays out of the way of
  arrow keys.
- The heading is `h3`. Put an accordion under an `h2`, or wrap it so
  heading levels don't skip.

## Do

```vue
<Accordion type="multiple" :default-value="['billing']">
  <AccordionItem value="billing">
    <AccordionTrigger>Billing</AccordionTrigger>
    <AccordionContent>Invoices go to the workspace owner.</AccordionContent>
  </AccordionItem>
</Accordion>
```

## Do not

```vue
<!-- Buttons or links inside the trigger: the trigger is already a button. -->
<Accordion>
  <AccordionItem value="billing">
    <AccordionTrigger>Billing <a href="/billing">Open</a></AccordionTrigger>
    <AccordionContent>Invoices go to the workspace owner.</AccordionContent>
  </AccordionItem>
</Accordion>
```
