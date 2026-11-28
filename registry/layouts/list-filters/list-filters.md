# List with filters

A screen of many records of one type: a header, filters directly above
the data, and pagination below it.

## Use when

Users scan, search, and filter many records of one type, such as
customers, orders or an audit log.

## Avoid when

Users read one record at a time beside the list: use `list-detail`. Users
watch several measures at a glance: use `dashboard`.

## Regions

| Region | Belongs here |
| --- | --- |
| `header` | One `page-header`: the title and the page's one primary action |
| `filters` | `filter-bar`, search first; more than four filters collapse into a popover |
| `data` | A `table` (or `data-table`) or a list of cards, each rendering `empty`, `loading`, `error` and `long` |
| `pagination` | `pagination`, past 50 rows; it sits on the trailing side |

## Data

```ts
interface ListFiltersProps {
  /** The data is loading: sets aria-busy on the data region. */
  loading?: boolean
}
```

## States

All four, in the `data` region; the layout keeps the header and filters in
place around them. Pass `pagination` only while there are rows to page.
A search that matches nothing is not `empty`: show a no-results state that
offers to clear the search.

- `empty`: an `empty-state` naming the next action.
- `loading`: skeleton rows shaped like the table, and `loading` set so the
  region is `aria-busy`.
- `error`: an `alert` with a Retry button.
- `long`: every row; the table scrolls inside its own container on a
  narrow window.

## Responsive

- 375 px: the regions stack; filters wrap; the table scrolls sideways
  inside its container, never the page.
- 768 px and 1280 px: the same order; pagination sits at the trailing edge
  of the data.

The header sits `section-gap` above the filters; filters, data and
pagination are `gap-md` apart, so the filters read as part of the data they
filter. The filters region wraps its children in a row and stretches none
of them: a block that should span the row, such as `filter-bar`, sets its
own width. A region with no slot renders nothing. To leave a region out on a
condition, put the `v-if` on its `<template #name>`, not on what is inside:
a slot that renders nothing still makes its region.

## Built from

Layout containers only: the regions take blocks or components. It renders
no landmark; put it in `app-shell`'s `default` slot, which is the page's
`main`.

## Usage

```vue
<ListFilters :loading="pending">
  <template #header>
    <h1 class="text-2xl font-semibold">Customers</h1>
  </template>
  <template #filters>
    <Input v-model="search" type="search" aria-label="Search customers" />
  </template>
  <template #data>
    <Table>
      <TableHeader>
        <TableRow><TableHead>Name</TableHead></TableRow>
      </TableHeader>
    </Table>
  </template>
  <template #pagination>
    <Pagination v-model:page="page" :total="248" :page-size="20" />
  </template>
</ListFilters>
```
