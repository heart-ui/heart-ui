// What the landing page states about the library, read from the repo at build time so it matches what ships:
// the theme presets, the CLI's version and the audit checklist.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineLoader } from 'vitepress'

const repo = join(import.meta.dirname, '../../../..')
const read = (...path: string[]) => readFileSync(join(repo, ...path), 'utf8')

export interface LandingData {
  version: string
  themes: { name: string; primary: string; radius: number; density: string; shadow: string }[]
  checks: { id: string; text: string }[]
}

declare const data: LandingData
export { data }

/** The rows of the audit checklist table in docs/agent-support.md, with code spans kept as text. */
function checks() {
  const doc = read('docs/agent-support.md')
  const rows = [...doc.matchAll(/^\| `(A\d+)` \| (.+?) \|$/gm)].map(([, id, text]) => ({
    id: id as string,
    text: (text as string).replaceAll('`', ''),
  }))
  if (rows.length === 0) throw new Error('landing: no audit checks in docs/agent-support.md')
  return rows
}

export default defineLoader({
  watch: [
    '../../../../registry/themes/*.json',
    '../../../../packages/cli/package.json',
    '../../../../docs/agent-support.md',
  ],
  load(): LandingData {
    const themesDir = join(repo, 'registry/themes')
    const themes = readdirSync(themesDir)
      .filter((file) => file.endsWith('.json'))
      .map(
        (file) =>
          JSON.parse(readFileSync(join(themesDir, file), 'utf8')) as LandingData['themes'][number],
      )
      // The default preset first, the rest by name.
      .sort(
        (a, b) =>
          Number(b.name === 'default') - Number(a.name === 'default') ||
          a.name.localeCompare(b.name),
      )
      .map(({ name, primary, radius, density, shadow }) => ({
        name,
        primary,
        radius,
        density,
        shadow,
      }))
    return {
      version: (JSON.parse(read('packages/cli/package.json')) as { version: string }).version,
      themes,
      checks: checks(),
    }
  },
})
