import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { demoFiles, demoStates } from '../../demo-files'
import { startNodeServer } from '../../test-utils'

const app = join(import.meta.dirname, '..')
// `pnpm check:item <name>` narrows the run to that item's demo.
const only = process.env.HEART_UI_ITEM
const cases = demoFiles()
  .filter(({ name }) => !only || name === only)
  .flatMap(({ kind, name }) => demoStates(kind, name).map((state) => [name, state] as const))
let stop: (() => void) | undefined
let browser: Browser | undefined
let base = ''

beforeAll(async () => {
  const built = spawnSync('pnpm', ['--dir', app, 'run', 'build'], { encoding: 'utf8' })
  if (built.status !== 0) throw new Error(`nuxt build failed:\n${built.stdout}${built.stderr}`)
  ;({ base, stop } = await startNodeServer(join(app, '.output/server/index.mjs')))
  browser = await chromium.launch()
}, 600_000)

afterAll(async () => {
  await browser?.close()
  stop?.()
})

describe.each(['light', 'dark'])('every demo server-renders and hydrates in %s mode', (mode) => {
  it.each(cases)('%s in state %s hydrates without a warning', async (name, state) => {
    const page = await browser!.newPage()
    const problems: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' || /hydrat/i.test(message.text())) {
        problems.push(`${message.type()}: ${message.text()}`)
      }
    })
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
    const response = await page.goto(`${base}/demo/${name}?mode=${mode}&state=${state}`)
    await page.waitForLoadState('networkidle')
    await page.close()
    expect(response?.status()).toBe(200)
    expect(problems).toEqual([])
  })
})
