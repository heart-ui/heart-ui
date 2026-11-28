import { defineConfig } from '@playwright/test'

// run.ts starts the browser in the official Playwright container and sets these. Screenshots
// taken by a host browser would differ by machine, so the config refuses to run without them.
const wsEndpoint = process.env.HEART_UI_VISUAL_WS
const port = process.env.HEART_UI_VISUAL_PORT
const host = process.env.HEART_UI_VISUAL_HOST
if (!wsEndpoint || !port || !host)
  throw new Error('Run visual tests with `pnpm test:visual`, not playwright directly')

export default defineConfig({
  testDir: '.',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://host.docker.internal:${port}`,
    connectOptions: { wsEndpoint },
  },
  // Near exact: a subtle token change must show up, and Playwright's default per-pixel threshold
  // (0.2) would hide small color shifts. 0.01 lets through only the one-level antialiasing
  // wobble Chromium shows at a few edges of pages with a scrolling table, and still fails a
  // shift of a few levels in any channel.
  expect: { toHaveScreenshot: { maxDiffPixels: 0, threshold: 0.01 } },
  webServer: {
    command: `vite build && vite preview --host ${host} --port ${port} --strictPort`,
    cwd: '..',
    url: `http://${host}:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
