import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const timeout = 180_000

function run(args: string[]) {
  const result = spawnSync(process.execPath, [join(root, 'scripts/spec-examples.ts'), ...args], {
    cwd: root,
    encoding: 'utf8',
  })
  if (result.error) throw result.error
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

// A spec with the given sections, each a `vue` block; returns its path relative to the repo.
function spec(sections: Record<string, string>) {
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

describe('spec examples', () => {
  it(
    'AC-001 every spec example type-checks',
    () => {
      const result = run([])
      expect(result.status, result.output).toBe(0)
      expect(result.output).toMatch(/every example type-checks/)
    },
    timeout,
  )

  it(
    'AC-002 a made-up prop fails',
    () => {
      const file = spec({
        Usage: '<Button variant="primary">Save</Button>\n<Button frobnicate="x">Go</Button>',
      })
      const result = run(['--md', file])
      expect(result.status).toBe(1)
      expect(result.output).toContain(`${file}:9: `)
      expect(result.output).toMatch(/frobnicate/)
    },
    timeout,
  )

  it(
    'AC-003 a made-up event or component fails',
    () => {
      const event = spec({ Do: '<Button @frobnicate="go">Go</Button>' })
      const failed = run(['--md', event])
      expect(failed.status).toBe(1)
      expect(failed.output).toMatch(/onFrobnicate|frobnicate/)

      const component = spec({ Usage: '<Buton variant="primary">Go</Buton>' })
      const missing = run(['--md', component])
      expect(missing.status).toBe(1)
      expect(missing.output).toMatch(/Buton/)
    },
    timeout,
  )

  it(
    'AC-004 what an example may use',
    () => {
      const file = spec({
        Usage: [
          '<Label for="email">Email</Label>',
          '<Input id="email" v-model="email" type="email" required aria-describedby="hint" data-test="email" />',
          '<Button variant="primary" :loading="saving" @click="save" @keydown.enter="save">Save</Button>',
          '<Button variant="ghost" aria-label="Close"><Icon name="close" /></Button>',
          '<RouterView />',
        ].join('\n'),
        'Do not': '<Button frobnicate="x" @frob="go">Wrong on purpose</Button>',
      })
      const result = run(['--md', file])
      expect(result.status, result.output).toBe(0)
    },
    timeout,
  )

  it('AC-005 the gates run it', () => {
    const scripts = (
      JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
        scripts: Record<string, string>
      }
    ).scripts
    expect(scripts.typecheck).toMatch(/&& node scripts\/spec-examples\.ts$/)
    const plan = spawnSync(
      process.execPath,
      [join(root, 'scripts/check.ts'), '--item', 'button', '--dry-run'],
      { cwd: root, encoding: 'utf8' },
    )
    const typecheck = plan.stdout.split('\n').find((line) => line.startsWith('typecheck: ')) ?? ''
    expect(typecheck).toMatch(/node scripts\/spec-examples\.ts --item button/)
  })
  it(
    'AC-002 a made-up prop fails beside allowed attributes, and form state never falls through',
    () => {
      for (const [code, named] of [
        ['<Button aria-label="x" frobnicate="y">Go</Button>', 'frobnicate'],
        ['<Button id="a" data-test="b" frobnicate="y">Go</Button>', 'frobnicate'],
        ['<Checkbox checked>Agree</Checkbox>', 'checked'],
        ['<Button @change="go">Go</Button>', 'change'],
        ['<Checkbox type="email" placeholder="x">Agree</Checkbox>', 'type'],
        ['<Select><SelectTrigger aria-label="Pick" rows="3" /></Select>', 'rows'],
      ] as const) {
        const result = run(['--md', spec({ Usage: code })])
        expect(result.status, code).toBe(1)
        expect(result.output, code).toContain(named)
        expect(result.output, code).not.toMatch(/unknown prop (?:aria-label|id|data-test)/)
      }
      const form = spec({
        Usage: '<Input type="email" name="email" required autocomplete="email" @change="go" />',
      })
      const allowed = run(['--md', form])
      expect(allowed.status, allowed.output).toBe(0)
    },
    timeout,
  )

  it(
    'AC-002 every vue block is found, wherever its fence sits',
    () => {
      const dir = dirname(join(root, spec({})))
      const path = join(dir, 'fences.md')
      writeFileSync(
        path,
        [
          '# Fences',
          '',
          '```md',
          '## Usage',
          '```',
          '',
          '## Do',
          '',
          '- An item:',
          '',
          '  ```vue',
          '  <Button frobnicate="w">Go</Button>',
          '  ```',
          '',
          '```vue{2}',
          '<Button frobnicate="z">Go</Button>',
          '```',
          '',
        ].join('\n'),
      )
      // Absolute paths work too.
      const result = run(['--md', path])
      expect(result.status).toBe(1)
      expect(result.output).toContain('fences.md:12:')
      expect(result.output).toContain('fences.md:16:')
    },
    timeout,
  )

  it(
    'AC-002 a full component is refused with a clear message',
    () => {
      const file = spec({
        Usage:
          '<script setup lang="ts">\nconst a = 1\n</script>\n<template><Button>Go</Button></template>',
      })
      const result = run(['--md', file])
      expect(result.status).toBe(1)
      expect(result.output).toMatch(/template-only/)
    },
    timeout,
  )

  it('AC-005 a vue-tsc that fails without reporting fails the check', async () => {
    const { problemsFrom } = await import('../scripts/spec-examples.ts')
    expect(() =>
      problemsFrom(
        ' ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "vue-tsc" not found\n',
        1,
        new Map(),
      ),
    ).toThrow(/vue-tsc failed/)
    expect(() =>
      problemsFrom("error TS5083: Cannot read file '/x/tsconfig.json'.\n", 2, new Map()),
    ).toThrow(/TS5083/)
    expect(problemsFrom('', 0, new Map())).toEqual([])
  })

  it('AC-005 block and layout specs import their items', async () => {
    const { kindAliases } = await import('../scripts/spec-examples.ts')
    expect(kindAliases).toEqual({
      ui: '@/components/ui',
      blocks: '@/components/blocks',
      layouts: '@/layouts',
      lib: '@/lib',
    })
  })
  it(
    'AC-004 fallthrough reaches components in v-if branches, never their declared props',
    () => {
      const branches = spec({
        Usage: [
          '<Button v-if="ok" aria-label="Close">X</Button>',
          '<Button v-else id="b">Y</Button>',
          '<template v-if="more"><Button id="z">Go</Button></template>',
          '<Checkbox v-model="terms" name="terms" required>I accept</Checkbox>',
        ].join('\n'),
      })
      const passed = run(['--md', branches])
      expect(passed.status, passed.output).toBe(0)

      for (const [code, named] of [
        // TypeScript names the value, not the prop, for a declared prop's wrong type.
        ['<Tabs dir="sideways" default-value="a" />', 'sideways'],
        ['<Checkbox :name="42">Agree</Checkbox>', 'not assignable'],
      ] as const) {
        const result = run(['--md', spec({ Usage: code })])
        expect(result.status, code).toBe(1)
        expect(result.output, code).toContain(named)
      }
    },
    timeout,
  )

  it(
    'AC-004 a longer closing fence ends the block, and a commented full component is refused',
    () => {
      const dir = dirname(join(root, spec({})))
      const fences = join(dir, 'close.md')
      writeFileSync(
        fences,
        '# Close\n\n## Usage\n\n```vue\n<Button>Go</Button>\n`````\n\n## Do not\n\n```vue\n<Button frob="1" />\n```\n',
      )
      const closed = run(['--md', fences])
      expect(closed.status, closed.output).toBe(0)

      const commented = spec({
        Usage:
          '<!-- full -->\n<script setup lang="ts">\nconst a: number = 1\n</script>\n<template><Button>Go</Button></template>',
      })
      const refused = run(['--md', commented])
      expect(refused.status).toBe(1)
      expect(refused.output).toMatch(/template-only/)
    },
    timeout,
  )

  it(
    'AC-005 --item names a real item and covers the specs that use it',
    async () => {
      const missing = run(['--item', 'buton'])
      expect(missing.status).toBe(1)
      expect(missing.output).toMatch(/buton/)
      const both = run(['--item', 'button', '--md', 'registry/ui/button/button.md'])
      expect(both.status).toBe(1)

      const { specFilesFor } = await import('../scripts/spec-examples.ts')
      const files = specFilesFor('button').map((path) => path.slice(root.length))
      expect(files).toContain('registry/ui/button/button.md')
      expect(files).toContain('registry/ui/dialog/dialog.md')
      expect(files).not.toContain('registry/ui/badge/badge.md')
    },
    timeout,
  )

  it('AC-005 only strict-template noise in registry files is ignored', async () => {
    const { problemsFrom } = await import('../scripts/spec-examples.ts')
    const button = join(root, 'registry/ui/button/Button.vue')
    expect(
      problemsFrom(
        `${button}(60,6): error TS2353: Object literal may only specify known properties, and 'type' does not exist.\n`,
        1,
        new Map(),
      ),
    ).toEqual([])
    expect(() =>
      problemsFrom(`${button}(3,1): error TS2307: Cannot find module '@/lib/x'.\n`, 1, new Map()),
    ).toThrow(/TS2307/)
  })
})
