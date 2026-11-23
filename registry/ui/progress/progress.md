# Progress

A horizontal bar showing completion of a task or an ongoing wait when the
total is unknown. Use `skeleton` for loading content placeholders instead.

## Usage

```vue
<Progress :model-value="65" aria-label="Uploading report" />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `modelValue` | `number \| null` | `null` | Current progress from `0` to `max`. `null` (or omitted) renders an indeterminate bar. Finite values outside `0..max` clamp to that range; `NaN` or non-finite values become indeterminate |
| `max` | `number` | `100` | Maximum value (must be greater than `0`; non-positive or non-finite values fall back to `100`) |
| `size` | `'sm' \| 'md' \| 'lg'` | `md` | Track height: `sm` (`h-1`), `md` (`h-2`), `lg` (`h-3`) |
| `class` | `string` | none | Merged last onto the track |

Other attributes (`aria-label`, `aria-labelledby`, `aria-valuetext`, `id`,
`data-*`) fall through to the `div` with `role="progressbar"`.

## Slots

None.

## Events

None.

## Tokens

None of its own. The track uses `muted` with `radius-full`, the fill uses
`primary`, and transitions use `duration-normal` and `ease`.

## States

determinate (`0%`, partial, `100%`), custom `max`, indeterminate (`null`),
sizes (`sm`, `md`, `lg`), RTL, and reduced motion.

## Keyboard

None. A progress bar is not focusable.

## Accessibility

- Renders `role="progressbar"` with `aria-valuemin="0"` and
  `aria-valuemax` set to `max`.
- Determinate bars set `aria-valuenow` to the clamped value; indeterminate
  bars omit `aria-valuenow` and set `data-state="indeterminate"`.
- Always provide an accessible name via `aria-label` or `aria-labelledby`
  so screen readers know what is progressing. Pass `aria-valuetext` when
  a spoken phrase (such as `"3 of 5 files"`) is clearer than a percentage.
- The indeterminate bar animates only under
  `prefers-reduced-motion: no-preference`, and rests centered in the track
  when reduced motion is enabled.

## Do

```vue
<div class="flex flex-col gap-gap-sm">
  <span id="upload-label" class="text-sm font-medium text-foreground">
    Uploading quarterly report
  </span>
  <Progress :model-value="40" aria-labelledby="upload-label" />
</div>
```

## Do not

```vue
<!-- Missing aria-label or aria-labelledby leaves screen readers with an unnamed progress bar. -->
<Progress :model-value="40" />
```
