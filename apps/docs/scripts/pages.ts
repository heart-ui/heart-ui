// Turns each registry item's `<name>.md` and demo into the docs site's Markdown pages.
// Links in the Markdown are rewritten when it renders (.vitepress/links.ts), not here.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createChecker, type ComponentMeta, type PropertyMetaSchema } from 'vue-component-meta'
import { registryDir } from '../../demo-files.ts'
import { type DocsItem, docsItems, escapeHtml, headingLines } from './items.ts'

export interface DocsPages {
  name: string
  /** `components/<name>.md`: the item's Markdown with the preview and the API section. */
  item: string
  /** `demo/<name>.md`: a bare page that mounts the demo, shown in the preview's frame. */
  demoPage: string
}

export type ApiComponent = { name: string } & Pick<ComponentMeta, 'props' | 'slots' | 'events'>

export function renderPages(registry = registryDir): DocsPages[] {
  const checker = createChecker(join(registry, 'tsconfig.json'), { schema: true })
  return docsItems(registry).map((item) => {
    const markdown = readFileSync(join(item.dir, `${item.name}.md`), 'utf8')
    const parts = componentExports(readFileSync(join(item.dir, 'index.ts'), 'utf8'))
    if (parts.length === 0) {
      throw new Error(
        `docs: ${item.name}/index.ts re-exports no component as default from a .vue file`,
      )
    }
    const components = parts.map(({ name, file }) => ({
      ...checker.getComponentMeta(join(item.dir, file)),
      name,
    }))
    return { name: item.name, item: itemPage(item, markdown, components), demoPage: demoPage(item) }
  })
}

/**
 * The components an item's `index.ts` re-exports as `export { default as X } from './X.vue'`.
 * vue-component-meta can't follow that re-export, so each file is read on its own.
 */
export function componentExports(index: string) {
  const source = index.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  return [...source.matchAll(/export\s*\{([^}]*)\}\s*from\s*'\.\/([^']+\.vue)'/g)].flatMap(
    (match) => {
      const name = /(?:^|,)\s*default\s+as\s+(\w+)\s*(?:,|$)/.exec(match[1] as string)?.[1]
      return name ? [{ name, file: match[2] as string }] : []
    },
  )
}

/** `components/index.md`: every published item, linked, with its one-line description. */
export function indexPage(items: Pick<DocsItem, 'name' | 'title' | 'dir'>[]) {
  const rows = items.map((item) => {
    const meta = JSON.parse(readFileSync(join(item.dir, 'item.json'), 'utf8')) as {
      description?: string
    }
    return `- [${escapeHtml(item.title)}](./${item.name}): ${prose(meta.description ?? '')}`
  })
  return ['---', 'title: Components', '---', '', '# Components', '', ...rows, ''].join('\n')
}

export function itemPage(
  item: Pick<DocsItem, 'name' | 'title'>,
  markdown: string,
  components: ApiComponent[],
) {
  const preview = `<DemoPreview name="${item.name}" title="${escapeHtml(item.title)}" />\n\n`
  let page = insertBefore(markdown, (text) => text.startsWith('## '), preview)
  page = insertBefore(
    page,
    (text) => /^## Props(\s*\{#[^}]*\})?\s*$/.test(text),
    `${apiSection(components)}\n`,
  )
  // JSON strings are valid YAML scalars, so any title survives the frontmatter.
  return `---\ntitle: ${JSON.stringify(item.title)}\n---\n\n${page}`
}

// Inserts `block` before the first heading outside code that `matches`, or at the end.
function insertBefore(markdown: string, matches: (heading: string) => boolean, block: string) {
  const at = headingLines(markdown).find(({ text }) => matches(text))?.offset
  return at === undefined
    ? `${markdown.trimEnd()}\n\n${block}`
    : `${markdown.slice(0, at)}${block}${markdown.slice(at)}`
}

function apiSection(components: ApiComponent[]) {
  const blocks = components.map(({ name, props, slots, events }) => {
    const own = props.filter((prop) => !prop.global)
    const parts = [`### ${name}`]
    if (own.length > 0) {
      parts.push(
        table(
          ['Prop', 'Type', 'Default', 'Description'],
          own.map((prop) => [
            code(prop.name),
            code(typeText(prop.schema, prop.type)),
            prop.default === undefined ? '' : code(quotes(prop.default)),
            prose(prop.description),
          ]),
        ),
      )
    }
    if (slots.length > 0) {
      parts.push(
        table(
          ['Slot', 'Description'],
          slots.map((slot) => [code(slot.name), prose(slot.description)]),
        ),
      )
    }
    if (events.length > 0) {
      parts.push(
        table(
          ['Event', 'Payload', 'Description'],
          events.map((event) => [code(event.name), code(event.type), prose(event.description)]),
        ),
      )
    }
    if (parts.length === 1) parts.push('No props, slots or events of its own.')
    return parts.join('\n\n')
  })
  // v-pre: VitePress compiles Markdown as a Vue template, and descriptions may hold `{{ }}`.
  return `## API\n\nGenerated from the components' types.\n\n::: v-pre\n\n${blocks.join('\n\n')}\n\n:::\n`
}

// Unions come back wrapped (`NonNullable<"sm" | "md" | null | undefined> | undefined`); the schema holds the
// members. Only a union of literals is spelled out: a named type such as `AsTag | Component` reads better as written.
function typeText(schema: PropertyMetaSchema, type: string): string {
  const members = unionMembers(schema).filter(
    (member) => member !== 'undefined' && member !== 'null',
  )
  const unique = [...new Set(members)]
  if (unique.length === 2 && unique.includes('true') && unique.includes('false')) return 'boolean'
  if (
    unique.length > 0 &&
    unique.every((member) => /^("[^"]*"|-?\d+(\.\d+)?|true|false)$/.test(member))
  ) {
    return quotes(unique.join(' | '))
  }
  return quotes(type.replace(/ \| undefined$/, ''))
}

function unionMembers(schema: PropertyMetaSchema): string[] {
  if (typeof schema === 'string') return [schema]
  if (schema.kind === 'enum' && schema.schema) return schema.schema.flatMap(unionMembers)
  return [schema.type]
}

function quotes(text: string) {
  return text.replace(/"([^"\\]*)"/g, "'$1'")
}

// A code span's fence is one backtick longer than the longest run inside it.
function code(text: string) {
  if (text === '') return ''
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length))
  const fence = '`'.repeat(longest + 1)
  const pad = text.startsWith('`') || text.endsWith('`') ? ' ' : ''
  return `${fence}${pad}${text}${pad}${fence}`
}

// JSDoc is Markdown, but raw HTML in it would reach the page's template; code spans are escaped by Markdown.
function prose(text: string) {
  return text
    .split(/(`+[^`]*?`+)/)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    )
    .join('')
}

function table(head: string[], rows: string[][]) {
  const cell = (text: string) =>
    text
      .replace(/\r?\n+/g, ' ')
      .replace(/\|/g, '\\|')
      .trim()
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ].join('\n')
}

function demoPage(item: DocsItem) {
  return [
    '---',
    'layout: false',
    'search: false',
    '---',
    '',
    '<script setup>',
    `import Demo from '@registry/ui/${item.name}/${item.demo}'`,
    '</script>',
    '',
    '<div class="tre-demo"><Demo /></div>',
    '',
  ].join('\n')
}
