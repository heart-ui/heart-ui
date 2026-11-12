import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..')

// Every folder in docs/conventions.md#repository-layout, with its package name.
const packages: Record<string, string> = {
  'apps/docs': 'docs',
  'apps/customizer': 'customizer',
  'apps/playground-vite': 'playground-vite',
  'apps/playground-nuxt': 'playground-nuxt',
  'apps/example': 'example',
  'packages/cli': 'trevui',
  'packages/mcp': '@trevui/mcp',
  'packages/theme': '@trevui/theme',
  'packages/eslint-plugin': '@trevui/eslint-plugin',
  'packages/chart-echarts': '@trevui/chart-echarts',
  benchmark: 'benchmark',
}

const folders = [
  'registry/ui',
  'registry/blocks',
  'registry/layouts',
  'registry/themes',
  'registry/lib',
  'docs',
  'tasks',
]

describe('workspace layout', () => {
  it.each(Object.entries(packages))('%s is the package %s', (dir, name) => {
    const manifest = JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8')) as {
      name: string
      license: string
    }
    expect(manifest.name).toBe(name)
    expect(manifest.license).toBe('MIT')
  })

  it.each(folders)('%s exists', (dir) => {
    expect(existsSync(join(root, dir))).toBe(true)
  })

  it('pins Node 22 in .nvmrc', () => {
    expect(readFileSync(join(root, '.nvmrc'), 'utf8').trim()).toBe('22')
  })
})
