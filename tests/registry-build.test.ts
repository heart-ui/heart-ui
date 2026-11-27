import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { Ajv } from 'ajv'
import { afterEach, describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..')
const schemas = join(root, 'scripts/registry-schemas')
const timeout = 60_000

function readJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

function build(args: string[] = []) {
  const result = spawnSync(process.execPath, [join(root, 'scripts/registry-build.ts'), ...args], {
    cwd: root,
    encoding: 'utf8',
  })
  if (result.error) throw result.error
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

describe('registry:build', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  // A throwaway registry holding one valid lib item plus the given files.
  function registry(files: Record<string, string>) {
    const dir = mkdtempSync(join(tmpdir(), 'heart-ui-registry-'))
    dirs.push(dir)
    cpSync(join(root, 'registry/lib/utils'), join(dir, 'registry/lib/utils'), { recursive: true })
    for (const [file, content] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, file)), { recursive: true })
      writeFileSync(join(dir, file), content)
    }
    return dir
  }

  function buildIn(dir: string) {
    return build(['--registry', join(dir, 'registry'), '--out', join(dir, 'dist')])
  }

  const item = (fields: Record<string, unknown>) =>
    JSON.stringify({
      name: 'sample',
      type: 'registry:ui',
      title: 'Sample',
      description: 'A sample.',
      files: ['Sample.vue'],
      meta: { version: '0.1.0', tier: 1 },
      ...fields,
    })

  it(
    'writes valid items and index',
    () => {
      const result = build()
      expect(result.status, result.output).toBe(0)
      const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false })
      const itemSchema = readJson(join(schemas, 'registry-item.json'))
      ajv.addSchema(itemSchema, 'https://ui.shadcn.com/schema/registry-item.json')
      const validateIndex = ajv.compile(readJson(join(schemas, 'registry.json')))
      const validateItem = ajv.getSchema('https://ui.shadcn.com/schema/registry-item.json')!

      const index = readJson(join(root, 'dist/registry/registry.json'))
      expect(validateIndex(index), JSON.stringify(validateIndex.errors)).toBe(true)
      const names = (index.items as { name: string }[]).map((entry) => entry.name).sort()
      expect(names).toEqual([
        'accordion',
        'alert',
        'avatar',
        'badge',
        'breadcrumb',
        'button',
        'card',
        'checkbox',
        'dialog',
        'dropdown-menu',
        'form-control',
        'icon',
        'input',
        'label',
        'pagination',
        'popover',
        'progress',
        'radio-group',
        'select',
        'separator',
        'skeleton',
        'switch',
        'tabs',
        'textarea',
        'toast',
        'tooltip',
        'utils',
      ])

      for (const name of names) {
        const built = readJson(join(root, `dist/registry/r/${name}.json`))
        expect(validateItem(built), JSON.stringify(validateItem.errors)).toBe(true)
        const files = built.files as { path: string; content: string }[]
        expect(files.length).toBeGreaterThan(0)
        for (const file of files) {
          expect(file.content).toBe(readFileSync(join(root, file.path), 'utf8'))
        }
      }
    },
    timeout,
  )

  it(
    'rejects an unknown item.json field',
    () => {
      const dir = registry({
        'registry/ui/sample/item.json': item({ colour: 'red' }),
        'registry/ui/sample/Sample.vue': '<template><p /></template>\n',
      })
      const result = buildIn(dir)
      expect(result.status).toBe(1)
      expect(result.output).toMatch(/sample.*colour/)
      expect(result.output).not.toMatch(/\n\s+at /)
    },
    timeout,
  )

  it.each([
    ['an unknown key', { version: '0.1.0', tier: 1, colour: 'red' }, /colour/],
    ['a version that is not semver', { version: 'latest', tier: 1 }, /version/],
  ])(
    'rejects invalid meta: %s',
    (_, meta, message) => {
      const dir = registry({
        'registry/ui/sample/item.json': item({ meta }),
        'registry/ui/sample/Sample.vue': '<template><p /></template>\n',
      })
      const result = buildIn(dir)
      expect(result.status).toBe(1)
      expect(result.output).toMatch(/sample/)
      expect(result.output).toMatch(message)
    },
    timeout,
  )

  it(
    'rejects a missing listed file',
    () => {
      const dir = registry({ 'registry/ui/sample/item.json': item({}) })
      const result = buildIn(dir)
      expect(result.status).toBe(1)
      expect(result.output).toMatch(/sample.*Sample\.vue/)
    },
    timeout,
  )

  describe('block and layout meta', () => {
    const blockMeta = {
      version: '0.1.0',
      useWhen: 'A list of customers.',
      avoidWhen: 'One record: use detail-page.',
      data: { customers: 'Customer[]' },
      states: ['empty', 'loading', 'error', 'long'],
    }
    const block = (kind: 'blocks' | 'layouts', meta: Record<string, unknown>) =>
      registry({
        [`registry/${kind}/sample/item.json`]: item({
          type: 'registry:block',
          ...(kind === 'layouts' ? { categories: ['layout'] } : {}),
          meta,
        }),
        [`registry/${kind}/sample/Sample.vue`]: '<template><p /></template>\n',
      })

    it(
      'builds a block with every required field',
      () => {
        const result = buildIn(block('blocks', blockMeta))
        expect(result.status, result.output).toBe(0)
      },
      timeout,
    )

    it.each(['useWhen', 'avoidWhen', 'data', 'states'])(
      'fails a block without %s',
      (field) => {
        const meta: Record<string, unknown> = { ...blockMeta }
        delete meta[field]
        const result = buildIn(block('blocks', meta))
        expect(result.status).toBe(1)
        expect(result.output).toMatch(new RegExp(`blocks/sample.*${field}`))
        expect(result.output).not.toMatch(/\n\s+at /)
      },
      timeout,
    )

    it(
      'fails a layout without regions, and builds one with them',
      () => {
        const without = buildIn(block('layouts', blockMeta))
        expect(without.status).toBe(1)
        expect(without.output).toMatch(/layouts\/sample.*regions/)
        const withRegions = buildIn(
          block('layouts', { ...blockMeta, regions: { main: 'The list' } }),
        )
        expect(withRegions.status, withRegions.output).toBe(0)
      },
      timeout,
    )

    it(
      'keeps ui and lib items to version only',
      () => {
        const result = buildIn(
          registry({
            'registry/ui/sample/item.json': item({ meta: { version: '0.1.0' } }),
            'registry/ui/sample/Sample.vue': '<template><p /></template>\n',
          }),
        )
        expect(result.status, result.output).toBe(0)
      },
      timeout,
    )
  })

  it.each(['blocks', 'layouts'])(
    'skips a demo-support folder under %s',
    (kind) => {
      const dir = registry({
        [`registry/${kind}/_fixtures/index.ts`]: 'export const rows = [1, 2, 3]\n',
        [`registry/${kind}/_fixtures/DemoStates.vue`]: '<template><p /></template>\n',
      })
      const result = buildIn(dir)
      expect(result.status, result.output).toBe(0)
      const index = readJson(join(dir, 'dist/registry.json'))
      expect((index.items as { name: string }[]).map((entry) => entry.name)).toEqual(['utils'])
    },
    timeout,
  )

  it(
    'still fails on a stray _ file beside the blocks',
    () => {
      const dir = registry({ 'registry/blocks/_notes.ts': 'export const notes = 1\n' })
      const result = buildIn(dir)
      expect(result.status).toBe(1)
      expect(result.output).toMatch(/blocks\/_notes\.ts.*item folder/)
    },
    timeout,
  )

  describe('fixture folders', () => {
    it(
      'skips a folder with only demos, tests and docs',
      () => {
        const dir = registry({
          'registry/ui/placeholder/Placeholder.demo.vue': '<template><p /></template>\n',
          'registry/ui/placeholder/placeholder.md': '# Placeholder\n',
        })
        const result = buildIn(dir)
        expect(result.status, result.output).toBe(0)
        const index = readJson(join(dir, 'dist/registry.json'))
        expect((index.items as { name: string }[]).map((entry) => entry.name)).toEqual(['utils'])
      },
      timeout,
    )

    it(
      'fails on source without an item.json',
      () => {
        const dir = registry({ 'registry/ui/sample/Sample.vue': '<template><p /></template>\n' })
        const result = buildIn(dir)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/sample.*item\.json/)
      },
      timeout,
    )
  })

  describe('rejects unsafe or inconsistent items', () => {
    const vue = '<template><p /></template>\n'
    it.each([
      [
        'a file outside the item folder',
        { 'registry/ui/sample/item.json': item({ files: ['../../lib/utils/utils.ts'] }) },
        /ui\/sample.*outside/,
      ],
      [
        'a listed folder',
        {
          'registry/ui/sample/item.json': item({ files: ['parts'] }),
          'registry/ui/sample/parts/Part.vue': vue,
        },
        /ui\/sample.*parts.*not a file/,
      ],
      [
        'an empty files list',
        { 'registry/ui/sample/item.json': item({ files: [] }) },
        /ui\/sample.*files/,
      ],
      [
        'a type that does not match the folder',
        {
          'registry/ui/sample/item.json': item({ type: 'registry:theme' }),
          'registry/ui/sample/Sample.vue': vue,
        },
        /ui\/sample.*registry:ui/,
      ],
      [
        'a layout without the layout category',
        {
          'registry/layouts/shell/item.json': item({
            name: 'shell',
            type: 'registry:block',
            files: ['Shell.vue'],
          }),
          'registry/layouts/shell/Shell.vue': vue,
        },
        /layouts\/shell.*layout/,
      ],
      [
        'an unknown registry dependency',
        {
          'registry/ui/sample/item.json': item({ registryDependencies: ['util'] }),
          'registry/ui/sample/Sample.vue': vue,
        },
        /ui\/sample.*util/,
      ],
      [
        'a lib folder with only docs',
        { 'registry/lib/notes/notes.md': '# Notes\n' },
        /lib\/notes.*item\.json/,
      ],
    ])(
      'rejects %s',
      (_, files, message) => {
        const result = buildIn(registry(files))
        expect(result.status).toBe(1)
        expect(result.output).toMatch(message)
        expect(result.output).not.toMatch(/\n\s+at /)
      },
      timeout,
    )

    it(
      'accepts $schema in item.json',
      () => {
        const dir = registry({
          'registry/ui/sample/item.json': item({
            $schema: 'https://ui.shadcn.com/schema/registry-item.json',
          }),
          'registry/ui/sample/Sample.vue': vue,
        })
        const result = buildIn(dir)
        expect(result.status, result.output).toBe(0)
      },
      timeout,
    )

    it(
      'skips fixture folders holding .DS_Store or nested .gitkeep',
      () => {
        const dir = registry({
          'registry/ui/placeholder/Placeholder.demo.vue': vue,
          'registry/ui/placeholder/.DS_Store': '',
          'registry/ui/placeholder/sub/.gitkeep': '',
          'registry/ui/placeholder/.history/Old.vue': vue,
        })
        const result = buildIn(dir)
        expect(result.status, result.output).toBe(0)
      },
      timeout,
    )
  })

  describe('output location', () => {
    it.each([
      ['the registry itself', (dir: string) => join(dir, 'registry')],
      ['a folder holding the registry', (dir: string) => dir],
    ])(
      'refuses to write over %s',
      (_, out) => {
        const dir = registry({})
        const result = build(['--registry', join(dir, 'registry'), '--out', out(dir)])
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/--out/)
        expect(existsSync(join(dir, 'registry/lib/utils/utils.ts'))).toBe(true)
      },
      timeout,
    )

    it(
      'rejects a flag with no value',
      () => {
        const result = build(['--out', '--registry', 'registry'])
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/--out needs a value/)
      },
      timeout,
    )

    it(
      'writes paths from registry/ whatever --registry spelling',
      () => {
        const dir = registry({})
        const result = spawnSync(
          process.execPath,
          [join(root, 'scripts/registry-build.ts'), '--registry', '.', '--out', '../dist'],
          { cwd: join(dir, 'registry'), encoding: 'utf8' },
        )
        expect(result.status, `${result.stdout}${result.stderr}`).toBe(0)
        const built = readJson(join(dir, 'dist/r/utils.json'))
        expect((built.files as { path: string }[])[0]!.path).toBe('registry/lib/utils/utils.ts')
      },
      timeout,
    )
  })

  describe('never deletes what it did not build', () => {
    it(
      'refuses a non-empty folder that is not a previous build',
      () => {
        const dir = registry({ 'keep/notes.txt': 'keep me\n' })
        const result = build(['--registry', join(dir, 'registry'), '--out', join(dir, 'keep')])
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/--out/)
        expect(readFileSync(join(dir, 'keep/notes.txt'), 'utf8')).toBe('keep me\n')
      },
      timeout,
    )

    it(
      'never writes into the registry through a case variant of its path',
      () => {
        const dir = registry({})
        const out = join(dir, 'REGISTRY/out')
        // On a case-sensitive disk REGISTRY is another folder, and writing there is fine.
        const sameFolder = existsSync(join(dir, 'REGISTRY'))
        const result = build(['--registry', join(dir, 'registry'), '--out', out])
        expect(existsSync(join(dir, 'registry/out'))).toBe(false)
        if (sameFolder) expect(result.output).toMatch(/overlaps the registry/)
        else expect(result.status, result.output).toBe(0)
      },
      timeout,
    )

    it(
      'refuses a folder shaped like a build that it did not write',
      () => {
        const dir = registry({ 'dist/registry.json': '{}\n', 'dist/r/mine.json': '{}\n' })
        const result = buildIn(dir)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/--out/)
        expect(readFileSync(join(dir, 'dist/r/mine.json'), 'utf8')).toBe('{}\n')
      },
      timeout,
    )

    it(
      'keeps files it did not write when rebuilding',
      () => {
        const dir = registry({})
        expect(buildIn(dir).status).toBe(0)
        writeFileSync(join(dir, 'dist/.DS_Store'), '')
        writeFileSync(join(dir, 'dist/r/notes.txt'), 'keep me\n')
        const result = buildIn(dir)
        expect(result.status, result.output).toBe(0)
        expect(readFileSync(join(dir, 'dist/r/notes.txt'), 'utf8')).toBe('keep me\n')
        expect(existsSync(join(dir, 'dist/r/utils.json'))).toBe(true)
      },
      timeout,
    )

    it(
      'refuses to overwrite a file it did not write',
      () => {
        const dir = registry({})
        expect(buildIn(dir).status).toBe(0)
        writeFileSync(join(dir, 'dist/r/sample.json'), 'mine\n')
        mkdirSync(join(dir, 'registry/ui/sample'), { recursive: true })
        writeFileSync(join(dir, 'registry/ui/sample/item.json'), item({}))
        writeFileSync(join(dir, 'registry/ui/sample/Sample.vue'), '<template><p /></template>\n')
        const result = buildIn(dir)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/r\/sample\.json/)
        expect(readFileSync(join(dir, 'dist/r/sample.json'), 'utf8')).toBe('mine\n')
      },
      timeout,
    )

    it(
      'keeps the previous build when a rebuild is refused',
      () => {
        const dir = registry({})
        expect(buildIn(dir).status).toBe(0)
        writeFileSync(join(dir, 'dist/r/sample.json'), 'mine\n')
        mkdirSync(join(dir, 'registry/ui/sample'), { recursive: true })
        writeFileSync(join(dir, 'registry/ui/sample/item.json'), item({}))
        writeFileSync(join(dir, 'registry/ui/sample/Sample.vue'), '<template><p /></template>\n')
        expect(buildIn(dir).status).toBe(1)
        expect(existsSync(join(dir, 'dist/registry.json'))).toBe(true)
        expect(existsSync(join(dir, 'dist/r/utils.json'))).toBe(true)
      },
      timeout,
    )

    it(
      'names the marker when it holds null',
      () => {
        const dir = registry({ 'dist/.heart-ui-registry-build.json': 'null\n' })
        const result = buildIn(dir)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/--out.*\.heart-ui-registry-build\.json/)
        expect(result.output).not.toMatch(/TypeError/)
      },
      timeout,
    )

    it(
      'refuses a file given as --out without a stack trace',
      () => {
        const dir = registry({ 'out.txt': 'keep me\n' })
        const result = build(['--registry', join(dir, 'registry'), '--out', join(dir, 'out.txt')])
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/--out.*not a folder/)
        expect(result.output).not.toMatch(/\n\s+at /)
      },
      timeout,
    )

    it(
      'replaces a previous build in place',
      () => {
        const dir = registry({})
        const out = join(dir, 'dist')
        expect(buildIn(dir).status).toBe(0)
        const result = buildIn(dir)
        expect(result.status, result.output).toBe(0)
        expect(existsSync(join(out, 'r/utils.json'))).toBe(true)
      },
      timeout,
    )
  })

  describe('more inputs it rejects', () => {
    const vue = '<template><p /></template>\n'
    it.each([
      ['a registry folder that does not exist', {}, ['--registry', 'registy'], /registy/],
      [
        'a scoped dependency on a missing item of its own scope',
        {
          'registry/ui/sample/item.json': item({ registryDependencies: ['@heart-ui/utl'] }),
          'registry/ui/sample/Sample.vue': vue,
        },
        [],
        /ui\/sample.*@heart-ui\/utl/,
      ],
      [
        'an npm dependency without a pinned version',
        {
          'registry/ui/sample/item.json': item({ dependencies: ['reka-ui'] }),
          'registry/ui/sample/Sample.vue': vue,
        },
        [],
        /ui\/sample.*reka-ui.*version/,
      ],
      [
        'an npm dependency pinned to another version than the repo tests',
        {
          'registry/ui/sample/item.json': item({ dependencies: ['reka-ui@1.0.0'] }),
          'registry/ui/sample/Sample.vue': vue,
        },
        [],
        /ui\/sample.*reka-ui@1\.0\.0/,
      ],
      [
        'a bare parent-folder import',
        {
          'registry/ui/sample/item.json': item({}),
          'registry/ui/sample/Sample.vue':
            '<script setup lang="ts">\nimport { cn } from \'..\'\n</script>\n',
        },
        [],
        /ui\/sample.*Sample\.vue.*@\/lib/,
      ],
      [
        'a template-literal import that leaves the item folder',
        {
          'registry/ui/sample/item.json': item({}),
          'registry/ui/sample/Sample.vue':
            '<script setup lang="ts">\nconst x = import(`../../lib/icon`)\n</script>\n',
        },
        [],
        /ui\/sample.*Sample\.vue.*@\/lib/,
      ],
      [
        'a relative import that leaves the item folder',
        {
          'registry/ui/sample/item.json': item({}),
          'registry/ui/sample/Sample.vue':
            '<script setup lang="ts">\nimport { cn } from \'../../lib/utils/utils\'\n</script>\n',
        },
        [],
        /ui\/sample.*Sample\.vue.*@\/lib/,
      ],
      [
        'a dependency that is neither a name, a scoped name nor a URL',
        {
          'registry/ui/sample/item.json': item({ registryDependencies: ['ui/button'] }),
          'registry/ui/sample/Sample.vue': vue,
        },
        [],
        /ui\/sample.*ui\/button/,
      ],
      [
        'a loose file under a kind folder',
        { 'registry/ui/Button.vue': vue },
        [],
        /ui\/Button\.vue/,
      ],
      [
        'item.json listed as a file',
        {
          'registry/ui/sample/item.json': item({ files: ['Sample.vue', 'item.json'] }),
          'registry/ui/sample/Sample.vue': vue,
        },
        [],
        /ui\/sample.*item\.json/,
      ],
      [
        'the same file listed twice',
        {
          'registry/ui/sample/item.json': item({ files: ['Sample.vue', './Sample.vue'] }),
          'registry/ui/sample/Sample.vue': vue,
        },
        [],
        /ui\/sample.*twice/,
      ],
      [
        'a $schema other than the item schema',
        {
          'registry/ui/sample/item.json': item({ $schema: 'https://example.com/other.json' }),
          'registry/ui/sample/Sample.vue': vue,
        },
        [],
        /ui\/sample.*\$schema/,
      ],
      [
        'meta that belongs to another kind',
        {
          'registry/lib/extra/item.json': item({
            name: 'extra',
            type: 'registry:lib',
            files: ['extra.ts'],
            meta: { version: '0.1.0', tier: 1 },
          }),
          'registry/lib/extra/extra.ts': 'export {}\n',
        },
        [],
        /lib\/extra.*tier/,
      ],
    ])(
      'rejects %s',
      (_, files, extra: string[], message) => {
        const dir = registry(files)
        const args = ['--registry', join(dir, 'registry'), '--out', join(dir, 'dist')]
        const at = extra.indexOf('--registry')
        if (at !== -1) args[1] = join(dir, extra[at + 1]!)
        const result = build(args)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(message)
      },
      timeout,
    )

    it(
      'does not mistake Array.from with a dotted string for an import',
      () => {
        const dir = registry({
          'registry/ui/sample/item.json': item({}),
          'registry/ui/sample/Sample.vue':
            '<script setup lang="ts">\nconst parts = Array.from(\'..\')\n</script>\n',
        })
        const result = buildIn(dir)
        expect(result.status, result.output).toBe(0)
      },
      timeout,
    )

    it(
      'rejects a symlinked file that points outside the item',
      () => {
        const dir = registry({ 'registry/ui/sample/item.json': item({}) })
        symlinkSync(
          join(dir, 'registry/lib/utils/utils.ts'),
          join(dir, 'registry/ui/sample/Sample.vue'),
        )
        const result = buildIn(dir)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/ui\/sample.*Sample\.vue/)
      },
      timeout,
    )

    it(
      'names the item when a listed file cannot be read',
      () => {
        const dir = registry({
          'registry/ui/sample/item.json': item({}),
          'registry/ui/sample/Sample.vue': vue,
        })
        chmodSync(join(dir, 'registry/ui/sample/Sample.vue'), 0o000)
        const result = buildIn(dir)
        chmodSync(join(dir, 'registry/ui/sample/Sample.vue'), 0o644)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/ui\/sample.*Sample\.vue.*cannot be read/)
      },
      timeout,
    )

    it(
      'accepts other scopes, URLs, dot-folders and writes its own $schema',
      () => {
        const dir = registry({
          'registry/ui/sample/item.json': item({
            $schema: 'https://ui.shadcn.com/schema/registry-item.json',
            registryDependencies: ['utils', '@acme/thing', 'https://example.com/r/x.json'],
          }),
          'registry/ui/sample/Sample.vue': vue,
          'registry/ui/.history/Old.vue': vue,
        })
        const result = buildIn(dir)
        expect(result.status, result.output).toBe(0)
        const built = readJson(join(dir, 'dist/r/sample.json'))
        expect(built.$schema).toBe('https://ui.shadcn.com/schema/registry-item.json')
      },
      timeout,
    )

    it(
      'builds when started through a symlinked path',
      () => {
        const dir = registry({})
        symlinkSync(join(root, 'scripts'), join(dir, 'scripts-link'))
        const result = spawnSync(
          process.execPath,
          [
            join(dir, 'scripts-link/registry-build.ts'),
            '--registry',
            join(dir, 'registry'),
            '--out',
            join(dir, 'dist'),
          ],
          { encoding: 'utf8' },
        )
        expect(result.status, `${result.stdout}${result.stderr}`).toBe(0)
        expect(existsSync(join(dir, 'dist/r/utils.json'))).toBe(true)
      },
      timeout,
    )
  })

  describe('names, flags and unlisted files', () => {
    const vue = '<template><p /></template>\n'

    it.each([
      ['an uppercase item name', 'registry/ui/Sample', /ui\/Sample.*lowercase/],
      ['an item name with a space', 'registry/ui/my sample', /ui\/my sample.*lowercase/],
    ])(
      'rejects %s',
      (_, folder, message) => {
        const name = folder.split('/').pop()!
        const dir = registry({
          [`${folder}/item.json`]: item({ name }),
          [`${folder}/Sample.vue`]: vue,
        })
        const result = buildIn(dir)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(message)
      },
      timeout,
    )

    it(
      'rejects a source file the item does not list',
      () => {
        const dir = registry({
          'registry/ui/sample/item.json': item({}),
          'registry/ui/sample/Sample.vue': vue,
          'registry/ui/sample/SampleItem.vue': vue,
          'registry/ui/sample/Sample.demo.vue': vue,
        })
        const result = buildIn(dir)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/ui\/sample.*SampleItem\.vue/)
        expect(result.output).not.toMatch(/Sample\.demo\.vue/)
      },
      timeout,
    )

    it(
      'rejects an unknown top-level folder and skips themes',
      () => {
        const dir = registry({ 'registry/block/hero/item.json': '{}\n' })
        const result = buildIn(dir)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/registry\/block\b/)
        const ok = registry({
          'registry/themes/ocean.json': '{}\n',
          'registry/tsconfig.json': '{}\n',
        })
        expect(buildIn(ok).status).toBe(0)
      },
      timeout,
    )

    it.each([
      ['an unknown flag', ['--ouT', 'x']],
      ['the --flag=value form', ['--out=x']],
      ['a stray argument', ['extra']],
    ])(
      'rejects %s and builds nothing',
      (_, args) => {
        const dir = registry({})
        const result = spawnSync(
          process.execPath,
          [join(root, 'scripts/registry-build.ts'), '--registry', join(dir, 'registry'), ...args],
          { cwd: dir, encoding: 'utf8' },
        )
        expect(result.status).toBe(1)
        expect(`${result.stdout}${result.stderr}`).toMatch(/argument/)
        expect(existsSync(join(dir, 'x'))).toBe(false)
      },
      timeout,
    )
  })

  describe('links, case and odd names', () => {
    const vue = '<template><p /></template>\n'
    const sample = {
      'elsewhere/ui/sample/item.json': item({}),
      'elsewhere/ui/sample/Sample.vue': vue,
    }

    it(
      'builds from a symlinked --registry',
      () => {
        const dir = registry({})
        symlinkSync(join(dir, 'registry'), join(dir, 'registry-link'))
        const result = build(['--registry', join(dir, 'registry-link'), '--out', join(dir, 'dist')])
        expect(result.status, result.output).toBe(0)
      },
      timeout,
    )

    it(
      'writes registry/ paths for an item under a symlinked kind folder',
      () => {
        const dir = registry(sample)
        symlinkSync(join(dir, 'elsewhere/ui'), join(dir, 'registry/ui'))
        const result = buildIn(dir)
        expect(result.status, result.output).toBe(0)
        const built = readJson(join(dir, 'dist/r/sample.json'))
        expect((built.files as { path: string }[])[0]!.path).toBe('registry/ui/sample/Sample.vue')
      },
      timeout,
    )

    it.each([
      ['a file listed in another case', ['sample.vue'], /ui\/sample.*sample\.vue/],
      ['the same file twice in two cases', ['Sample.vue', 'sample.vue'], /ui\/sample.*sample\.vue/],
    ])(
      'rejects %s',
      (_, files, message) => {
        const dir = registry({
          'registry/ui/sample/item.json': item({ files }),
          'registry/ui/sample/Sample.vue': vue,
        })
        const result = buildIn(dir)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(message)
      },
      timeout,
    )

    it(
      'rejects a file listed through a symlinked folder inside the item',
      () => {
        const dir = registry({
          'registry/ui/sample/item.json': item({ files: ['parts/Part.vue'] }),
          'registry/ui/sample/real/Part.vue': vue,
        })
        symlinkSync(join(dir, 'registry/ui/sample/real'), join(dir, 'registry/ui/sample/parts'))
        const result = buildIn(dir)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/ui\/sample.*parts\/Part\.vue/)
      },
      timeout,
    )

    it(
      'accepts underscore names and files whose names start with two dots',
      () => {
        const dir = registry({
          'registry/lib/my_utils/item.json': item({
            name: 'my_utils',
            type: 'registry:lib',
            files: ['..helpers.ts'],
            meta: { version: '0.1.0' },
          }),
          'registry/lib/my_utils/..helpers.ts': 'export {}\n',
          'registry/ui/sample/item.json': item({ registryDependencies: ['my_utils'] }),
          'registry/ui/sample/Sample.vue': vue,
        })
        const result = buildIn(dir)
        expect(result.status, result.output).toBe(0)
      },
      timeout,
    )

    it(
      'names the folder when a fixture folder cannot be read',
      () => {
        const dir = registry({ 'registry/ui/placeholder/sub/Thing.demo.vue': vue })
        chmodSync(join(dir, 'registry/ui/placeholder/sub'), 0o000)
        const result = buildIn(dir)
        chmodSync(join(dir, 'registry/ui/placeholder/sub'), 0o755)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/ui\/placeholder.*cannot be read/)
        expect(result.output).not.toMatch(/\n\s+at /)
      },
      timeout,
    )

    it(
      'builds an item whose folder is a symlink',
      () => {
        const dir = registry(sample)
        symlinkSync(join(dir, 'elsewhere/ui/sample'), join(dir, 'registry/lib/sample'))
        writeFileSync(
          join(dir, 'elsewhere/ui/sample/item.json'),
          item({ type: 'registry:lib', meta: { version: '0.1.0' } }),
        )
        const result = buildIn(dir)
        expect(result.status, result.output).toBe(0)
        const built = readJson(join(dir, 'dist/r/sample.json'))
        expect((built.files as { path: string }[])[0]!.path).toBe('registry/lib/sample/Sample.vue')
      },
      timeout,
    )

    it(
      'names a broken link instead of failing raw',
      () => {
        const dir = registry({})
        symlinkSync(join(dir, 'nowhere'), join(dir, 'registry/lib/old'))
        const result = buildIn(dir)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/lib\/old.*broken link/)
        expect(result.output).not.toMatch(/failed: Error/)
      },
      timeout,
    )

    it(
      'names the kind folder when it is a file',
      () => {
        const dir = registry({ 'registry/ui': 'not a folder\n' })
        const result = buildIn(dir)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/registry\/ui.*not a folder/)
        expect(result.output).not.toMatch(/\n\s+at /)
      },
      timeout,
    )

    it(
      'says an empty folder has no item.json, not that it has source',
      () => {
        const dir = registry({})
        mkdirSync(join(dir, 'registry/lib/empty'))
        const result = buildIn(dir)
        expect(result.status).toBe(1)
        expect(result.output).toMatch(/lib\/empty.*no item\.json/)
        expect(result.output).not.toMatch(/source files/)
      },
      timeout,
    )
  })

  it('upstream schema copy names its source and fetch date', () => {
    const readme = readFileSync(join(schemas, 'README.md'), 'utf8')
    expect(readme).toContain('https://ui.shadcn.com/schema/registry-item.json')
    expect(readme).toContain('https://ui.shadcn.com/schema/registry.json')
    expect(readme).toMatch(/Fetched: \d{4}-\d{2}-\d{2}/)
    expect(readJson(join(schemas, 'registry-item.json')).$schema).toMatch(/json-schema\.org/)
  })
})
