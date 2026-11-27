import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  root,
  timeout,
  readJson,
  build,
  registry,
  buildIn,
  item,
} from './registry-build.helpers.ts'

describe('registry:build', () => {
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
})
