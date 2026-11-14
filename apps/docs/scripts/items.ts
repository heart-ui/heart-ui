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

/** A generated page: its source in the repo, its file under apps/docs and its URL on the site. */
export interface SitePage {
  source: string
  file: string
  url: string
}

/** Repo docs published as guide pages (`docs/<name>.md` → `/guide/<name>`). */
export const guides = ['layout-rules', 'tokens'] as const

/** Every page generated from a source in the repo: each item, then each guide. */
export function sitePages(items = docsItems()): SitePage[] {
  return [
    ...items.map(({ name }) => ({
      source: `registry/ui/${name}/${name}.md`,
      file: `components/${name}.md`,
      url: `/components/${name}`,
    })),
    ...guides.map((name) => ({
      source: `docs/${name}.md`,
      file: `guide/${name}.md`,
      url: `/guide/${name}`,
    })),
  ]
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
  return headingLines(markdown).find((heading) => heading.level === 1)?.title
}

/** Every line with its character offset, and whether it sits inside fenced code (fences included). */
export function markdownLines(markdown: string) {
  const lines: { text: string; offset: number; code: boolean }[] = []
  let fence: string | undefined
  let offset = 0
  for (const text of markdown.split('\n')) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(text)?.[1]
    const opens = !fence && marker !== undefined
    // A closing fence carries no info string: "```vue" inside a "````" block is content.
    const closes =
      fence !== undefined &&
      marker !== undefined &&
      marker[0] === fence[0] &&
      marker.length >= fence.length &&
      /^ {0,3}(`+|~+)\s*$/.test(text)
    lines.push({ text, offset, code: fence !== undefined || opens })
    if (opens) fence = marker
    else if (closes) fence = undefined
    offset += text.length + 1
  }
  return lines
}

/**
 * ATX headings outside fenced code: offset, level, and the title without indent, closing `#`s or `{#id}`.
 * Pass `lines` from markdownLines to reuse them.
 */
export function headingLines(markdown: string, lines = markdownLines(markdown)) {
  return lines.flatMap((line) => {
    const match = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/.exec(line.text)
    if (line.code || !match) return []
    const title = (match[2] ?? '').replace(/\s*\{#[^}]*\}$/, '').trim()
    return [{ ...line, level: (match[1] as string).length, title }]
  })
}

/** Escapes text for a place that VitePress renders as HTML, such as a sidebar label. */
export function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
