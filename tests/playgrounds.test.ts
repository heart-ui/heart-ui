import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..')
const buildTimeout = 600_000

// `pnpm --filter <app> build` exits 0 when the script is missing; `--dir` fails instead.
// Earlier output is removed first so no test reads a stale build.
function build(app: string, output: string) {
  rmSync(join(root, 'apps', app, output), { recursive: true, force: true })
  const result = spawnSync('pnpm', ['--dir', join(root, 'apps', app), 'run', 'build'], {
    encoding: 'utf8',
  })
  if (result.error) throw result.error
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

function cssIn(dir: string) {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join(dir, file), 'utf8'))
    .join('\n')
}

type ViteServer = {
  ssrLoadModule(id: string): Promise<unknown>
  close(): Promise<void>
}

const placeholderText = 'Placeholder demo'
// Keys every plain object inherits: a lookup must not mistake them for demos.
const unknownNames = ['no-such-item', 'constructor', '__proto__', 'toString']
const placeholderUtility = /\.p-4\s*\{/

describe('vite playground', () => {
  const app = join(root, 'apps/playground-vite')
  let built: { status: number | null; output: string }

  beforeAll(() => {
    built = build('playground-vite', 'dist')
  }, buildTimeout)

  it('builds', () => {
    expect(built.status, built.output).toBe(0)
    expect(existsSync(join(app, 'dist/index.html'))).toBe(true)
  })

  it('builds Tailwind utilities from registry/', () => {
    expect(cssIn(join(app, 'dist'))).toMatch(placeholderUtility)
  })

  describe('first paint', () => {
    function headScript() {
      const html = readFileSync(join(app, 'dist/index.html'), 'utf8')
      const head = html.slice(0, html.indexOf('</head>'))
      const inline = /<script>([\s\S]*?)<\/script>/.exec(head)
      return { head, inline }
    }

    function load(search: string) {
      const classes = new Set<string>()
      const attributes: Record<string, string> = {}
      const documentElement = {
        classList: { add: (name: string) => classes.add(name) },
        setAttribute: (name: string, value: string) => (attributes[name] = value),
      }
      runInNewContext(headScript().inline![1]!, {
        location: { search },
        document: { documentElement },
        URLSearchParams,
      })
      return { classes, attributes }
    }

    it('vite playground sets mode, dir and theme before first paint', () => {
      const { head, inline } = headScript()
      expect(inline).not.toBeNull()
      for (const later of ['<link rel="stylesheet"', '<script type="module"']) {
        const at = head.indexOf(later)
        if (at !== -1) expect(inline!.index).toBeLessThan(at)
      }
      const { classes, attributes } = load('?mode=dark&dir=rtl&theme=ocean')
      expect([...classes]).toEqual(['dark'])
      expect(attributes).toEqual({ dir: 'rtl', 'data-tre-theme': 'ocean' })
    })

    it.each(['', '?mode=light&dir=up&theme=%22%3E%3Cscript%3E', '?mode=DARK&theme='])(
      'falls back on missing or invalid parameters: %s',
      (search) => {
        const { classes, attributes } = load(search)
        expect([...classes]).toEqual([])
        expect(attributes).toEqual({ dir: 'ltr', 'data-tre-theme': 'default' })
      },
    )
  })

  describe('gallery route', () => {
    let render: (path: string) => Promise<string>
    let indexDemos: (modules: Record<string, unknown>) => Map<string, unknown>
    let close: () => Promise<void>

    beforeAll(async () => {
      const appRequire = createRequire(join(app, 'package.json'))
      // vite is the app's dependency, not the root's, so it is typed here by the calls used.
      const vite = (await import(pathToFileURL(appRequire.resolve('vite')).href)) as {
        createServer(config: object): Promise<ViteServer>
      }
      const server = await vite.createServer({
        root: app,
        logLevel: 'silent',
        appType: 'custom',
        server: { middlewareMode: true, hmr: false },
      })
      close = () => server.close()
      const { createGallery } = (await server.ssrLoadModule('/src/gallery.ts')) as {
        createGallery(path: string): unknown
      }
      const { renderToString } = (await server.ssrLoadModule('vue/server-renderer')) as {
        renderToString(app: unknown): Promise<string>
      }
      ;({ indexDemos } = (await server.ssrLoadModule(join(root, 'apps/gallery-rules.ts'))) as {
        indexDemos: typeof indexDemos
      })
      render = (path) => renderToString(createGallery(path))
    }, buildTimeout)
    afterAll(() => close?.())

    it('vite playground renders the placeholder demo', async () => {
      expect(await render('/demo/placeholder')).toContain(placeholderText)
    })

    it.each(unknownNames)(
      'vite playground shows not found for an unknown demo: %s',
      async (name) => {
        const html = await render(`/demo/${name}`)
        expect(html).not.toContain(placeholderText)
        expect(html).toContain('No demo')
      },
    )

    it.each(['/', '/demo', '/demo/placeholder/extra', '/demos/placeholder', '/demo/%E0%A4%A'])(
      'vite playground shows not found for a path that is not a demo: %s',
      async (path) => {
        const html = await render(path)
        expect(html).not.toContain(placeholderText)
        expect(html).toContain('No demo')
      },
    )

    it.each([
      [
        'the same folder name in two kinds',
        ['/registry/ui/card/Card.demo.vue', '/registry/blocks/card/Card.demo.vue'],
      ],
      [
        'two demos in one folder',
        ['/registry/ui/button/Button.demo.vue', '/registry/ui/button/Other.demo.vue'],
      ],
    ])('demo index rejects %s', (_, paths) => {
      const load = () => Promise.resolve({})
      expect(() => indexDemos(Object.fromEntries(paths.map((path) => [path, load])))).toThrow(
        /card|button/,
      )
    })
  })
})

describe('nuxt playground', () => {
  const app = join(root, 'apps/playground-nuxt')
  let built: { status: number | null; output: string }
  let server: ChildProcess | undefined
  let base = ''

  async function freePort() {
    return new Promise<number>((resolve, reject) => {
      const probe = createServer()
      probe.once('error', reject)
      probe.listen(0, '127.0.0.1', () => {
        const address = probe.address()
        probe.close(() => resolve(typeof address === 'object' && address ? address.port : 0))
      })
    })
  }

  beforeAll(async () => {
    built = build('playground-nuxt', '.output')
    if (built.status !== 0) throw new Error(`nuxt build failed:\n${built.output}`)
    const port = await freePort()
    base = `http://127.0.0.1:${port}`
    server = spawn(process.execPath, [join(app, '.output/server/index.mjs')], {
      env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let log = ''
    let spawnError: Error | undefined
    server.stdout!.on('data', (chunk: Buffer) => (log += chunk))
    server.stderr!.on('data', (chunk: Buffer) => (log += chunk))
    server.once('error', (error) => (spawnError = error))
    const deadline = Date.now() + 30_000
    for (;;) {
      if (spawnError) throw spawnError
      if (server.exitCode !== null || server.signalCode !== null) {
        throw new Error(`nuxt server exited (${server.exitCode ?? server.signalCode}): ${log}`)
      }
      if (Date.now() > deadline) throw new Error(`nuxt server did not answer in 30 s: ${log}`)
      try {
        const response = await fetch(base, { signal: AbortSignal.timeout(2_000) })
        await response.body?.cancel()
        break
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }
  }, buildTimeout)
  afterAll(() => {
    server?.kill()
  })

  async function htmlAttributes(path: string) {
    const html = await (await fetch(base + path)).text()
    return /<html([^>]*)>/.exec(html)![1]!
  }

  it('builds', () => {
    expect(built.status, built.output).toBe(0)
    expect(existsSync(join(app, '.output/server/index.mjs'))).toBe(true)
  })

  it('builds Tailwind utilities from registry/', () => {
    expect(cssIn(join(app, '.output/public'))).toMatch(placeholderUtility)
  })

  it('nuxt playground renders the placeholder demo', async () => {
    const response = await fetch(`${base}/demo/placeholder`)
    expect(response.status).toBe(200)
    expect(await response.text()).toContain(placeholderText)
  })

  it('nuxt playground server-renders mode, dir and theme', async () => {
    const attributes = await htmlAttributes('/demo/placeholder?mode=dark&dir=rtl&theme=ocean')
    expect(attributes).toMatch(/\bclass="dark"/)
    expect(attributes).toMatch(/\bdir="rtl"/)
    expect(attributes).toMatch(/\bdata-tre-theme="ocean"/)
  })

  it.each([
    '/demo/placeholder',
    '/demo/placeholder?mode=light&dir=up&theme=%22%3E%3Cscript%3E',
    '/demo/placeholder?mode=DARK&theme=',
  ])('falls back on missing or invalid parameters: %s', async (path) => {
    const attributes = await htmlAttributes(path)
    expect(attributes).not.toMatch(/\bdark\b/)
    expect(attributes).toMatch(/\bdir="ltr"/)
    expect(attributes).toMatch(/\bdata-tre-theme="default"/)
  })

  it.each(unknownNames)('nuxt playground answers 404 for an unknown demo: %s', async (name) => {
    const response = await fetch(`${base}/demo/${name}`)
    await response.body?.cancel()
    expect(response.status).toBe(404)
  })

  it('nuxt playground sets lang on html', async () => {
    expect(await htmlAttributes('/demo/placeholder')).toMatch(/\blang="en"/)
  })
})
