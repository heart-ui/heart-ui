# Installation with Vite

These steps create a Vite app that Heart UI can set up: Vue, TypeScript,
Tailwind CSS 4 and the `@` alias.

## 1. Create the app

::: code-group

```sh [npm]
npm create vite@latest my-app -- --template vue-ts
cd my-app
npm install
```

```sh [pnpm]
pnpm create vite my-app --template vue-ts
cd my-app
pnpm install
```

```sh [yarn]
yarn create vite my-app --template vue-ts
cd my-app
yarn
```

```sh [bun]
bun create vite my-app --template vue-ts
cd my-app
bun install
```

:::

## 2. Add Tailwind CSS

::: code-group

```sh [npm]
npm install -D tailwindcss @tailwindcss/vite @types/node
```

```sh [pnpm]
pnpm add -D tailwindcss @tailwindcss/vite @types/node
```

```sh [yarn]
yarn add -D tailwindcss @tailwindcss/vite @types/node
```

```sh [bun]
bun add -d tailwindcss @tailwindcss/vite @types/node
```

:::

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
