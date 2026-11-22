# Avatar

A person's picture in a circle, with their initials while it loads or
when it fails. Use `badge` for a status and an icon for a thing that is
not a person.

## Usage

```vue
<Avatar>
  <AvatarImage :src="user.avatarUrl" :alt="user.name" />
  <AvatarFallback>{{ user.initials }}</AvatarFallback>
</Avatar>
```

## Props

| Part | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Avatar` | `size` | `sm \| md \| lg` | `md` | Width and height match the control height of the same size; sets the initials' text size |
| `AvatarImage` | `src` | `string` | none | Required. The image shows once it has loaded |
| `AvatarImage` | `alt` | `string` | none | Required. The person's name, or `''` when their name is next to the avatar |
| `AvatarFallback` | `delayMs` | `number` | none | Waits this long before showing, so a fast load shows no flash of initials; `0` shows it at once |

Every part takes `class`, merged last. Other attributes fall through to
the part's element: a `span` for `Avatar` and `AvatarFallback`, an `img`
for `AvatarImage`.

## Slots

| Part | Slot | Content |
| --- | --- | --- |
| `Avatar` | `default` | `AvatarImage` and `AvatarFallback` |
| `AvatarFallback` | `default` | Initials, one or two letters |

## Events

None.

## Tokens

None of its own. The size is `control-sm`, `control-md` or
`control-lg`; the fallback is `muted` with `muted-foreground` text.

## States

each size; image loaded; image broken, fallback shown; no image,
fallback only; image removed after loading, fallback back; fallback
delayed; beside a name, hidden from screen readers.

## Keyboard

None. An avatar is not focusable; wrap it in a link or button to act on
it.

## Accessibility

- The image has `role="img"` and its `alt` as its name. With an empty
  (or blank) `alt` it has `role="presentation"`.
- While a named image isn't shown, the fallback reads the image's `alt`
  instead of the initials, which it hides from screen readers. With no
  `AvatarImage` the fallback's initials are read as they are, so an
  avatar without an image belongs beside the person's name, with
  `aria-hidden="true"`.
- Put `AvatarImage` before `AvatarFallback`, so the name is known when
  the fallback first renders.
- Next to the person's name, set `alt=""` and `aria-hidden="true"` on
  `Avatar`, so readers hear the name once.

## Do

```vue
<div class="flex items-center gap-gap-sm">
  <Avatar aria-hidden="true">
    <AvatarImage :src="user.avatarUrl" alt="" />
    <AvatarFallback>{{ user.initials }}</AvatarFallback>
  </Avatar>
  <span>{{ user.name }}</span>
</div>
```

## Do not

```vue
<!-- The name beside it is read twice, and the initials too when the image fails. -->
<div class="flex items-center gap-gap-sm">
  <Avatar>
    <AvatarImage :src="user.avatarUrl" :alt="user.name" />
    <AvatarFallback>{{ user.initials }}</AvatarFallback>
  </Avatar>
  <span>{{ user.name }}</span>
</div>
```
