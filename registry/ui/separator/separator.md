# Separator

A thin rule between groups of content, across a stack or between items
in a row. Use `dropdown-menu` or `select`'s own separator inside those
menus.

## Usage

```vue
<Separator />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | A horizontal rule spans the width; a vertical one stretches to the row's height |
| `decorative` | `boolean` | `true` | Hidden from screen readers (`role="none"`). Set `false` when the rule separates content groups readers should hear apart |
| `class` | `string` | none | Merged last |

Other attributes fall through to the `div`.

## Slots

None.

## Events

None.

## Tokens

None of its own. The rule is `border`, one pixel thick.

## States

horizontal and vertical; decorative and semantic; between stacked
sections and between items in a row.

## Keyboard

None. A separator is not focusable.

## Accessibility

- Decorative by default: `role="none"`, so screen readers skip it.
- With `decorative` off it has `role="separator"`, and a vertical one
  also has `aria-orientation="vertical"` (horizontal is the role's
  default).
- It carries no text. Headings or labels name the groups it separates.

## Do

```vue
<div class="flex items-center gap-gap-sm">
  <a href="/docs">Docs</a>
  <Separator orientation="vertical" />
  <a href="/blog">Blog</a>
</div>
```

## Do not

```vue
<!-- A rule made from a border class skips the token and the orientation. -->
<div class="border-t border-border" />
```
