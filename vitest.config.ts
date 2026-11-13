import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Registry items import shared code as the CLI writes it: `@/lib/...`.
  resolve: { alias: { '@/lib': fileURLToPath(new URL('./registry/lib', import.meta.url)) } },
  test: {
    include: ['tests/**/*.test.ts', 'packages/*/test/**/*.test.ts'],
    // Seeded regressions run every heavy script in a sandbox: `pnpm test:harness`.
    exclude: ['tests/harness.test.ts', '**/node_modules/**'],
  },
})
