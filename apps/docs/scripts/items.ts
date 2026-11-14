// The registry items the docs site publishes. Kept free of the type checker so the site config loads fast.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { demoFiles, registryDir } from '../../demo-files.ts'

export interface DocsItem {
  name: string
  /** The Markdown's `# ` heading, without a `{#id}` suffix. */
  title: string
  dir: string
  demo: string
}

/** The `ui` items that have both a `<name>.md` and a `*.demo.vue`. */
export function docsItems(registry = registryDir): DocsItem[] {
  return demoFiles(registry)
    .filter((entry) => entry.kind === 'ui')
    .flatMap(({ name }) => {
      const dir = join(registry, 'ui', name)
      const files = readdirSync(dir)
      const demo = files.find((file) => file.endsWith('.demo.vue'))
      if (!demo || !files.includes(`${name}.md`)) return []
      const markdown = readFileSync(join(dir, `${name}.md`), 'utf8')
      return [{ name, title: markdownTitle(markdown) ?? name, dir, demo }]
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function markdownTitle(markdown: string) {
  const line = headingLines(markdown).find(({ text }) => text.startsWith('# '))
  return line?.text
    .slice(2)
    .replace(/\s*\{#[^}]*\}\s*$/, '')
    .trim()
}

/** ATX heading lines outside fenced code, with their character offsets. */
export function headingLines(markdown: string) {
  const headings: { text: string; offset: number }[] = []
  let fence: string | undefined
  let offset = 0
  for (const line of markdown.split('\n')) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1]
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = undefined
    } else if (marker) {
      fence = marker
    } else if (/^#{1,6} /.test(line)) {
      headings.push({ text: line, offset })
    }
    offset += line.length + 1
  }
  return headings
}

/** Escapes text for a place that VitePress renders as HTML, such as a sidebar label. */
export function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
