# Getting started

Heart UI copies Vue components into your project as source you own. A
command-line tool, `heart-ui`, sets your project up and adds components; after
that the code is yours to read and change.

## Before you start

You need:

- Node 22 or later.
- A Vite or Nuxt 4 app with Vue 3.5 or later and TypeScript 6.
- Tailwind CSS 4, imported from your app's CSS with `@import "tailwindcss";`.
- The `@` import alias pointing at your source folder (`src/` in Vite, `app/`
  in Nuxt, where Nuxt sets it for you).

[Installation with Vite](./installation-vite) and
[Installation with Nuxt](./installation-nuxt) set up such an app from scratch.

## 1. Set up Heart UI

In your project folder, run:

```sh
npx heart-ui init
```

`init` checks your versions, lists what it will write, and asks before writing:

- `heart-ui.json`, the project config.
- `theme.css` and `tokens.css` in `assets/css/` under your source folder: the
  theme's colours, radii, spacing and fonts, mapped to Tailwind utilities.
- The `utils` and `icon` helpers in `lib/` under your source folder.
- `AGENTS.md`, the rules a coding agent follows when it builds UI here.

It then points your CSS's `@import "tailwindcss";` at `theme.css` (which
imports Tailwind itself) and installs the helpers' packages. Pass `--yes` to
skip the question, or `--theme <preset>` to pick a theme.

## 2. Add a component

```sh
npx heart-ui add button
```

`add` writes the button to `components/ui/button/` under your source folder,
with anything it depends on, installs the packages it needs, and records what
it wrote in `heart-ui.lock.json`.

## 3. Use it

Import it from the alias and use it like any Vue component:

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>

<template>
  <main>
    <Button variant="primary">Save</Button>
  </main>
</template>
```

Start your dev server (`npm run dev`) and the button appears in your theme's
primary colour.

## Next

- Browse the [components](/components/) and add the ones you need.
- `npx heart-ui list` prints every item in the registry.
- [Theming](./theming) and [dark mode](./dark-mode) change how it all looks.
