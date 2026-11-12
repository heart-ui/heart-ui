import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@registry': fileURLToPath(new URL('../../registry', import.meta.url)) },
    // registry/ resolves vue from the root node_modules; dedupe keeps one copy if versions drift.
    dedupe: ['vue'],
  },
})
