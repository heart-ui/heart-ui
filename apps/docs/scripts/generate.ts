// Writes the generated pages: components/index.md, components/<name>.md and demo/<name>.md. Usage: node scripts/generate.ts
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { docsItems } from './items.ts'
import { indexPage, renderPages } from './pages.ts'

const docs = join(import.meta.dirname, '..')
const pages = renderPages()
for (const folder of ['components', 'demo']) {
  rmSync(join(docs, folder), { recursive: true, force: true })
  mkdirSync(join(docs, folder))
}
writeFileSync(join(docs, 'components', 'index.md'), indexPage(docsItems()))
for (const page of pages) {
  writeFileSync(join(docs, 'components', `${page.name}.md`), page.item)
  writeFileSync(join(docs, 'demo', `${page.name}.md`), page.demoPage)
}
