import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-12',
  devtools: { enabled: false },
  app: { head: { htmlAttrs: { lang: 'en' } } },
  css: ['~/assets/css/main.css'],
  alias: {
    '@registry': fileURLToPath(new URL('../../registry', import.meta.url)),
  },
  // registry/ resolves vue from the root node_modules; dedupe keeps one copy if versions drift.
  // Production Vue skips attribute, class and style mismatch checks unless this is on, so the
  // SSR test would miss useId() mismatches between server and client. @nuxt/schema maps
  // debug.hydration to __VUE_PROD_HYDRATION_MISMATCH_DETAILS__.
  debug: { hydration: true },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ['vue'],
      // Registry items import shared code as the CLI writes it: `@/lib/...`. Nuxt's own `@`
      // alias points at app/, so this has to match first.
      alias: [
        {
          find: /^@\/lib\//,
          replacement: `${fileURLToPath(new URL('../../registry/lib', import.meta.url))}/`,
        },
      ],
    },
  },
})
