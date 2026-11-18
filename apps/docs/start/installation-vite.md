# Installation with Vite

These steps create a Vite app that Heart UI can set up: Vue, TypeScript,
Tailwind CSS 4 and the `@` alias.

## 1. Create the app

```sh
npm create vite@latest my-app -- --template vue-ts
cd my-app
npm install
```

## 2. Add Tailwind CSS

```sh
npm install -D tailwindcss @tailwindcss/vite @types/node
```

Replace the contents of `src/style.css` with:

```css
@import 'tailwindcss';
```

`src/main.ts` already imports `./style.css`.

## 3. Add the plugin and the `@` alias

In `vite.config.ts`:

```ts
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
```

In `tsconfig.app.json`, under `compilerOptions`:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

## 4. Set up Heart UI

Continue with [Getting started](./getting-started).
