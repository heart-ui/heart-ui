import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  root,
  schemas,
  timeout,
  readJson,
  build,
  registry,
  buildIn,
  item,
} from './registry-build.helpers.ts'

describe('registry:build', () => {
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
