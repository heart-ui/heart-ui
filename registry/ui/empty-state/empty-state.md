# Empty State

What a region shows when it has nothing to list yet: a title that says
so, a line on what fills it, and the action that does. Use `skeleton`
while the content loads, and `alert` for a problem.

## Usage

```vue
<EmptyState title="No invoices yet" description="Invoices you send show up here.">
  <template #actions>
    <Button variant="primary">Create invoice</Button>
  </template>
</EmptyState>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string` | none | Required. What is missing, in a few words |
| `description` | `string` | none | Why it is empty or what fills it; left out when not set |
| `class` | `string` | none | Merged last |

Other attributes fall through to the root `div`.

## Slots

| Slot | Content |
| --- | --- |
| `icon` | One `Icon`, shown above the title in a muted circle; nothing focusable, since the circle is hidden from screen readers |
| `actions` | The `Button`s that fill the region, primary first |

A slot that renders nothing (a `v-if` that is off, blank text) leaves no
space. A child component that renders nothing still counts as content, so
put the `v-if` on the element in the slot.

## Events

None.

## Tokens

None of its own. The title is `foreground`, the description
`muted-foreground`, the icon circle `muted`. The text is capped at
`content-narrow`.

## States

title and description; with an icon; with one or two actions; a long
description that wraps; a long unbroken word, which breaks to fit.

## Keyboard

None of its own. The actions take focus as usual.

## Accessibility

- The title is a `div`, not a heading, so it never breaks the page
  outline; wrap it in a heading through the page if the region needs one.
- The icon is decorative and hidden from screen readers; the title says
  it in words.
- It has no live role: it shows when the page loads, not as news.

## Do

```vue
<EmptyState title="No matches for “acme”" description="Check the spelling or clear the filters.">
  <template #icon>
    <Icon name="search" />
  </template>
  <template #actions>
    <Button variant="outline">Clear filters</Button>
  </template>
</EmptyState>
```

## Do not

```vue
<!-- No next step: say what fills the region and offer the action. -->
<EmptyState title="Empty" />
```
