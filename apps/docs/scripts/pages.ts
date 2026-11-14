// Turns each registry item's `<name>.md` and demo into the docs site's Markdown pages.
// Links in the Markdown are rewritten when it renders (.vitepress/links.ts), not here.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createChecker, type ComponentMeta, type PropertyMetaSchema } from 'vue-component-meta'
import { registryDir } from '../../demo-files.ts'
import { type DocsItem, docsItems, escapeHtml, headingLines, markdownLines } from './items.ts'

export interface DocsPages {
  name: string
  /** `components/<name>.md`: the item's Markdown with the preview and merged API tables. */
  item: string
  /** `demo/<name>.md`: a bare page that mounts the demo, shown in the preview's frame. */
  demoPage: string
}

export type ApiComponent = { name: string } & Pick<ComponentMeta, 'props' | 'slots' | 'events'>

/** Every item's pages. Throws once, listing the drift in every item, when a spec and its types disagree. */
export function renderPages(registry = registryDir): DocsPages[] {
  const checker = createChecker(join(registry, 'tsconfig.json'), { schema: true })
  const drift: string[] = []
  const pages = docsItems(registry).map((item) => {
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
    const built = buildItemPage(item, markdown, components)
    drift.push(...built.drift)
    return { name: item.name, item: built.page, demoPage: demoPage(item) }
  })
  if (drift.length > 0) throw driftError(drift)
  return pages
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

/** `guide/<name>.md`: a repo doc as written. v-pre, because VitePress compiles Markdown as a Vue template. */
export function guidePage(markdown: string) {
  const frontmatter = /^---\n[\s\S]*?\n---\n/.exec(markdown)?.[0] ?? ''
  const body = markdown.slice(frontmatter.length).trimEnd()
  // A container closes at a marker at least as long as its own, so outrun every `:::` in the body.
  const longest = Math.max(
    2,
    ...(body.match(/^ {0,3}:{3,}/gm) ?? []).map((run) => run.trim().length),
  )
  const marker = ':'.repeat(longest + 1)
  return `${frontmatter}${frontmatter ? '\n' : ''}${marker} v-pre\n\n${body}\n\n${marker}\n`
}

/**
 * The item's Markdown with the live preview before its first section, and each Props, Slots and Events table
 * merged with the types: names, types, defaults and payloads from the code, notes from the spec (JSDoc when
 * the spec has none). Throws, naming each difference, when the spec and the types disagree.
 */
export function itemPage(
  item: Pick<DocsItem, 'name' | 'title'>,
  markdown: string,
  components: ApiComponent[],
) {
  const { page, drift } = buildItemPage(item, markdown, components)
  if (drift.length > 0) throw driftError(drift)
  return page
}

function driftError(drift: string[]) {
  const lines = drift.map((line) => `- ${line}`).join('\n')
  return new Error(`docs: item specs and component types disagree:\n${lines}`)
}

function buildItemPage(
  item: Pick<DocsItem, 'name' | 'title'>,
  markdown: string,
  components: ApiComponent[],
) {
  const found: { section: Section; text: string }[] = []
  const label = (part: string, name: string) =>
    components.length > 1 ? `\`${part}\` \`${name}\`` : `\`${name}\``
  const tables = specTables(markdown)
  const merged = new Map<SpecTable, string>()
  for (const section of sections) {
    const report = (text: string) => found.push({ section, text })
    const members = typeMembers(section, components)
    const ofSection = tables.filter((table) => table.section === section)
    // One section may be split over several tables; each member must appear in one of them.
    const matched = new Set<Member>()
    const seen = new Set<string>()
    for (const table of ofSection) {
      merged.set(
        table,
        mergeTable(item.name, table, components, members, { matched, seen, label, report }),
      )
    }
    const missing = members.filter((member) => !matched.has(member))
    if (ofSection.length === 0 && missing.length > 0) {
      const names = missing.map((member) => label(member.part, member.name)).join(', ')
      report(`${item.name}.md has no ${section} table, but the types have ${names}`)
    } else {
      for (const member of missing) {
        report(`${label(member.part, member.name)} is in the types but not in ${item.name}.md`)
      }
    }
  }
  let page = markdown
  // From the last table back, so the earlier tables' offsets still hold.
  for (const table of [...tables].reverse()) {
    page = `${page.slice(0, table.start)}${merged.get(table) ?? ''}${page.slice(table.end)}`
  }
  const preview = `<DemoPreview name="${item.name}" title="${escapeHtml(item.title)}" />\n\n`
  page = insertBefore(page, (heading) => heading.level === 2, preview)
  // JSON strings are valid YAML scalars, so any title survives the frontmatter.
  return {
    page: `---\ntitle: ${JSON.stringify(item.title)}\n---\n\n${page}`,
    drift: found.map(({ section, text }) => `${item.name}: ${section}: ${text}`),
  }
}

const sections = ['Props', 'Slots', 'Events'] as const
type Section = (typeof sections)[number]

interface SpecTable {
  section: Section
  /** Offsets of the table's first character and just past its last. */
  start: number
  end: number
  head: string[]
  delimiter: string[]
  rows: string[][]
}

// The first table in each `## Props`, `## Slots` and `## Events` section, outside code.
function specTables(markdown: string): SpecTable[] {
  const lines = markdownLines(markdown)
  const headings = headingLines(markdown, lines)
  return headings.flatMap((heading, index) => {
    const section = sections.find((name) => heading.level === 2 && heading.title === name)
    if (!section) return []
    const next = headings.slice(index + 1).find(({ level }) => level <= 2)
    const end = next?.offset ?? markdown.length
    const table = firstTable(
      lines.filter((line) => line.offset > heading.offset && line.offset < end),
    )
    return table ? [{ section, ...table }] : []
  })
}

// GFM: a header row, then a delimiter row (`---`, `:--`, `-:` cells) with as many cells, then rows.
const delimiterRow = /^ {0,3}\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/
// A row needs a pipe; a blank line or the start of another block ends the table, as in markdown-it.
const endsTable = /^(\s*$| {4}| {0,3}(#|>|<|[-*+] |\d+[.)] |`{3}|~{3}))/

function firstTable(lines: ReturnType<typeof markdownLines>) {
  for (const [index, line] of lines.entries()) {
    const delimiter = lines[index + 1]
    if (
      line.code ||
      !hasPipe(line.text) ||
      !delimiter ||
      delimiter.code ||
      !delimiterRow.test(delimiter.text) ||
      !delimiter.text.includes('|') ||
      cells(line.text).length !== cells(delimiter.text).length
    ) {
      continue
    }
    const body: typeof lines = []
    for (const row of lines.slice(index + 2)) {
      if (row.code || endsTable.test(row.text) || !hasPipe(row.text)) break
      body.push(row)
    }
    const last = body.at(-1) ?? delimiter
    return {
      start: line.offset,
      end: last.offset + last.text.length,
      head: cells(line.text),
      delimiter: cells(delimiter.text),
      rows: body.map((row) => cells(row.text)),
    }
  }
  return undefined
}

const hasPipe = (text: string) => /(?<!\\)\|/.test(text)

function cells(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/(?<!\\)\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim())
}

// A cell's plain text: no code ticks, pipes unescaped.
const plain = (cell: string) => cell.replace(/`/g, '').replace(/\\\|/g, '|').trim()
const unquote = (text: string) => text.replace(/^(['"])(.*)\1$/, '$2')

// Words a spec uses for "no default" or "none of its own". A literal string is written quoted: `'none'`.
const noneWords = ['', 'none', '—', '-']
const isNone = (cell: string) => noneWords.includes(plain(cell).toLowerCase())

// A spec's default; `null` is no default.
function specDefault(cell: string) {
  return isNone(cell) ? null : unquote(plain(cell))
}

interface Member {
  part: string
  name: string
  type?: string
  default?: string
  boolean?: boolean
  description: string
}

// The default Vue gives a member; `null` is none. Vue casts an absent prop whose type includes boolean to `false`.
function typesDefault(member: Member) {
  if (member.default === undefined) return member.boolean ? 'false' : null
  return member.default === 'undefined' ? null : unquote(member.default)
}

function typeMembers(section: Section, components: ApiComponent[]): Member[] {
  return components.flatMap((component): Member[] => {
    const part = component.name
    if (section === 'Slots') {
      return component.slots.map(({ name, description }) => ({ part, name, description }))
    }
    if (section === 'Events') {
      return component.events.map(({ name, type, description }) => ({
        part,
        name,
        type: payloadText(type),
        description,
      }))
    }
    return component.props
      .filter((prop) => !prop.global)
      .map((prop) => {
        const members = unionMembers(prop.schema)
        return {
          part,
          name: prop.name,
          type: typeText(prop.schema, prop.type),
          default: prop.default,
          boolean: members.includes('true') && members.includes('false'),
          description: prop.description,
        }
      })
  })
}

// Emits come back as argument tuples: `[]` is no payload, `[value: T]` reads as `T`. More than one
// argument, or a rest argument, is shown as written.
function payloadText(type: string) {
  const inner = /^\[([\s\S]*)\]$/.exec(type.trim())?.[1]?.trim()
  if (inner === undefined) return quotes(type)
  if (inner === '') return ''
  const args = topLevelSplit(inner)
  const single = args.length === 1 && !inner.startsWith('...')
  return quotes(single ? inner.replace(/^\w+\??:\s*/, '') : type)
}

// Splits on commas outside brackets, braces, parentheses and angle brackets.
function topLevelSplit(text: string) {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (const [index, char] of [...text].entries()) {
    if ('[{(<'.includes(char)) depth++
    else if (']})>'.includes(char)) depth--
    else if (char === ',' && depth === 0) {
      parts.push(text.slice(start, index))
      start = index + 1
    }
  }
  return [...parts, text.slice(start)]
}

// Vue reports these as global attributes, so a spec may list them without the types doing so.
const globalProps = ['class', 'style']

interface MergeState {
  // Shared by every table of one section.
  matched: Set<Member>
  seen: Set<string>
  label: (part: string, name: string) => string
  report: (text: string) => void
}

function mergeTable(
  item: string,
  table: SpecTable,
  components: ApiComponent[],
  members: Member[],
  { matched, seen, label, report }: MergeState,
) {
  const column = (...names: string[]) =>
    table.head.findIndex((cell) => names.includes(plain(cell).toLowerCase()))
  const partAt = column('part')
  const nameAt = column('prop', 'slot', 'event')
  const typeAt = column('type', 'payload')
  const defaultAt = column('default')
  const noteAt = column('notes', 'content', 'when', 'description')
  const head = [table.head, table.delimiter]
  if (nameAt < 0 || (components.length > 1 && partAt < 0)) {
    report(`the table needs a ${nameAt < 0 ? 'Prop, Slot or Event' : 'Part'} column`)
    return rowsText([...head, ...table.rows])
  }
  const rows = table.rows.map((row) => {
    if (isNone(row[nameAt] ?? '')) return row
    const name = plain(row[nameAt] ?? '')
    const part = partAt < 0 ? (components[0]?.name ?? '') : plain(row[partAt] ?? '')
    const key = `${part}\0${name}`
    if (seen.has(key)) {
      report(`${label(part, name)} is listed twice in ${item}.md`)
      return row
    }
    seen.add(key)
    const member = members.find((entry) => entry.part === part && entry.name === name)
    if (!member) {
      if (!(table.section === 'Props' && globalProps.includes(name))) {
        report(`${label(part, name)} is in ${item}.md but not in the types`)
      }
      return row
    }
    matched.add(member)
    const merged = [...row]
    if (typeAt >= 0 && member.type !== undefined) {
      merged[typeAt] = member.type === '' ? 'none' : cell(code(member.type))
    }
    if (defaultAt >= 0) {
      const spec = row[defaultAt] ?? ''
      const types = typesDefault(member)
      if (specDefault(spec) !== types) {
        const shown = types === null ? 'nothing' : code(quotes(member.default ?? 'false'))
        report(
          `${label(part, name)} defaults to ${shown} in the types but ${spec || 'nothing'} in ${item}.md`,
        )
      }
      merged[defaultAt] = types === null ? 'none' : cell(code(quotes(member.default ?? 'false')))
    }
    if (noteAt >= 0 && !merged[noteAt]) merged[noteAt] = cell(prose(member.description))
    return merged
  })
  // v-pre: VitePress compiles Markdown as a Vue template, and JSDoc may hold `{{ }}`.
  return `::: v-pre\n\n${rowsText([...head, ...rows])}\n\n:::`
}

function rowsText(rows: string[][]) {
  return rows.map((row) => `| ${row.join(' | ')} |`).join('\n')
}

function cell(text: string) {
  return text
    .replace(/\r?\n+/g, ' ')
    .replace(/\|/g, '\\|')
    .trim()
}

// Inserts `block` before the first heading outside code that `matches`, or at the end.
function insertBefore(
  markdown: string,
  matches: (heading: ReturnType<typeof headingLines>[number]) => boolean,
  block: string,
) {
  const at = headingLines(markdown).find(matches)?.offset
  return at === undefined
    ? `${markdown.trimEnd()}\n\n${block}`
    : `${markdown.slice(0, at)}${block}${markdown.slice(at)}`
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
