// Generates what agents read about the registry (docs/agent-support.md, Project rule files): an
// API index for AGENTS.md and the Heart UI skill. registry:build writes both into its output.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import type { ApiSnapshot } from './api-snapshot.ts'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/** The index's budget: it sits in every agent's context. */
const INDEX_BUDGET = 8192

// Where each registry folder's items land in a project (docs/registry.md, Project config), and
// the word the index uses for it.
const kinds: Record<string, { alias: string; label: string }> = {
  ui: { alias: '@/components/ui', label: 'ui' },
  blocks: { alias: '@/components/blocks', label: 'block' },
  layouts: { alias: '@/layouts', label: 'layout' },
  lib: { alias: '@/lib', label: 'lib' },
}

/** One registry item as the agent context shows it. */
export interface AgentItem {
  name: string
  /** The registry folder it sits in: `ui`, `blocks`, `layouts` or `lib`. */
  kind: string
  /** The module path after `<alias>/<name>`: `''` for the folder's `index.ts`, `/utils` for `utils.ts`. */
  entry: string
  /** The entry's value exports, in source order. */
  exports: string[]
  description: string
  useWhen?: string
  components: ApiSnapshot['components']
}

/** Generation failures the build reports as they are. */
export class AgentContextError extends Error {}

/** The value exports of a TypeScript module, in source order; type-only exports are left out. */
export function moduleExports(source: string): string[] {
  const file = ts.createSourceFile('entry.ts', source, ts.ScriptTarget.Latest)
  const names: string[] = []
  const exported = (node: ts.Node) =>
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ) &&
    !(ts.getModifiers(node) ?? []).some(
      (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
    )
  for (const node of file.statements) {
    if (ts.isExportDeclaration(node)) {
      if (node.isTypeOnly || !node.exportClause || !ts.isNamedExports(node.exportClause)) continue
      for (const spec of node.exportClause.elements)
        if (!spec.isTypeOnly && spec.name.text !== 'default') names.push(spec.name.text)
    } else if (ts.isVariableStatement(node) && exported(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.push(declaration.name.text)
      }
    } else if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && exported(node)) {
      if (node.name) names.push(node.name.text)
    }
  }
  return names
}

const oneLine = (text: string) => text.replace(/\s*\n\s*/g, ' ').trim()

const member = String.raw`'[^']*'|-?\d+(\.\d+)?|true|false|null|undefined`
const literalUnion = new RegExp(`^(${member})( \\| (${member}))*$`)
// Reka UI's rendering props, on every part; the header says so once.
const plumbing = new Set(['as', 'asChild'])
const standardSize = (type: string) => type.split(' | ').sort().join(' | ') === "'lg' | 'md' | 'sm'"

// A literal union (`'sm' | 'md'`) or a boolean is what an agent guesses wrong; any other prop,
// Reka's `as`/`asChild` and the standard `size` are left out to keep within the budget.
function propText(prop: { name: string; type: string }) {
  if (plumbing.has(prop.name)) return null
  if (prop.type === 'boolean') return `${prop.name}?`
  if (!literalUnion.test(prop.type)) return null
  if (prop.name === 'size' && standardSize(prop.type)) return null
  return `${prop.name}: ${prop.type.replace(/ \| /g, '|')}`
}

/**
 * `agents/api-index.md`: a heading per kind naming its import path, then one line per item:
 * `- <name>[/<module>]: <exports>`, then each component's typed props. Throws past INDEX_BUDGET.
 */
export function apiIndex(items: AgentItem[]): string {
  const sections = new Map<string, string[]>()
  for (const item of items) {
    const props = item.components
      .map((component) => ({
        name: component.name,
        props: component.props.map(propText).filter((text) => text !== null),
      }))
      .filter((component) => component.props.length > 0)
      .map((component) => `${component.name} ${component.props.join(', ')}`)
    // An item with no entry module, or one that exports no value, shows its path alone.
    const exports = item.exports.filter((name) => !/^[a-z]\w*Variants$/.test(name))
    const head = `- ${item.name}${item.entry}${exports.length > 0 ? `: ${exports.join(', ')}` : ''}`
    const line = props.length > 0 ? `${head} — ${props.join('; ')}` : head
    sections.set(item.kind, [...(sections.get(item.kind) ?? []), line])
  }
  const text = [
    '# Heart UI API',
    '',
    'Generated from the registry. Each line: `- <path>: <named exports> — <Component> <props>`; import the exports from `<alias>/<path>`.',
    "Props: literal unions as `name: 'a'|'b'`, booleans as `name?`; other props, `as`/`asChild` and `size: 'sm'|'md'|'lg'` are left out, as are the `*Variants` class helpers.",
    ...[...sections].flatMap(([kind, lines]) => [
      '',
      `## ${kinds[kind]?.label ?? kind}: \`${kinds[kind]?.alias ?? `@/${kind}`}\``,
      '',
      ...lines,
    ]),
    '',
  ].join('\n')
  const size = Buffer.byteLength(text)
  if (size > INDEX_BUDGET) {
    throw new AgentContextError(
      `agents/api-index.md is over 8 KB (${size} bytes); shorten the line format`,
    )
  }
  return text
}

const cell = (text: string) => oneLine(text).replace(/\|/g, '\\|')

/**
 * `skills/heart-ui/SKILL.md`: the hand-written conventions and a "need → use" row per item. The
 * template is `scripts/skill-template.md` unless a test passes one.
 */
export function skillMarkdown(items: AgentItem[], template?: string): string {
  const source = template ?? readFileSync(join(repo, 'scripts/skill-template.md'), 'utf8')
  const rows = [
    '| Need | Use |',
    '| --- | --- |',
    ...items.map(
      (item) => `| ${cell(item.useWhen?.trim() || item.description)} | \`${item.name}\` |`,
    ),
  ].join('\n')
  if (!source.includes('{{items}}')) {
    throw new AgentContextError('scripts/skill-template.md has no {{items}} placeholder')
  }
  return source.replace('{{items}}', () => rows)
}
