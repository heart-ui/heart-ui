import { readdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { run } from '../src/cli.ts'
import { createInit } from '../src/commands/init.ts'
import {
  buildRegistry,
  capture,
  copyFixture,
  registryFetch,
  registryUrl,
} from './helpers/project.ts'

// Inside this package's node_modules, the project resolves vite, @tailwindcss/vite and tailwindcss
// from the CLI's devDependencies, and the helpers' clsx, tailwind-merge and @iconify/vue from the
// workspace root, as if they were installed.
const parent = fileURLToPath(new URL('../node_modules/.heart-ui-init-build', import.meta.url))

describe('AC-002 the initialised project builds', () => {
  let out: string
  let root: string
  beforeAll(() => {
    out = buildRegistry()
    root = copyFixture('init-vite', parent)
  }, 120_000)
  afterAll(() => {
    rmSync(dirname(out), { recursive: true, force: true })
    rmSync(dirname(root), { recursive: true, force: true })
  })

  it('builds with Vite and resolves bg-primary to the token', async () => {
    const init = createInit({
      fetch: registryFetch(out).fetch,
      install: async () => {},
      nodeVersion: process.versions.node,
      cacheDir: join(dirname(out), 'cache'),
      registryUrl,
    })
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, { init }), c.err()).toBe(0)

    await build({
      root,
      configFile: join(root, 'vite.config.ts'),
      logLevel: 'silent',
      build: { outDir: join(root, 'dist'), emptyOutDir: true },
    })
    const assets = join(root, 'dist/assets')
    const css = readdirSync(assets)
      .filter((file) => file.endsWith('.css'))
      .map((file) => readFileSync(join(assets, file), 'utf8'))
      .join('\n')
    expect(css).toMatch(/\.bg-primary\{background-color:var\(--h-primary\)\}/)
    expect(css).toMatch(/--h-primary:/)
    const js = readdirSync(assets).filter((file) => file.endsWith('.js'))
    expect(js).toHaveLength(1)
  }, 120_000)
})
