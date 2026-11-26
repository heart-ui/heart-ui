# Breadcrumb

The trail of pages above the current one, so people see where they are
and can step back up. Use it on pages two or more levels deep; use
`tabs` to switch between views of the same page.

## Usage

```vue
<Breadcrumb>
  <BreadcrumbItem>
    <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
  </BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem>
    <BreadcrumbPage>Website redesign</BreadcrumbPage>
  </BreadcrumbItem>
</Breadcrumb>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Breadcrumb` | `navLabel` | `string` | `Breadcrumb` | The landmark's accessible name |
| `BreadcrumbLink` | `asChild` | `boolean` | `false` | Merge onto the child, such as a `RouterLink` |
| `BreadcrumbLink` | `as` | `string \| Component` | `a` | Element to render |

Every part takes `class`, merged last. `BreadcrumbLink` passes `href`
and other attributes to the link.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `Breadcrumb` | `default` | Items and separators, in order |
| `BreadcrumbItem` | `default` | One link or the page |
| `BreadcrumbLink` | `default` | The ancestor page's name |
| `BreadcrumbPage` | `default` | The current page's name |
| `BreadcrumbSeparator` | `default` | A custom separator; a chevron by default |

## Events

None.

## Tokens

None of its own. The trail is `text-sm` `muted-foreground`; links turn
`foreground` on hover and get the shared focus ring; the current page is
`foreground`. Items wrap onto more lines when the trail is long.

## States

links and the current page; hover; focus-visible; a custom separator;
a link through `asChild`; a long trail that wraps at 375 px; RTL.

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | Moves through the links; the current page and separators are skipped |
| `Enter` | Follows the focused link |

## Accessibility

- The root is a `nav` landmark named by `navLabel`, holding an ordered
  list.
- The current page has `aria-current="page"` and isn't a link.
- Separators are hidden from screen readers (`aria-hidden`,
  `role="presentation"`). The default chevron points the reading way:
  left in RTL, through Reka's `ConfigProvider` `dir`.

## Do

```vue
<Breadcrumb>
  <BreadcrumbItem>
    <BreadcrumbLink as-child><RouterLink to="/settings">Settings</RouterLink></BreadcrumbLink>
  </BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem>
    <BreadcrumbPage>Members</BreadcrumbPage>
  </BreadcrumbItem>
</Breadcrumb>
```

## Do not

```vue
<!-- The current page as a link: it has nowhere to go, and screen readers lose aria-current. -->
<Breadcrumb>
  <BreadcrumbItem>
    <BreadcrumbLink href="/settings/members">Members</BreadcrumbLink>
  </BreadcrumbItem>
</Breadcrumb>
```
