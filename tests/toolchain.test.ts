import { spawnSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..')
const timeout = 120_000

const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>
  devDependencies: Record<string, string>
}

function run(script: string, cwd = root) {
  const result = spawnSync('pnpm', ['run', '--silent', script], { cwd, encoding: 'utf8' })
  if (result.error) throw result.error
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

const toolchainFiles = [
  'package.json',
  'tsconfig.json',
  'tsconfig.base.json',
  'eslint.config.js',
  '.prettierrc.json',
  '.prettierignore',
  '.gitignore',
  'vitest.config.ts',
  'registry/tsconfig.json',
]

// Seeded problems go into a throwaway copy of the toolchain, never the working tree, so a
// killed run or a concurrent lint can't see them.
function sandbox(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'heart-ui-seeded-'))
  for (const file of toolchainFiles) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    cpSync(join(root, file), join(dir, file))
  }
  symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'))
  // A copy of the plugin, so the sandbox's lint rebuilds its own dist, not the working tree's.
  const plugin = join(dir, 'packages/eslint-plugin')
  mkdirSync(plugin, { recursive: true })
  cpSync(join(root, 'packages/eslint-plugin/package.json'), join(plugin, 'package.json'))
  cpSync(join(root, 'packages/eslint-plugin/src'), join(plugin, 'src'), { recursive: true })
  symlinkSync(join(root, 'packages/eslint-plugin/node_modules'), join(plugin, 'node_modules'))
  for (const [file, code] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), code)
  }
  return dir
}

const vueTypeError =
  '<script setup lang="ts">\nconst m: number = \'y\'\n</script>\n\n<template><p>{{ m }}</p></template>\n'

describe('toolchain', () => {
  describe('pass on the scaffold', () => {
    it('scripts lint, format and typecheck are defined', () => {
      expect(Object.keys(manifest.scripts)).toEqual(
        expect.arrayContaining(['lint', 'format', 'typecheck']),
      )
    })

    it.each(['lint', 'typecheck'])(
      '%s exits 0',
      (script) => {
        const result = run(script)
        expect(result.status, result.output).toBe(0)
      },
      timeout,
    )
  })

  it('vue-eslint-parser, the peer eslint-plugin-vue needs, is a devDependency', () => {
    expect(manifest.devDependencies).toHaveProperty('vue-eslint-parser')
  })

  it('every devDependency is pinned to an exact version', () => {
    for (const [name, version] of Object.entries(manifest.devDependencies)) {
      expect(version, name).toMatch(/^\d+\.\d+\.\d+$/)
    }
  })

  describe('scripts fail on a seeded problem in registry/', () => {
    const dirs: string[] = []
    afterEach(() => {
      for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
    })
    function seed(files: Record<string, string>) {
      const dir = sandbox(files)
      dirs.push(dir)
      return dir
    }

    it(
      'typecheck fails on a type error in a registry .vue file',
      () => {
        const result = run('typecheck', seed({ 'registry/ui/seeded/Seeded.vue': vueTypeError }))
        expect(result.status).not.toBe(0)
        expect(result.output).toMatch(/Seeded\.vue.*TS2322/)
      },
      timeout,
    )

    it(
      'typecheck fails on a registry .ts type error',
      () => {
        const dir = seed({ 'registry/ui/seeded/seeded.ts': "export const n: number = 'x'\n" })
        const result = run('typecheck', dir)
        expect(result.status).not.toBe(0)
        expect(result.output).toMatch(/seeded\.ts.*TS2322/)
      },
      timeout,
    )

    it(
      'typecheck fails when registry code uses a Node global',
      () => {
        const dir = seed({ 'registry/lib/seeded/env.ts': 'export const mode = process.env.MODE\n' })
        const result = run('typecheck', dir)
        expect(result.status).not.toBe(0)
        expect(result.output).toMatch(/env\.ts.*Cannot find name 'process'/)
      },
      timeout,
    )

    it(
      'lint fails on a warning-level rule',
      () => {
        const dir = seed({
          'registry/ui/seeded/SeededItem.vue':
            '<script setup lang="ts">\ndefineProps<{ msg: string }>()\n</script>\n\n<template>\n  <p v-html="msg" />\n</template>\n',
        })
        const result = run('lint', dir)
        expect(result.status).not.toBe(0)
        expect(result.output).toMatch(/vue\/no-v-html/)
      },
      timeout,
    )
  })

  describe('vue-tsc reports type errors in .ts and .vue files', () => {
    let dir: string
    let output: string
    let status: number | null

    beforeAll(() => {
      dir = mkdtempSync(join(tmpdir(), 'heart-ui-typecheck-'))
      writeFileSync(
        join(dir, 'tsconfig.json'),
        JSON.stringify({
          extends: join(root, 'tsconfig.base.json'),
          compilerOptions: { noEmit: true },
          include: ['*.ts', '*.vue'],
        }),
      )
      writeFileSync(join(dir, 'seeded.ts'), "export const n: number = 'x'\n")
      writeFileSync(join(dir, 'Seeded.vue'), vueTypeError)
      const result = spawnSync(join(root, 'node_modules/.bin/vue-tsc'), ['-p', dir], {
        encoding: 'utf8',
      })
      if (result.error) throw result.error
      output = result.stdout
      status = result.status
    }, timeout)
    afterAll(() => rmSync(dir, { recursive: true, force: true }))

    it('in a .ts file', () => {
      expect(status).not.toBe(0)
      expect(output).toMatch(/seeded\.ts.*TS2322/)
    })

    it('in a .vue file', () => {
      expect(status).not.toBe(0)
      expect(output).toMatch(/Seeded\.vue.*TS2322/)
    })
  })

  async function lint(file: string, code: string) {
    const { ESLint } = await import('eslint')
    const [result] = await new ESLint({ cwd: root }).lintText(code, {
      filePath: join(root, file),
    })
    return result!.messages
  }

  it('eslint reports a seeded error in a .ts file', async () => {
    const messages = await lint('seeded.ts', 'export const value: any = 1\n')
    expect(messages).toContainEqual(
      expect.objectContaining({ ruleId: '@typescript-eslint/no-explicit-any', severity: 2 }),
    )
  })

  it('eslint parses TypeScript in .vue and reports a seeded Vue error', async () => {
    const code = [
      '<script setup lang="ts">',
      'interface Row {',
      '  id: number',
      '}',
      'const rows: Row[] = []',
      '</script>',
      '',
      '<template>',
      '  <ul>',
      '    <li v-for="row in rows">{{ row.id }}</li>',
      '  </ul>',
      '</template>',
      '',
    ].join('\n')
    const messages = await lint('Seeded.vue', code)
    expect(messages.filter((m) => m.fatal)).toEqual([])
    expect(messages).toContainEqual(
      expect.objectContaining({ ruleId: 'vue/require-v-for-key', severity: 2 }),
    )
  })

  it.each([
    ['registry/ui/sample/sample.variants.ts', ['heart-ui/no-raw-values']],
    ['registry/blocks/sample/sample.ts', ['heart-ui/no-raw-values', 'heart-ui/no-reka-outside-ui']],
    [
      'registry/blocks/sample/sample.mts',
      ['heart-ui/no-raw-values', 'heart-ui/no-reka-outside-ui'],
    ],
    ['apps/playground-vite/src/sample.ts', []],
    ['packages/cli/src/sample.ts', []],
  ])('root config applies the Heart UI rules to registry/ only: %s', async (file, expected) => {
    const code = "export { Primitive } from 'reka-ui'\nexport const brand = '#0f172a'\n"
    const rules = (await lint(file, code))
      .map((message) => message.ruleId)
      .filter((id) => id?.startsWith('heart-ui/'))
    expect([...new Set(rules)].sort()).toEqual(expected)
  })

  it('eslint accepts TypeScript overloads in a .vue file', async () => {
    const code = [
      '<script setup lang="ts">',
      'function pick(a: string): string',
      'function pick(a: number): number',
      'function pick(a: unknown) {',
      '  return a',
      '}',
      'const value = pick(1)',
      '</script>',
      '',
      '<template>',
      '  <p>{{ value }}</p>',
      '</template>',
      '',
    ].join('\n')
    expect(await lint('PickValue.vue', code)).toEqual([])
  })

  it('eslint rejects a .vue script block that is not TypeScript', async () => {
    const code =
      '<script setup>\nconst value = 1\n</script>\n\n<template>\n  <p>{{ value }}</p>\n</template>\n'
    expect(await lint('PlainValue.vue', code)).toContainEqual(
      expect.objectContaining({ ruleId: 'vue/block-lang', severity: 2 }),
    )
  })

  const generated: [string, boolean][] = [
    ['apps/docs/.vitepress/config.ts', false],
    ['apps/docs/.vitepress/theme/index.ts', false],
    ['apps/docs/.vitepress/cache/deps/a.js', true],
    ['apps/docs/.vitepress/dist/a.js', true],
    ['test-results/a.js', true],
    ['playwright-report/trace/a.js', true],
    ['apps/playground-nuxt/.nuxt/a.js', true],
    ['packages/cli/dist/index.js', true],
  ]

  it.each(generated)('eslint ignores %s: %s', async (file, ignored) => {
    const { ESLint } = await import('eslint')
    expect(await new ESLint({ cwd: root }).isPathIgnored(join(root, file))).toBe(ignored)
  })

  it.each(generated)('prettier ignores %s: %s', async (file, ignored) => {
    const prettier = await import('prettier')
    const info = await prettier.getFileInfo(join(root, file), {
      ignorePath: [join(root, '.gitignore'), join(root, '.prettierignore')],
    })
    expect(info.ignored).toBe(ignored)
  })

  describe('prettier flags and fixes a misformatted file', () => {
    const code = 'export const greeting = "hello";\n'
    async function options() {
      const prettier = await import('prettier')
      const filepath = join(root, 'seeded.ts')
      return { prettier, options: { ...(await prettier.resolveConfig(filepath)), filepath } }
    }

    it('the check fails', async () => {
      const { prettier, options: opts } = await options()
      expect(await prettier.check(code, opts)).toBe(false)
    })

    it('formatting gives single quotes and no semicolons', async () => {
      const { prettier, options: opts } = await options()
      expect(await prettier.format(code, opts)).toBe("export const greeting = 'hello'\n")
    })
  })
})
