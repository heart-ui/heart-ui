# Pagination

Moves through a long list one page at a time, with previous and next
buttons and the page numbers around the current one. Use it under a table
or result list; use `tabs` to switch between views of the same content.

## Usage

```vue
<Pagination v-model:page="page" :total="248" :page-size="20" />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `total` | `number` | none | How many items the list holds; required. `0` or a value that isn't a number shows one page |
| `pageSize` | `number` | `10` | Items per page |
| `page` | `number` | `1` | The current page, from `1`; `v-model:page`. A page outside `1` to the last page (say `total` shrinks after a filter) is shown as the nearest end, without emitting; the next press steps from there. A fraction rounds; `NaN` shows page `1` |
| `navLabel` | `string` | `Pagination` | The landmark's accessible name |
| `previousLabel` | `string` | `Previous page` | The previous button's accessible name |
| `nextLabel` | `string` | `Next page` | The next button's accessible name |
| `pageLabel` | `string` | `Page {page}` | Each page button's accessible name; every `{page}` becomes its number |

The root takes `class`, merged last, and other attributes, on the `nav`.

## Slots

None.

## Events

| Event | Payload | When |
| --- | --- | --- |
| `update:page` | `number` | A page, previous or next button changes the page |

## Tokens

None of its own. Buttons use the `button` variants at `md` height: the
current page is `outline`, the others `ghost`. Previous and next show a
chevron. Buttons wrap onto a second line when the row is too wide.

## States

first page (previous unavailable); a middle page with gaps on both sides;
last page (next unavailable); one page; hover; focus-visible; custom
labels; 375 px; RTL.

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | Moves through previous, each page and next |
| `Enter` / `Space` | On a page button, goes to that page; on previous or next, steps one page, and does nothing at an end |

## Accessibility

- The root is a `nav` landmark named by `navLabel`, holding a list.
- The current page's button has `aria-current="page"`.
- The first page's previous button and the last page's next button are
  `aria-disabled` and do nothing, but keep focus, so reaching an end
  doesn't drop focus to the page.
- Gaps (`…`) are hidden from screen readers.
- The chevrons point the reading way: previous points right in RTL. They
  read the direction from Reka's `ConfigProvider`, so an RTL app sets
  `<ConfigProvider dir="rtl">`.
- Between previous and next the row holds up to seven slots: the first
  and last page, the current page with one page either side, and gaps
  (`…`) between. Near an end the gap fills with pages, so page 1 of 20
  shows `1 2 3 4 5 … 20`.

## Do

```vue
<Pagination
  v-model:page="page"
  :total="results.length"
  :page-size="25"
  nav-label="Search results pages"
/>
```

## Do not

```vue
<!-- Two pagination landmarks with the same name: screen reader users can't tell them apart. -->
<Pagination v-model:page="page" :total="248" />
<Pagination v-model:page="page" :total="248" />
```
