# Dark mode

`tokens.css` holds a dark set of values for every colour. It applies when the
`<html>` element has the `dark` class or `data-theme="dark"`. Components need
nothing more: they read the same variables in both modes.

## Switch it

```ts
document.documentElement.classList.toggle('dark')
```

## Follow the system

Set the class from the user's system preference, and keep it in step:

```ts
const query = window.matchMedia('(prefers-color-scheme: dark)')
const apply = () => document.documentElement.classList.toggle('dark', query.matches)
apply()
query.addEventListener('change', apply)
```

## In Nuxt

Set the class while rendering on the server, so the page doesn't flash light
before it turns dark:

```ts
useHead({ htmlAttrs: { class: isDark.value ? 'dark' : '' } })
```

Where `isDark` comes from your own setting, such as a cookie read on the server.
