import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // The visual tests' browser runs in the Playwright container and reaches preview by this name.
  preview: { allowedHosts: ['host.docker.internal'] },
  resolve: {
    alias: {
      '@registry': fileURLToPath(new URL('../../registry', import.meta.url)),
      // Registry items import shared code as the CLI writes it: `@/lib/...`, `@/components/ui/...`.
      '@/lib': fileURLToPath(new URL('../../registry/lib', import.meta.url)),
      '@/components/ui': fileURLToPath(new URL('../../registry/ui', import.meta.url)),
    },
    // registry/ resolves vue from the root node_modules; dedupe keeps one copy if versions drift.
    dedupe: ['vue'],
  },
})
