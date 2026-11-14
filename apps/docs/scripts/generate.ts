// Writes the generated pages: components/index.md, components/<name>.md, demo/<name>.md and
// guide/<name>.md (copied from docs/). Usage: node scripts/generate.ts
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { docsItems, guides } from './items.ts'
import { guidePage, indexPage, renderPages } from './pages.ts'

const docs = join(import.meta.dirname, '..')
const repo = join(docs, '../..')
const pages = renderPages()
for (const folder of ['components', 'demo', 'guide']) {
  rmSync(join(docs, folder), { recursive: true, force: true })
  mkdirSync(join(docs, folder))
}
writeFileSync(join(docs, 'components', 'index.md'), indexPage(docsItems()))
for (const page of pages) {
  writeFileSync(join(docs, 'components', `${page.name}.md`), page.item)
  writeFileSync(join(docs, 'demo', `${page.name}.md`), page.demoPage)
}
for (const name of guides) {
  const source = readFileSync(join(repo, 'docs', `${name}.md`), 'utf8')
  writeFileSync(join(docs, 'guide', `${name}.md`), guidePage(source))
}
