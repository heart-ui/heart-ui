import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Io } from '../../src/cli.ts'

export const repo = fileURLToPath(new URL('../../../..', import.meta.url))
export const fixtures = fileURLToPath(new URL('../fixtures', import.meta.url))
export const registryUrl = 'https://registry.test/r/{name}.json'

/** Builds the registry into a temp folder once, as the CLI would fetch it. */
export function buildRegistry(): string {
  const out = join(mkdtempSync(join(tmpdir(), 'heart-ui-registry-')), 'dist')
  const result = spawnSync(
    process.execPath,
    [join(repo, 'scripts/registry-build.ts'), '--out', out],
    { encoding: 'utf8', cwd: repo },
  )
  if (result.status !== 0)
    throw new Error(`registry build failed:\n${result.stdout}${result.stderr}`)
  return out
}

/** A fetch that serves `<out>/r/<name>.json`, with `overrides` replacing whole items. */
export function registryFetch(out: string, overrides: Record<string, unknown> = {}) {
  const calls: string[] = []
  const fetch = async (input: string | URL | Request) => {
    const url = String(input)
    calls.push(url)
    const name = /\/r\/([^/]+)\.json$/.exec(url)?.[1] ?? ''
    if (name in overrides) return new Response(JSON.stringify(overrides[name]))
    try {
      return new Response(readFileSync(join(out, 'r', `${name}.json`), 'utf8'))
    } catch {
      return new Response('Not found', { status: 404 })
    }
  }
  return { fetch: fetch as typeof globalThis.fetch, calls }
}

/** Copies a fixture into a fresh git root under `parent` and returns its path. */
export function copyFixture(name: string, parent = tmpdir()): string {
  mkdirSync(parent, { recursive: true })
  const root = join(realpathSync(mkdtempSync(join(parent, 'heart-ui-init-'))), name)
  cpSync(join(fixtures, name), root, { recursive: true })
  mkdirSync(join(root, '.git'))
  return root
}

/** Every file under `root` except `.git`, relative and sorted. */
export function listFiles(root: string): string[] {
  return readdirSync(root, { recursive: true, encoding: 'utf8', withFileTypes: false })
    .filter((path) => !path.startsWith('.git'))
    .filter((path) => {
      try {
        readFileSync(join(root, path))
        return true
      } catch {
        return false
      }
    })
    .map((path) => relative(root, join(root, path)))
    .sort()
}

export function capture(cwd: string, confirm?: Io['confirm']) {
  const out: string[] = []
  const err: string[] = []
  const io: Io = {
    cwd,
    stdout: (text) => out.push(text),
    stderr: (text) => err.push(text),
    confirm,
  }
  return { io, out: () => out.join(''), err: () => err.join('') }
}
