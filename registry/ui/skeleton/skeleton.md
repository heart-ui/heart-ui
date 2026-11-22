# Skeleton

A placeholder shaped like content that is still loading: a line of text,
an avatar, a card. Use `progress` when the wait has a measurable amount,
and a button's `loading` for an action.

## Usage

```vue
<Skeleton class="h-4 w-48" />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `class` | `string` | none | Sets the shape and size, merged last: it has none of its own |

Other attributes fall through to the `div`.

## Slots

None.

## Events

None.

## Tokens

None of its own. It is `muted` with `radius-md` corners; `rounded-full`
in `class` makes a circle.

## States

a text line, a circle, a block; pulsing; still under reduced motion.

## Keyboard

None. A skeleton is not focusable.

## Accessibility

- Always `aria-hidden="true"`: a placeholder has nothing to read.
- Mark the region it fills `aria-busy="true"` while it loads, and give it
  a name, so readers hear once that it is loading instead of once per bar.
- The pulse runs only when the user hasn't asked for reduced motion.

## Do

```vue
<section aria-busy="true" aria-label="Team members">
  <div class="flex items-center gap-gap-sm">
    <Skeleton class="size-control-md rounded-full" />
    <Skeleton class="h-4 w-40" />
  </div>
</section>
```

## Do not

```vue
<!-- No size: the skeleton collapses to nothing; give it the shape it stands in for. -->
<Skeleton />
```
