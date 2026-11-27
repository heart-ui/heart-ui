# Table

Rows of records compared across the same columns: invoices, members, log
lines. Use `data-table` when people sort, select or page the rows, and a
list or `card` grid when each record is read on its own.

## Usage

```vue
<Table>
  <TableCaption>Open invoices</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Customer</TableHead>
      <TableHead class="text-end">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableHead scope="row">1042</TableHead>
      <TableCell>Northwind</TableCell>
      <TableCell class="text-end tabular-nums">€1,200.00</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Table` | `size` | `sm \| md \| lg` | `md` | Row density: each row is at least the control height of its size |
| `TableHead` | `scope` | `col \| row \| colgroup \| rowgroup` | none | `row` makes the cell a row header, such as a record's id in the first column |

Every part takes `class`, merged last. `Table` renders a scroll container
`div` around the `table` and puts `class` and other attributes on that
`div`, so a height set there scrolls the rows inside it. Each other part
renders its element: `TableHeader` a `thead`, `TableBody` a `tbody`,
`TableRow` a `tr`, `TableHead` a `th`, `TableCell` a `td` and
`TableCaption` a `caption`.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `Table` | `default` | The caption, header and body |
| `TableHeader` | `default` | The row of column headers |
| `TableBody` | `default` | The rows |
| `TableRow` | `default` | Its cells |
| `TableHead` | `default` | The column's or row's name |
| `TableCell` | `default` | The value |
| `TableCaption` | `default` | The table's name |

## Events

None.

## Tokens

None of its own. The header sits on `surface-sunken` with a `border` under
it, rows are divided by `border`, and header text is `muted-foreground`.
Cells are at least `h-control-<size>` tall and padded by
`control-px-<size>`, so the density knob changes row height too.

## States

`sm`, `md` and `lg`; with and without a caption; row headers; a table that
fits its container, and a table wider than it (at 375 px), which scrolls
inside the container and becomes focusable.

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | Focuses the scroll container, only while the table is wider or taller than it |
| Arrow keys | Scroll the focused container |

The table itself is not focusable; the controls in its cells are.

## Accessibility

- Name every table with `TableCaption`. The caption reads first; give it
  `class="sr-only"` when a heading above the table already names it.
- Header cells in `TableHeader` are column headers. Mark the cell that
  names a row with `TableHead scope="row"`.
- While the table overflows its container, the container gets
  `tabindex="0"` so keyboard users can scroll it, and becomes a region
  named by the caption.
- Align numbers to the end with `class="text-end tabular-nums"` on their
  head and cells; `text-start` and `text-end` follow the reading direction.

## Do

```vue
<Table size="sm">
  <TableCaption class="sr-only">Team members</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableHead scope="row">Ana Lima</TableHead>
      <TableCell>Owner</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Do not

```vue
<!-- A table to lay out a form or a card grid: screen readers announce rows and columns. -->
<Table>
  <TableBody>
    <TableRow>
      <TableCell><Label for="email">Email</Label></TableCell>
      <TableCell><Input id="email" /></TableCell>
    </TableRow>
  </TableBody>
</Table>
```
