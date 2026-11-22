# Alert

A message that stays in the page: a problem with a form, a warning about
an account, a note about what a page shows. Use `toast` for news about
something that just happened, which closes on its own.

## Usage

```vue
<Alert variant="warning">
  <AlertTitle>Your trial ends in 3 days</AlertTitle>
  <AlertDescription>Add a payment method to keep your projects.</AlertDescription>
</Alert>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Alert` | `variant` | `info \| success \| warning \| danger` | `info` | The colour, icon and role; say the outcome in the title too |

Every part takes `class`, merged last. Other attributes fall through to
the part's `div`. The icon is sized for the default `text-sm`.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `Alert` | `default` | `AlertTitle`, then `AlertDescription` |
| `AlertTitle` | `default` | A short summary |
| `AlertDescription` | `default` | The detail and what to do; text, a list or a link |

## Events

None.

## Tokens

None of their own. Each variant is its `-subtle` background and text
pair, with a border in the status colour.

## States

each variant; title only; title and description; a long description
that wraps.

## Keyboard

None of its own. Links inside it take focus as usual.

## Accessibility

- `danger` has `role="alert"`, so screen readers interrupt to announce it;
  the others have `role="status"`, read politely.
- A live region reads content that changes inside it. Render the alert
  when the problem appears, or keep it mounted and change its text, so it
  is announced.
- The icon is decorative; the title says what the alert is about in
  words.

## Do

```vue
<Alert variant="danger">
  <AlertTitle>Payment failed</AlertTitle>
  <AlertDescription>The card was declined. Try another card.</AlertDescription>
</Alert>
```

## Do not

```vue
<!-- Colour alone, with no role: readers don't hear it, and it reads as plain text. -->
<div class="rounded-md bg-danger-subtle p-4 text-danger-subtle-foreground">Payment failed</div>
```
