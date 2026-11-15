# Card

A bordered surface that groups one subject's content: a summary, a
settings section, an item in a grid. Use a plain section when the content
needs no frame, and `dialog` for content that needs a decision.

## Usage

```vue
<Card>
  <CardHeader>
    <CardTitle>Monthly revenue</CardTitle>
    <CardDescription>All workspaces, in euros.</CardDescription>
  </CardHeader>
  <CardContent>€48,210</CardContent>
  <CardFooter><Button variant="outline">Open report</Button></CardFooter>
</Card>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Card` | `variant` | `default \| outline` | `default` | `default` is a raised surface with a shadow; `outline` a border only |
| `Card` | `as` | `string` | `div` | Element to render, such as `section` or `article` |
| `CardTitle` | `as` | `string` | `h3` | Heading level that fits the page outline |

Every part takes `class`, merged last, and renders a `div` unless noted.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `Card` | `default` | The header, content and footer |
| `CardHeader` | `default` | The title and description |
| `CardTitle` | `default` | The card's heading |
| `CardDescription` | `default` | One or two lines under the title |
| `CardContent` | `default` | The body |
| `CardFooter` | `default` | Actions, the primary one last |

## Events

None.

## Tokens

| Token | Falls back to | Controls |
| --- | --- | --- |
| `--h-card-radius` | `--h-radius-lg` | Corner radius |

`default` is `surface-raised` with `shadow-sm` and a `border`; `outline` is
`surface` with a `border`. Padding is `gap-lg`-based on every part.

## States

default, outline; with and without header, description and footer; a
card used as a `section` with a heading level set.

## Keyboard

None. A card is not focusable; the controls inside it are.

## Accessibility

- `CardTitle` renders an `h3` by default; set `as` to keep the page's
  heading outline in order.
- Render the card `as="section"` or `as="article"` when it is a landmark
  or a self-contained item, and name it by its title
  (`aria-labelledby`).

## Do

```vue
<Card as="article" aria-labelledby="invoice-1042">
  <CardHeader><CardTitle id="invoice-1042">Invoice 1042</CardTitle></CardHeader>
  <CardContent>Due 30 Nov</CardContent>
</Card>
```

## Do not

```vue
<!-- A whole card as a click target: put a link or button inside it instead. -->
<Card @click="open(invoice)">…</Card>
```
