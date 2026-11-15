# Tabs

Switch between views of the same subject in place: a project's overview,
activity and settings. Use page navigation for separate pages, and
`radio-group` to set a value.

## Usage

```vue
<Tabs v-model="tab">
  <TabsList aria-label="Project">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
  <TabsContent value="activity">…</TabsContent>
</Tabs>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Tabs` | `modelValue` | `string` | none | `v-model`; the active tab's `value` |
| `Tabs` | `defaultValue` | `string` | none | The tab active at first, without `v-model` |
| `Tabs` | `variant` | `line \| pill` | `line` | Applies to the list and every trigger |
| `Tabs` | `orientation` | `horizontal \| vertical` | `horizontal` | Layout and arrow keys |
| `Tabs` | `dir` | `ltr \| rtl` | none | Layout and arrow keys together; by default both follow the page |
| `TabsTrigger` | `value` | `string` | none | Required |
| `TabsTrigger` | `disabled` | `boolean` | `false` | |
| `TabsContent` | `value` | `string` | none | Required; the trigger it belongs to |

Every part takes `class`, merged last. Name the list with `aria-label` (or
`aria-labelledby`).

Tabs follow the page's direction, in layout and arrow keys; `dir` sets
another for one tab set. Vertical tabs stack above
their panels below the `sm` breakpoint, and line tabs that wrap keep their
rule on every row.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `Tabs` | `default` | The list and the panels |
| `TabsList` | `default` | The triggers |
| `TabsTrigger` | `default` | The tab's name |
| `TabsContent` | `default` | The panel |

## Events

| Part | Event | Payload | When |
| --- | --- | --- | --- |
| `Tabs` | `update:modelValue` | `string` | Another tab becomes active |

## Tokens

None of their own. `line` underlines the active tab in `primary` on a
`border` rule; `pill` sets it as a `background` chip on a `muted` track.

## States

each variant, horizontal and vertical; active, inactive, hover,
focus-visible, disabled trigger; many tabs that wrap.

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | Into the list on the active tab, then into the active panel |
| `ArrowRight`, `ArrowLeft` | Next, previous tab (horizontal), wrapping; activates it |
| `ArrowDown`, `ArrowUp` | Next, previous tab (vertical), wrapping; activates it |
| `Home`, `End` | First, last tab |

## Accessibility

- `TabsList` is `role="tablist"` with `aria-orientation`; triggers are
  `role="tab"` with `aria-selected` and `aria-controls`; panels are
  `role="tabpanel"`, labelled by their trigger.
- A panel without focusable content takes focus itself (`tabindex="0"`),
  so keyboard users reach it.

## Do

```vue
<TabsList aria-label="Invoice">
  <TabsTrigger value="details">Details</TabsTrigger>
  <TabsTrigger value="history">History</TabsTrigger>
</TabsList>
```

## Do not

```vue
<!-- Tabs as site navigation: use links, so each page has its own URL. -->
<TabsTrigger value="/billing" @click="router.push('/billing')">Billing</TabsTrigger>
```
