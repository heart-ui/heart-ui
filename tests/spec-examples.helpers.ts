import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach } from 'vitest'

export const root = fileURLToPath(new URL('..', import.meta.url))
export const timeout = 180_000

export function run(args: string[]) {
  const result = spawnSync(process.execPath, [join(root, 'scripts/spec-examples.ts'), ...args], {
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

// A spec with the given sections, each a `vue` block; returns its path relative to the repo.
export function spec(sections: Record<string, string>) {
  mkdirSync(join(root, 'dist'), { recursive: true })
  const dir = mkdtempSync(join(root, 'dist', 'spec-test-'))
  dirs.push(dir)
  const body = Object.entries(sections)
    .map(([heading, code]) => `## ${heading}\n\n\`\`\`vue\n${code}\n\`\`\`\n`)
    .join('\n')
  const path = join(dir, 'sample.md')
  writeFileSync(path, `# Sample\n\nA sample.\n\n${body}`)
  return path.slice(root.length)
}
