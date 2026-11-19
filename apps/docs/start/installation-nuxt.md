# Installation with Nuxt

These steps create a Nuxt 4 app that Heart UI can set up. Nuxt already maps
the `@` alias to `app/`.

## 1. Create the app

```sh
npm create nuxt@latest my-app
cd my-app
```

## 2. Add Tailwind CSS and TypeScript

```sh
npm install -D tailwindcss @tailwindcss/vite typescript@6
```

Heart UI's components declare their props in TypeScript, which Vue's compiler
reads through the `typescript` package. Vue's compiler does not load
TypeScript 7 yet, so install 6.

Create `app/assets/css/main.css`:

```css
@import 'tailwindcss';
```

## 3. Load the CSS and the plugin

In `nuxt.config.ts`, add the import and the `css` and `vite` keys, keeping
the keys already there:

```ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
})
```

## 4. Set up Heart UI

Continue with [Getting started](./getting-started). In Nuxt, the files go
under `app/` instead of `src/`.
