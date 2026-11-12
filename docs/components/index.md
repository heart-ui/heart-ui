# Component index

45 components. Every component follows
[conventions.md](../conventions.md#component-api-rules); this table lists
only what is specific to each. `size` means `sm | md | lg`. "Parts" are
separate `.vue` files prefixed with the component name.

Confirm each Reka UI primitive's current API in its docs before building.

## Tier 1 (Phases 0 and 1)

| Name | Built on | Parts | Variants and specifics |
| --- | --- | --- | --- |
| `button` | Reka `Primitive` | none | `variant`: primary, secondary, outline, ghost, danger, link. `size`. `loading` shows a spinner, sets `aria-busy`, blocks clicks. Slots `leading`, `trailing`. |
| `input` | Native `input` | none | `size`, `invalid`. Slots `leading`, `trailing`. Passes `type` and native attributes through. |
| `textarea` | Native `textarea` | none | `size`, `invalid`, `autoresize`. |
| `label` | Reka Label | none | `required` shows a marker with visually hidden text. |
| `checkbox` | Reka Checkbox | none | `size`. Supports indeterminate. Default slot is the label. |
| `radio-group` | Reka RadioGroup | Item | `size`, `orientation`. |
| `switch` | Reka Switch | none | `size`. Default slot is the label. |
| `select` | Reka Select | Trigger, Content, Item, Group, Label, Separator | `size`, `invalid`, `placeholder`. |
| `dialog` | Reka Dialog | Trigger, Content, Header, Title, Description, Footer, Close | Content `size` sets width. Title is required for an accessible name. |
| `dropdown-menu` | Reka DropdownMenu | Trigger, Content, Item, CheckboxItem, RadioGroup, RadioItem, Label, Separator, Sub, SubTrigger, SubContent | Item `variant`: default, danger. Item slots `leading`, `trailing`. |
| `tooltip` | Reka Tooltip | Trigger, Content, Provider | Provider mounts once at the app root. |
| `tabs` | Reka Tabs | List, Trigger, Content | `variant`: line, pill. `orientation`. |
| `card` | None | Header, Title, Description, Content, Footer | `variant`: default, outline. |
| `badge` | None | none | `variant`: neutral, primary, success, warning, danger, info. `size`: sm, md. |
| `toast` | Reka Toast | Toaster, `useToast()` | `variant`: neutral, success, warning, danger, info. Imperative API: `toast({ title, description, action })`. |

## Tier 2 (Phase 2)

| Name | Built on | Parts | Variants and specifics |
| --- | --- | --- | --- |
| `popover` | Reka Popover | Trigger, Content, Close | Content `side`, `align`. |
| `combobox` | Reka Combobox | Input, Content, Item, Group, Empty | `size`, `invalid`. Client filtering by default; `filter` prop disables it for async lists. |
| `form` | Decided in task P2-01 | Field, Label, Description, Message | Validation through any Standard Schema library. Wires `invalid`, ids, and `aria-describedby` to the control. |
| `table` | Native `table` | Header, Body, Row, Head, Cell, Caption | `size` sets row density. Scrolls inside its own container. |
| `pagination` | Reka Pagination | none | `total`, `pageSize`, `v-model:page`. |
| `avatar` | Reka Avatar | Image, Fallback | `size`. |
| `alert` | None | Title, Description | `variant`: info, success, warning, danger. Role `alert` for danger, `status` otherwise. |
| `skeleton` | None | none | Shape set by `class`. Respects reduced motion. |
| `breadcrumb` | None | Item, Link, Separator, Page | Renders a `nav` with an ordered list. |
| `sidebar` | Reka Collapsible | Header, Content, Group, Item, Footer, Trigger | `v-model:collapsed`. Becomes a drawer below 768 px. |
| `empty-state` | None | none | `title`, `description`. Slots `icon`, `actions`. |
| `drawer` | Reka Dialog | Trigger, Content, Header, Title, Description, Footer, Close | `side`: start, end, bottom. Content `size`. |
| `accordion` | Reka Accordion | Item, Trigger, Content | `type`: single, multiple. |
| `separator` | Reka Separator | none | `orientation`. |
| `progress` | Reka Progress | none | `size`. Indeterminate when the value is null. |

## Tier 3 (Phase 3)

| Name | Built on | Parts | Variants and specifics |
| --- | --- | --- | --- |
| `data-table` | `@tanstack/vue-table` and `table` | Toolbar, ColumnHeader, Pagination, ViewOptions | Sorting, row selection, column visibility, pagination. `manual` prop for server-side data. |
| `calendar` | Reka Calendar | none | Single date. Locale from Reka's config provider. |
| `date-picker` | Reka DatePicker, `popover`, `calendar` | none | `size`, `invalid`. |
| `date-range-picker` | Reka DateRangePicker | none | `size`, `invalid`. Optional `presets`. |
| `command` | Reka Listbox | Input, List, Item, Group, Empty, Dialog | Dialog part opens the palette in a `dialog`. |
| `number-input` | Reka NumberField | none | `size`, `invalid`, `min`, `max`, `step`, `formatOptions`. |
| `tags-input` | Reka TagsInput | none | `size`, `invalid`. |
| `slider` | Reka Slider | none | Single value or range. |
| `file-upload` | Native `input` | List, Item | Drag and drop. `accept`, `multiple`, `maxSize`. Emits `reject` with a reason. |
| `stepper` | Reka Stepper | Item, Trigger, Title, Description | `orientation`. |
| `context-menu` | Reka ContextMenu | Same parts as `dropdown-menu` | Shares item styles with `dropdown-menu`. |
| `scroll-area` | Reka ScrollArea | none | `orientation`. |
| `tree` | Reka Tree | Item | Single or multiple selection. |
| `navigation-menu` | Reka NavigationMenu | List, Item, Trigger, Content, Link | Horizontal top navigation. |
| `chart` | `@unovis/vue` | Container, Tooltip, Legend, Line, Bar, Area, Donut | Colors from `chart-1` to `chart-6`. Engine adapters live in separate packages. |
