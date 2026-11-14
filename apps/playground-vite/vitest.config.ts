import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // `pnpm check:item <name>` narrows the demo tests to that item.
      provide: { item: process.env.HEART_UI_ITEM ?? '' },
      // The harness's own tests, and each item's browser test (conventions, Item anatomy).
      include: ['test/**/*.browser.test.ts', '../../registry/{ui,blocks,layouts}/*/*.test.ts'],
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: 'chromium' }],
      },
    },
  }),
)
