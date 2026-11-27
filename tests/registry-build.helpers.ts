import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach } from 'vitest'

export const root = join(import.meta.dirname, '..')
export const schemas = join(root, 'scripts/registry-schemas')
export const timeout = 60_000

export function readJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

export function build(args: string[] = []) {
  const result = spawnSync(process.execPath, [join(root, 'scripts/registry-build.ts'), ...args], {
    cwd: root,
    encoding: 'utf8',
  })
  if (result.error) throw result.error
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

export const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

// A throwaway registry holding one valid lib item plus the given files.
export function registry(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'heart-ui-registry-'))
  dirs.push(dir)
  cpSync(join(root, 'registry/lib/utils'), join(dir, 'registry/lib/utils'), { recursive: true })
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), content)
  }
  return dir
}

export function buildIn(dir: string) {
  return build(['--registry', join(dir, 'registry'), '--out', join(dir, 'dist')])
}

export const item = (fields: Record<string, unknown>) =>
  JSON.stringify({
    name: 'sample',
    type: 'registry:ui',
    title: 'Sample',
    description: 'A sample.',
    files: ['Sample.vue'],
    meta: { version: '0.1.0', tier: 1 },
    ...fields,
  })
