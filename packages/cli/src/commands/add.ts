import { readFile, realpath } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { aliasPath, rewriteImports } from '../aliases.ts'
import type { Command, Io } from '../cli.ts'
import { readConfig, type Config } from '../config.ts'
import { detectProject } from '../detect.ts'
import { CliError, quoted } from '../errors.ts'
import { exists, isFile } from '../fs.ts'
import { checkSpecs, install, missingDependencies, type Installer } from '../install.ts'
import { formatLock, hashText, LOCK_FILE, readLock, type LockEntry } from '../lock.ts'
import { createRegistryClient, type RegistryItem } from '../registry.ts'
import { refuseOutside, writeSteps, type Step } from '../write.ts'

export type AddDeps = { fetch?: typeof globalThis.fetch; install?: Installer; cacheDir?: string }

const DEFAULT_REGISTRY = '@heart-ui'
const addable = ['registry:ui', 'registry:lib', 'registry:block']
const folders: [string, keyof Config['aliases']][] = [
  ['registry/ui/', 'ui'],
  ['registry/lib/', 'lib'],
  ['registry/blocks/', 'blocks'],
  ['registry/layouts/', 'layouts'],
]

/** The `add` command; `deps` replaces the network and the installer in tests. */
export function createAdd(deps: AddDeps = {}): Command {
  return {
    summary: 'Add components, blocks or layouts, with what they depend on.',
    usage: 'heart-ui add <item...> [--overwrite]',
    options: {
      overwrite: { type: 'boolean', description: 'Replace your files for the items you name.' },
    },
    run: (ctx) => add(ctx.cwd, ctx.args, ctx.options.overwrite === true, ctx.io, deps),
  }
}

// One resolved item: `named` when the user asked for it, not only pulled in as a dependency.
type Entry = { key: string; registry: string; item: RegistryItem; named: boolean }
type Planned = { path: string; content: string; current: string | undefined; present: boolean }

// Git on Windows checks files out with CRLF; that alone is not an edit.
const lf = (text: string) => text.replace(/\r\n/g, '\n')

async function add(
  cwd: string,
  refs: string[],
  overwrite: boolean,
  io: Io,
  deps: AddDeps,
): Promise<number> {
  if (!refs.length) throw new CliError('Name at least one item: heart-ui add <item...>.', 2)
  const root = resolve(cwd)
  const config = await readConfig(root)
  if (!config) throw new CliError(`No heart-ui.json in ${root}. Run heart-ui init first.`)
  const project = await detectProject(root)
  const show = (path: string) => relative(root, path).split(sep).join('/')
  const lockPath = join(root, LOCK_FILE)
  const { lock, text: lockText } = await readLock(lockPath)

  const client = createRegistryClient({
    registries: config.registries,
    cacheDir: deps.cacheDir,
    fetch: deps.fetch,
    onWarn: (message) => io.stderr(`heart-ui: ${message}\n`),
  })
  // Depth first, dependencies before dependents. An unscoped name means the default registry, as
  // in the shadcn CLI, so a third-party item names its own helpers in full (`@acme/x`).
  const seen = new Set<string>()
  const named = new Set<string>()
  const order: Entry[] = []
  const visit = async (ref: string, parent?: string): Promise<void> => {
    const scoped = /^(@[^/]+)\/(.*)$/.exec(ref)
    const registry = scoped?.[1] ?? DEFAULT_REGISTRY
    const name = scoped ? (scoped[2] ?? '') : ref
    const key = registry === DEFAULT_REGISTRY ? name : `${registry}/${name}`
    if (parent === undefined) named.add(key)
    if (seen.has(key)) return
    seen.add(key)
    const item = await client.fetchItem(`${registry}/${name}`)
    if (!addable.includes(item.type)) {
      const which = parent === undefined ? name : `${key} (needed by ${parent})`
      throw new CliError(
        `${which} is a ${item.type} item; heart-ui add installs components, helpers, blocks and layouts.`,
      )
    }
    checkSpecs(item, registry)
    for (const dep of item.registryDependencies ?? []) await visit(dep, key)
    order.push({ key, registry, item, named: false })
  }
  for (const ref of refs) await visit(ref)
  const entries = order.map((entry) => ({ ...entry, named: named.has(entry.key) }))

  const plans = new Map<string, Planned[]>()
  const owners = new Map<string, string>()
  for (const entry of entries) {
    const planned = await plan(entry, root, config, project.aliases, show)
    for (const file of planned) {
      // Case-insensitive disks (macOS, Windows) treat Button.vue and button.vue as one file.
      const owner = owners.get(file.path.toLowerCase())
      if (owner !== undefined) {
        throw new CliError(
          owner === entry.key
            ? `${entry.key} sends two files for ${show(file.path)}.`
            : `${owner} and ${entry.key} both write ${show(file.path)}.`,
        )
      }
      owners.set(file.path.toLowerCase(), entry.key)
    }
    plans.set(entry.key, planned)
  }

  const steps: Step[] = []
  const items = new Map(Object.entries(lock.items))
  const added: string[] = []
  const written: string[] = []
  const replaced: string[] = []
  const kept: string[] = []
  const differ: string[] = []
  const newer: string[] = []
  const upToDate: string[] = []
  // Items whose files this run writes or records; only their npm dependencies are installed.
  const installed: RegistryItem[] = []
  const create = (file: Planned) => {
    steps.push({ kind: 'create', path: file.path, content: file.content })
    written.push(show(file.path))
  }
  for (const entry of entries) {
    const planned = plans.get(entry.key) ?? []
    const locked = Object.hasOwn(lock.items, entry.key) ? lock.items[entry.key] : undefined
    const missing = planned.filter((file) => !file.present)
    const differs = planned.filter(
      (file) =>
        file.present && (file.current === undefined || lf(file.current) !== lf(file.content)),
    )
    const lockEntry: LockEntry = {
      registry: entry.registry,
      version: typeof entry.item.meta?.version === 'string' ? entry.item.meta.version : null,
      files: Object.fromEntries(planned.map((file) => [show(file.path), hashText(file.content)])),
    }
    if (!differs.length) {
      missing.forEach(create)
      ;(missing.length ? added : upToDate).push(entry.key)
      items.set(entry.key, lockEntry)
      installed.push(entry.item)
      continue
    }
    // Files still as the lock recorded them: installed, and the registry has moved on since.
    const untouched = (file: Planned) => {
      const recorded =
        locked && Object.hasOwn(locked.files, show(file.path))
          ? locked.files[show(file.path)]
          : undefined
      return (
        file.current !== undefined &&
        (recorded === hashText(file.current) || recorded === hashText(lf(file.current)))
      )
    }
    if (differs.every(untouched) && !(entry.named && overwrite)) {
      newer.push(entry.key)
      continue
    }
    if (!entry.named) {
      // A dependency you changed is yours; `update` is the tool that brings it up to date. Its
      // missing files are created and recorded, so `update` knows them as untouched.
      missing.forEach(create)
      if (locked) {
        const files = { ...locked.files }
        for (const file of missing) files[show(file.path)] = hashText(file.content)
        items.set(entry.key, { ...locked, files })
      }
      ;(locked ? kept : differ).push(entry.key)
      continue
    }
    const notFile = differs.find((file) => file.current === undefined)
    if (notFile) throw new CliError(`${show(notFile.path)} already exists and is not a file.`)
    if (!overwrite) {
      const paths = differs.map((file) => show(file.path))
      throw new CliError(
        paths.length === 1
          ? `${paths[0]} already exists. Run heart-ui add ${entry.key} --overwrite to replace it.`
          : `${paths.join(', ')} already exist. Run heart-ui add ${entry.key} --overwrite to replace them.`,
      )
    }
    missing.forEach(create)
    for (const file of differs) {
      await refuseOutside(root, file.path, show, 'add')
      steps.push({
        kind: 'edit',
        path: file.path,
        content: file.content,
        original: file.current as string,
      })
      replaced.push(show(file.path))
    }
    added.push(entry.key)
    items.set(entry.key, lockEntry)
    installed.push(entry.item)
  }

  const newLock = formatLock({ items: Object.fromEntries(items) })
  if (newLock !== lockText) {
    if (lockText === undefined) {
      steps.push({ kind: 'create', path: lockPath, content: newLock })
    } else {
      await refuseOutside(root, lockPath, show, 'add')
      const original = await readFile(lockPath, 'utf8')
      steps.push({ kind: 'edit', path: lockPath, content: newLock, original })
    }
  }

  const installs = await missingDependencies(root, installed)
  // The install runs inside the write, so a failed install undoes the files and the lock too, and
  // its message says so instead of offering a command that would finish only half the job.
  await writeSteps(steps, show, 'add', 'nothing was added', () =>
    install(
      project.packageManager,
      installs,
      root,
      deps.install,
      (reason) =>
        `Installing dependencies failed (${reason}); nothing was added. Fix the install and run heart-ui add again.`,
    ),
  )

  if (added.length) io.stdout(`Added: ${added.join(', ')}\n`)
  if (written.length) io.stdout(`Wrote: ${written.join(', ')}\n`)
  if (replaced.length) io.stdout(`Replaced: ${replaced.join(', ')}\n`)
  for (const key of kept) {
    io.stdout(`Kept your changes to ${key}; heart-ui update brings it up to date.\n`)
  }
  for (const key of differ) io.stdout(`${key} differs from the registry; kept the copy you have.\n`)
  for (const key of newer) io.stdout(`${key} has a newer version; heart-ui update brings it in.\n`)
  if (installs.length) io.stdout(`Installed: ${installs.join(', ')}\n`)
  for (const ref of refs) {
    const key = ref.startsWith(`${DEFAULT_REGISTRY}/`)
      ? ref.slice(DEFAULT_REGISTRY.length + 1)
      : ref
    if (upToDate.includes(key)) io.stdout(`${key} is up to date.\n`)
  }
  return 0
}

// Where each file of the item goes, its content after alias rewriting, and what is there now.
async function plan(
  entry: Entry,
  root: string,
  config: Config,
  projectAliases: Record<string, string>,
  show: (path: string) => string,
): Promise<Planned[]> {
  const planned: Planned[] = []
  for (const file of entry.item.files) {
    let path: string
    if (file.target !== undefined) {
      const target = file.target.replace(/^~\//, '')
      // The project root holds package.json, heart-ui.json and the build config: never an item's.
      if (dirname(join(root, target)) === root) {
        throw new CliError(
          `${entry.registry} sent ${entry.item.name} with a file for the project root, ${quoted(file.target)}; items may write only into folders.`,
        )
      }
      path = join(root, target)
      await refuseLinkedFolder(root, path, show)
    } else {
      const folder = folders.find(
        ([prefix]) => file.path.startsWith(prefix) && file.path.length > prefix.length,
      )
      if (!folder) {
        throw new CliError(
          `${entry.registry} sent ${entry.item.name} with a file outside registry/ui, lib, blocks and layouts: ${quoted(file.path)}.`,
        )
      }
      const [prefix, alias] = folder
      path = join(aliasPath(config.aliases[alias], projectAliases), file.path.slice(prefix.length))
    }
    const present = exists(path)
    const current = present && isFile(path) ? await readFile(path, 'utf8') : undefined
    planned.push({ path, content: rewriteImports(file.content, config.aliases), current, present })
  }
  return planned
}

// A registry's `target` must land inside the project even when a folder on the way is a link.
async function refuseLinkedFolder(root: string, path: string, show: (path: string) => string) {
  let dir = dirname(path)
  while (!exists(dir) && dirname(dir) !== dir) dir = dirname(dir)
  // A dangling or looping link can't be resolved, so nobody can say it stays inside.
  const target = await realpath(dir).catch(() => undefined)
  const inside = target === undefined ? '..' : relative(await realpath(root), target)
  if (inside.startsWith('..') || /^[/\\]|^[A-Za-z]:/.test(inside)) {
    throw new CliError(`${show(path)} is outside the project, so add will not write it.`)
  }
}
