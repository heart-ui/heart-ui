import { execFileSync, spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..')
const timeout = 600_000
const sandboxes: string[] = []
afterAll(() => {
  for (const dir of sandboxes) rmSync(dir, { recursive: true, force: true })
})

// A copy of the repo's tracked and untracked files with node_modules linked, so a seeded
// regression never touches the working tree (knowledge/gotchas/toolchain.md).
// Linked node_modules resolve workspace packages and tool caches to the working tree, so seeds
// only touch registry/ and tests/ (knowledge/gotchas/test-harness.md).
const tracked = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\0')
  .filter((file) => file && existsSync(join(root, file)))

function sandbox(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'heart-ui-harness-'))
  sandboxes.push(dir)
  for (const file of tracked) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    cpSync(join(root, file), join(dir, file))
  }
  for (const modules of [
    'node_modules',
    'apps/playground-vite/node_modules',
    'apps/playground-nuxt/node_modules',
  ]) {
    symlinkSync(join(root, modules), join(dir, modules))
  }
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), content)
  }
  return dir
}

function run(dir: string, script: string, ...args: string[]) {
  const result = spawnSync('pnpm', ['run', script, ...args], { cwd: dir, encoding: 'utf8' })
  if (result.error) throw result.error
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

describe('seeded regressions', () => {
  it(
    'test:unit fails on a failing test',
    () => {
      const dir = sandbox({
        'tests/seeded.test.ts':
          "import { expect, it } from 'vitest'\nit('seeded', () => expect(1).toBe(2))\n",
      })
      const result = run(dir, 'test:unit', 'tests/seeded.test.ts')
      expect(result.status, result.output).not.toBe(0)
      expect(result.output).toMatch(/AssertionError/)
    },
    timeout,
  )

  it(
    'test:browser fails on an axe violation',
    () => {
      const dir = sandbox({
        'registry/ui/seeded/Seeded.demo.vue': '<template><button></button></template>\n',
        'registry/ui/seeded/Seeded.test.ts':
          "import { expect, it } from 'vitest'\nit('seeded item test ran', () => expect('item').toBe('seeded'))\n",
      })
      const result = run(dir, 'test:browser')
      expect(result.status, result.output).not.toBe(0)
      expect(result.output).toMatch(/seeded has no axe violations[\s\S]*button-name/)
      // Item browser tests next to the item (conventions, Item anatomy) run too.
      expect(result.output).toMatch(/seeded item test ran/)
    },
    timeout,
  )

  it(
    'test:ssr fails on an attribute hydration mismatch',
    () => {
      const dir = sandbox({
        'registry/ui/seeded/Seeded.demo.vue':
          "<script setup lang=\"ts\">\nconst side = typeof window === 'undefined' ? 'server' : 'client'\n</script>\n\n<template>\n  <p :id=\"side\">Seeded</p>\n</template>\n",
      })
      const result = run(dir, 'test:ssr')
      expect(result.status, result.output).not.toBe(0)
      expect(result.output).toMatch(/Hydration attribute mismatch/)
    },
    timeout,
  )

  it(
    'test:visual fails on a visual change',
    () => {
      const dir = sandbox({
        'registry/ui/placeholder/Placeholder.demo.vue':
          '<template>\n  <div class="p-4">\n    <p class="flex h-control-lg items-center bg-primary px-control-px-md text-primary-foreground">\n      Placeholder demo\n    </p>\n  </div>\n</template>\n',
      })
      const result = run(dir, 'test:visual')
      expect(result.status, result.output).not.toBe(0)
      expect(result.output).toMatch(/toHaveScreenshot\(expected\) failed/)
    },
    timeout,
  )
})
