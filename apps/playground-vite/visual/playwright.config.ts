import { defineConfig } from '@playwright/test'

// run.ts starts the browser in the official Playwright container and sets these. Screenshots
// taken by a host browser would differ by machine, so the config refuses to run without them.
const wsEndpoint = process.env.TREVUI_VISUAL_WS
const port = process.env.TREVUI_VISUAL_PORT
const host = process.env.TREVUI_VISUAL_HOST
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
  expect: { toHaveScreenshot: { maxDiffPixels: 0 } },
  webServer: {
    command: `vite build && vite preview --host ${host} --port ${port} --strictPort`,
    cwd: '..',
    url: `http://${host}:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
