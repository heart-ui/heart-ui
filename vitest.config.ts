import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Registry items import shared code as the CLI writes it: `@/lib/...`, `@/components/ui/...`.
  resolve: {
    alias: {
      '@/lib': fileURLToPath(new URL('./registry/lib', import.meta.url)),
      '@/components/ui': fileURLToPath(new URL('./registry/ui', import.meta.url)),
    },
  },
  test: {
    include: [
      'tests/**/*.test.ts',
      'packages/*/test/**/*.test.ts',
      // Kept inside the docs app so their imports resolve VitePress, which only apps/docs depends on.
      'apps/docs/test/**/*.test.ts',
    ],
    // Seeded regressions run every heavy script in a sandbox: `pnpm test:harness`.
    exclude: ['tests/harness.test.ts', 'tests/cli-e2e.test.ts', '**/node_modules/**'],
  },
})
