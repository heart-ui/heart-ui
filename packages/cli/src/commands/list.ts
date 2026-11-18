import type { Command, Io } from '../cli.ts'
import { readConfig } from '../config.ts'
import { CliError, escapeControls, printable } from '../errors.ts'
import { createRegistryClient, DEFAULT_REGISTRY_URL } from '../registry.ts'

const types = ['ui', 'lib', 'block', 'theme']

export type ListDeps = { fetch?: typeof globalThis.fetch; cacheDir?: string }

/** The `list` command; `deps` replaces the network in tests. */
export function createList(deps: ListDeps = {}): Command {
  return {
    summary: 'List the items in the registry.',
    usage: 'heart-ui list [--type <type>] [--category <category>] [--json]',
    options: {
      type: { type: 'string', description: 'Only items of this type: ui, lib, block or theme.' },
      category: { type: 'string', description: 'Only items in this category.' },
      json: { type: 'boolean', description: 'Print the matching index entries as JSON.' },
    },
    run: (ctx) => list(ctx.cwd, ctx.options, ctx.io, deps),
  }
}

async function list(
  cwd: string,
  options: Record<string, string | boolean>,
  io: Io,
  deps: ListDeps,
): Promise<number> {
  let type: string | undefined
  if (typeof options.type === 'string') {
    const kind = options.type.toLowerCase().replace(/^registry:/, '')
    if (!types.includes(kind)) throw new CliError(`--type must be one of ${types.join(', ')}.`, 2)
    type = `registry:${kind}`
  }
  // Browsing comes before setting up, so heart-ui.json is optional here.
  let config = null
  try {
    config = await readConfig(cwd)
  } catch (error) {
    if (!(error instanceof CliError)) throw error
    io.stderr(`heart-ui: ${printable(error.message)} Listing the default registry.\n`)
  }
  const registries = { '@heart-ui': DEFAULT_REGISTRY_URL, ...config?.registries }
  const client = createRegistryClient({
    registries,
    cacheDir: deps.cacheDir,
    fetch: deps.fetch,
    onWarn: (message) => io.stderr(`heart-ui: ${message}\n`),
  })
  const { items } = await client.fetchIndex()

  const category = typeof options.category === 'string' ? options.category : undefined
  const matching = items.filter(
    (item) =>
      (type === undefined || item.type === type) &&
      (category === undefined || (item.categories ?? []).includes(category)),
  )

  if (options.json === true) {
    io.stdout(`${escapeControls(JSON.stringify(matching))}\n`)
    return 0
  }
  if (!matching.length) {
    io.stdout('No items match.\n')
    return 0
  }
  const rows = matching.map((item) => [
    printable(item.name),
    printable(item.type.replace(/^registry:/, '')),
    printable(item.description ?? ''),
  ])
  // A reduce, not Math.max(...rows): an index near the 5 MB cap could overflow the argument list.
  const widths = [0, 1].map((column) =>
    rows.reduce((width, row) => Math.max(width, [...(row[column] ?? '')].length), 0),
  )
  for (const [name = '', kind = '', description] of rows) {
    io.stdout(
      `${pad(name, widths[0] ?? 0)}  ${pad(kind, widths[1] ?? 0)}  ${description}`.trimEnd() + '\n',
    )
  }
  return 0
}

// Pads by code points, as the widths count them; padEnd counts UTF-16 units.
const pad = (text: string, width: number) =>
  text + ' '.repeat(Math.max(0, width - [...text].length))
