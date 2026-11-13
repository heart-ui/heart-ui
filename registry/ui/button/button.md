# Button

Triggers an action; choose it over a link when the result happens on this
page. Use `as="a"` or `asChild` with a router link for navigation that
should look like a button.

## Usage

```vue
<Button variant="primary" @click="save">Save</Button>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `primary \| secondary \| outline \| ghost \| danger \| link` | `secondary` | |
| `size` | `sm \| md \| lg` | `md` | Height from `control-*` |
| `disabled` | `boolean` | `false` | |
| `loading` | `boolean` | `false` | Spinner replaces the `leading` slot; clicks are blocked |
| `type` | `button \| submit \| reset` | `button` | Ignored when not rendering a `button` |
| `as` | `string \| Component` | `button` | |
| `asChild` | `boolean` | `false` | Merge onto the child element |
| `class` | `string` | none | Merged last |

## Slots

| Slot | Content |
| --- | --- |
| `default` | Label |
| `leading` | Icon before the label |
| `trailing` | Icon after the label |

An icon-only button puts the icon in `default` and must set `aria-label`.

## Events

| Event | Payload | When |
| --- | --- | --- |
| — | — | None of its own; native events such as `click` pass through. |

## Tokens

| Token | Falls back to | Controls |
| --- | --- | --- |
| `--tre-button-radius` | `--tre-radius-md` | Corner radius |

## States

default, hover, focus-visible, active, disabled, loading; each for all six
variants and three sizes. Icon-only. With leading and trailing icons.

## Keyboard

| Key | Action |
| --- | --- |
| `Enter`, `Space` | Activate |

## Accessibility

- `loading` sets `aria-busy="true"` and `aria-disabled="true"`, and keeps
  the button focusable.
- `disabled` uses the native attribute on `button`, `aria-disabled` and
  `tabindex="-1"` on other elements.
- Focus ring uses `ring`, `ring-width`, `ring-offset`.
- The width does not change when `loading` toggles.

## Do

```vue
<Button variant="primary" :loading="saving" @click="save">Save</Button>
<Button variant="ghost" @click="cancel">Cancel</Button>
```

## Do not

```vue
<!-- Two primary buttons in one view: the user cannot tell the main action. -->
<Button variant="primary">Save</Button>
<Button variant="primary">Publish</Button>
```
