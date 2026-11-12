import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-12',
  devtools: { enabled: false },
  app: { head: { htmlAttrs: { lang: 'en' } } },
  css: ['~/assets/css/main.css'],
  alias: { '@registry': fileURLToPath(new URL('../../registry', import.meta.url)) },
  // registry/ resolves vue from the root node_modules; dedupe keeps one copy if versions drift.
  vite: { plugins: [tailwindcss()], resolve: { dedupe: ['vue'] } },
})
