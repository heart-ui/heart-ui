import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { root, timeout, run, spec } from './spec-examples.helpers.ts'

describe('spec examples', () => {
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
