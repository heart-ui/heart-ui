import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Ajv } from 'ajv'
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
        'drawer',
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
        'table',
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
})
