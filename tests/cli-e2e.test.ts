// End to end: the built CLI sets up committed Vite and Nuxt templates from a locally served
// registry build, adds every Tier 1 item, and the app builds and renders each item's demo in a
// browser. Packages install for real with pnpm from each template's committed lockfile, from the
// store where it can (prefer-offline); `add` resolves only the items' own pinned dependencies.
import { spawn, type ChildProcess } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join, normalize, sep } from 'node:path'
import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll, describe, it, type ExpectStatic } from 'vitest'
import { freePort, startNodeServer } from '../apps/test-utils'

const repo = join(import.meta.dirname, '..')
const cli = join(repo, 'packages/cli/dist/index.mjs')
const templates = join(import.meta.dirname, 'cli-e2e/templates')
const timeout = 900_000
const work = mkdtempSync(join(tmpdir(), 'heart-ui-e2e-'))
const env = { ...process.env, NUXT_TELEMETRY_DISABLED: '1', CI: '1' }
// The CLI's item cache goes here, not into the user's ~/.cache, where every run's random port
// would leave entries no later run can use. Only the CLI gets it: pnpm keeps its metadata cache
// under the same variable, and prefer-offline needs the real one.
const cliCache = join(work, 'cache')
const children = new Set<ChildProcess>()

// Async, not spawnSync: the registry server runs in this process and must keep answering. Every
// child is tracked so a timeout never leaves a build running over a deleted folder.
function run(
  command: string,
  args: string[],
  cwd: string,
  extra: Record<string, string> = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: { ...env, ...extra } })
    children.add(child)
    child.once('exit', () => children.delete(child))
    let output = ''
    child.stdout.on('data', (chunk: Buffer) => (output += chunk))
    child.stderr.on('data', (chunk: Buffer) => (output += chunk))
    child.once('error', reject)
    child.once('close', (code) =>
      code === 0
        ? resolve(output)
        : reject(new Error(`${command} ${args.join(' ')} exited ${code}:\n${output}`)),
    )
  })
}

const types: Record<string, string> = { '.json': 'application/json', '.md': 'text/markdown' }

// Serves a folder over plain http on loopback, which the CLI accepts as a registry.
function serve(folder: string): Promise<{ server: Server; base: string }> {
  const server = createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname)
      const path = normalize(join(folder, pathname))
      if (!path.startsWith(folder + sep)) return response.writeHead(403).end()
      const body = readFileSync(path)
      response.writeHead(200, {
        'content-type': types[extname(path)] ?? 'application/octet-stream',
      })
      response.end(body)
    } catch {
      response.writeHead(404).end()
    }
  })
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({ server, base: `http://127.0.0.1:${port}` })
    })
  })
}

// `vite preview` on a port no one holds; fails with its log when it exits or never answers.
async function startPreview(root: string) {
  const port = await freePort()
  const base = `http://127.0.0.1:${port}`
  // vite's own bin under node, not a pnpm wrapper, so stop() ends the process holding the port.
  const child = spawn(
    process.execPath,
    [
      join(root, 'node_modules/vite/bin/vite.js'),
      'preview',
      '--port',
      String(port),
      '--strictPort',
      '--host',
      '127.0.0.1',
    ],
    { cwd: root, env },
  )
  children.add(child)
  let log = ''
  let spawnError: Error | undefined
  child.stdout.on('data', (chunk: Buffer) => (log += chunk))
  child.stderr.on('data', (chunk: Buffer) => (log += chunk))
  child.once('error', (error) => (spawnError = error))
  const deadline = Date.now() + 60_000
  for (;;) {
    if (spawnError) throw spawnError
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`vite preview exited (${child.exitCode ?? child.signalCode}): ${log}`)
    }
    if (Date.now() > deadline) {
      child.kill()
      throw new Error(`vite preview did not answer in 60 s: ${log}`)
    }
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(2_000) })
      await response.body?.cancel()
      if (response.ok) return { base, stop: () => child.kill() }
    } catch {
      // Not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
}

const pascal = (name: string) =>
  name.replace(/(^|-)(\w)/g, (_, __, char: string) => char.toUpperCase())

// A page with one section per item, holding that item's demo from the registry folder.
function writePage(root: string, uiFolder: string, pagePath: string, items: string[]) {
  const imports: string[] = []
  const sections: string[] = []
  for (const name of items) {
    const source = join(repo, 'registry/ui', name)
    const demos = readdirSync(source)
      .filter((file) => file.endsWith('.demo.vue'))
      .sort()
    if (!demos.length) throw new Error(`${name} has no demo`)
    const tags = demos.map((demo, i) => {
      cpSync(join(source, demo), join(root, uiFolder, name, demo))
      const tag = `${pascal(name)}Demo${i}`
      imports.push(`import ${tag} from '@/components/ui/${name}/${demo}'`)
      return `<${tag} />`
    })
    sections.push(`    <section data-demo="${name}">${tags.join('')}</section>`)
  }
  writeFileSync(
    join(root, pagePath),
    `<script setup lang="ts">\n${imports.join('\n')}\n</script>\n\n<template>\n  <main>\n${sections.join('\n')}\n  </main>\n</template>\n`,
  )
}

let registry: { server: Server; base: string }
let tier1: string[]
let browser: Browser

beforeAll(async () => {
  mkdirSync(cliCache, { recursive: true })
  // Fresh builds of the CLI and the registry, so the test never meets a stale dist.
  await run('pnpm', ['--filter', 'heart-ui', 'build'], repo)
  const registryOut = join(work, 'registry')
  await run(process.execPath, [join(repo, 'scripts/registry-build.ts'), '--out', registryOut], repo)
  const index = JSON.parse(readFileSync(join(registryOut, 'registry.json'), 'utf8')) as {
    items: { name: string; type: string; meta?: { tier?: number } }[]
  }
  tier1 = index.items
    .filter((item) => item.type === 'registry:ui' && item.meta?.tier === 1)
    .map((item) => item.name)
  registry = await serve(registryOut)
  browser = await chromium.launch()
}, timeout)

afterAll(async () => {
  for (const child of children) child.kill()
  await browser?.close()
  registry?.server.close()
  rmSync(work, { recursive: true, force: true })
})

async function renders(expect: ExpectStatic, url: string, items: string[]) {
  const page = await browser.newPage()
  try {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.goto(url, { waitUntil: 'networkidle' })
    for (const name of items) {
      const section = page.locator(`[data-demo="${name}"]`)
      expect(await section.count(), name).toBe(1)
      // An element, not only a Vue comment such as <!--v-if-->, must have rendered.
      expect(await section.locator(':scope > *').count(), name).toBeGreaterThan(0)
    }
    expect(errors).toEqual([])
    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--h-primary').trim(),
    )
    expect(primary).not.toBe('')
  } finally {
    await page.close()
  }
}

async function setUp(expect: ExpectStatic, template: string) {
  expect(tier1.length, 'Tier 1 items in the index').toBeGreaterThan(0)
  const root = join(work, template)
  cpSync(join(templates, template), root, { recursive: true })
  // Packages come from pnpm's store when it has them; only missing metadata is fetched.
  writeFileSync(join(root, '.npmrc'), 'prefer-offline=true\n')
  await run('pnpm', ['install', '--frozen-lockfile'], root)
  await run(
    process.execPath,
    [cli, 'init', '--yes', '--registry', `${registry.base}/r/{name}.json`],
    root,
    { XDG_CACHE_HOME: cliCache },
  )
  await run(process.execPath, [cli, 'add', ...tier1], root, { XDG_CACHE_HOME: cliCache })
  return root
}

// The two apps share only the read-only registry server and the browser, so they run together.
describe.concurrent('the templates', () => {
  it(
    'the Vite template sets up, adds every Tier 1 item, builds and renders each one',
    async ({ expect }) => {
      const root = await setUp(expect, 'vite')
      writePage(root, 'src/components/ui', 'src/App.vue', tier1)
      await run('pnpm', ['exec', 'vite', 'build'], root)
      const preview = await startPreview(root)
      try {
        await renders(expect, `${preview.base}/`, tier1)
      } finally {
        preview.stop()
      }
    },
    timeout,
  )

  it(
    'the Nuxt template sets up, adds every Tier 1 item, builds and renders each one',
    async ({ expect }) => {
      const root = await setUp(expect, 'nuxt')
      writePage(root, 'app/components/ui', 'app/app.vue', tier1)
      await run('pnpm', ['exec', 'nuxt', 'build'], root)
      const server = await startNodeServer(join(root, '.output/server/index.mjs'), 60_000)
      try {
        await renders(expect, `${server.base}/`, tier1)
      } finally {
        server.stop()
      }
    },
    timeout,
  )
})
