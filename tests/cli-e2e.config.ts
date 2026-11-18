import { defineConfig } from 'vitest/config'

// Slow and networked (pnpm fetches missing metadata), so it runs as its own check step.
export default defineConfig({
  test: { include: ['tests/cli-e2e.test.ts'], testTimeout: 900_000, hookTimeout: 900_000 },
})
