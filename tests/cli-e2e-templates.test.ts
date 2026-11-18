import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The end-to-end templates stand for users' apps; they must use the framework versions the
// playgrounds test, or the gate proves items against versions the repo no longer checks.
const root = join(import.meta.dirname, '..')
type Manifest = {
  packageManager?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}
const manifest = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8')) as Manifest
const versions = (path: string) => {
  const { dependencies = {}, devDependencies = {} } = manifest(path)
  return { ...devDependencies, ...dependencies }
}

describe('AC-001 end-to-end templates follow the playgrounds', () => {
  it.each([
    ['vite', 'apps/playground-vite/package.json'],
    ['nuxt', 'apps/playground-nuxt/package.json'],
  ])('the %s template pins what its playground pins', (template, playground) => {
    const pinned = versions(playground)
    const used = versions(`tests/cli-e2e/templates/${template}/package.json`)
    for (const [name, version] of Object.entries(used)) {
      const expected = name === 'typescript' ? versions('package.json').typescript : pinned[name]
      expect(version, name).toBe(expected)
    }
    expect(manifest(`tests/cli-e2e/templates/${template}/package.json`).packageManager).toBe(
      manifest('package.json').packageManager,
    )
  })
})
