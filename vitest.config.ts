import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'packages/*/test/**/*.test.ts'],
    // Seeded regressions run every heavy script in a sandbox: `pnpm test:harness`.
    exclude: ['tests/harness.test.ts', '**/node_modules/**'],
  },
})
