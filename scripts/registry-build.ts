// Builds dist/registry from registry/: one JSON per item with its files' contents, plus the index.
// Usage: node scripts/registry-build.ts [--registry <dir>] [--out <dir>]
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Ajv, type ErrorObject } from 'ajv'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const schemaDir = join(repo, 'scripts/registry-schemas')
const itemSchemaId = 'https://ui.shadcn.com/schema/registry-item.json'
const indexSchemaId = 'https://ui.shadcn.com/schema/registry.json'
const scope = '@trevui'
// Lists what the build wrote into --out, so a rebuild deletes exactly that and nothing else.
const markerName = '.trevui-registry-build.json'

/** A build failure whose message is meant for the person running the build. */
export class RegistryError extends Error {}

// Each source folder, the item type its items must have, and the meta fields that apply to it
// (docs/registry.md, Registry format and Item metadata).
const kinds = {
  ui: { type: 'registry:ui', meta: ['version', 'tier'] },
  blocks: { type: 'registry:block', meta: ['version', 'useWhen', 'avoidWhen', 'data', 'states'] },
  layouts: {
    type: 'registry:block',
    meta: ['version', 'useWhen', 'avoidWhen', 'regions', 'data', 'states'],
  },
  lib: { type: 'registry:lib', meta: ['version'] },
} as const
// Under these, a folder holding only demos, tests, docs and dotfiles is a fixture, not an item.
const fixtureKinds = new Set(['ui', 'blocks', 'layouts'])
// Built from knob files by a later task, not from item folders.
const unbuiltFolders = new Set(['themes'])
// Item names become file names and URL segments (/r/{name}.json).
const namePattern = /^[a-z0-9][a-z0-9_-]*$/

type SourceItem = { name: string; type: string; files: string[] } & Record<string, unknown>
type BuiltFile = { path: string; type: string; content: string }
type BuiltItem = Omit<SourceItem, 'files'> & { $schema: string; files: BuiltFile[] }

function errorCode(error: unknown) {
  return (error as { code?: string }).code ?? 'unknown error'
}

function readJson(path: string, label: string): unknown {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch (error) {
    const code = errorCode(error)
    const reason = code === 'ENOENT' ? 'is missing' : `cannot be read (${code})`
    throw new RegistryError(`${label}: ${relative(repo, path)} ${reason}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new RegistryError(`${label}: ${relative(repo, path)} is not valid JSON`)
  }
}

function describe(errors: ErrorObject[] | null | undefined) {
  return (errors ?? [])
    .map((error) => {
      const where = error.instancePath || '(root)'
      const extra = error.params as { additionalProperty?: string }
      return extra.additionalProperty
        ? `${where} has unknown field "${extra.additionalProperty}"`
        : `${where} ${error.message}`
    })
    .join('; ')
}

// Every file below `dir`, without following symlinks or entering dot-folders.
function filesIn(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (!lstatSync(path).isDirectory()) return [relative(base, path)]
    return entry.startsWith('.') ? [] : filesIn(path, base)
  })
}

function isFixtureFile(file: string) {
  const name = basename(file)
  return name.startsWith('.') || /\.demo\.vue$|\.test\.ts$|\.md$/.test(name)
}

// Follows links, like the rest of the build, but names a broken one instead of failing raw.
function isFolder(path: string, label: string) {
  try {
    return statSync(path).isDirectory()
  } catch (error) {
    throw new RegistryError(`${label}: is a broken link or cannot be read (${errorCode(error)})`)
  }
}

function filesOf(dir: string, label: string) {
  try {
    return filesIn(dir)
  } catch (error) {
    throw new RegistryError(`${label}: cannot be read (${errorCode(error)})`)
  }
}

function within(inner: string, outer: string) {
  const path = relative(outer, inner)
  return !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`)
}

// The on-disk path of `path` (case included, links resolved), or of its nearest existing
// ancestor joined with the rest. Plain realpathSync keeps the typed case on macOS.
function realish(path: string): string {
  const absolute = resolve(path)
  if (existsSync(absolute)) return realpathSync.native(absolute)
  const parent = dirname(absolute)
  return parent === absolute ? absolute : join(realish(parent), basename(absolute))
}

function outError(out: string, error: unknown): never {
  throw new RegistryError(`--out ${out} cannot be written (${errorCode(error)})`)
}

// The build deletes only what its marker says it wrote, and writes only into a folder that is
// missing, empty or marked, so a mistyped --out can't delete or overwrite real files.
function writeOut(out: string, registry: string, files: Map<string, string>) {
  const target = realish(out)
  const source = realish(registry)
  if (within(target, source) || within(source, target)) {
    throw new RegistryError(`--out ${out} overlaps the registry; choose a folder outside it`)
  }
  let previous: string[] = []
  if (existsSync(target)) {
    if (!statSync(target).isDirectory()) throw new RegistryError(`--out ${out} is not a folder`)
    const marker = join(target, markerName)
    if (existsSync(marker)) {
      const listed = (readJson(marker, '--out') as { files?: unknown } | null)?.files
      const owned = (file: unknown) =>
        typeof file === 'string' &&
        (file === 'registry.json' ||
          (file.startsWith('r/') && file.endsWith('.json') && namePattern.test(file.slice(2, -5))))
      if (!Array.isArray(listed) || !listed.every(owned)) {
        throw new RegistryError(`--out ${out}: ${markerName} is not one this build wrote`)
      }
      previous = listed as string[]
    } else if (readdirSync(target).length > 0) {
      throw new RegistryError(
        `--out ${out} holds files this build did not write; choose a missing or empty folder`,
      )
    }
  }
  // Checked before anything is deleted, so a refused rebuild leaves the previous one whole.
  const taken = [...files.keys()].find(
    (file) => !previous.includes(file) && existsSync(join(target, file)),
  )
  if (taken) {
    throw new RegistryError(`--out ${out} already holds ${taken}, which this build did not write`)
  }
  try {
    for (const file of previous) rmSync(join(target, file), { force: true })
    if (existsSync(join(target, 'r')) && readdirSync(join(target, 'r')).length === 0) {
      rmdirSync(join(target, 'r'))
    }
    mkdirSync(join(target, 'r'), { recursive: true })
    // The marker goes first, so a build that stops halfway still owns what it wrote.
    const marker = { files: [...files.keys()] }
    writeFileSync(join(target, markerName), `${JSON.stringify(marker, null, 2)}\n`)
    for (const [file, content] of files) writeFileSync(join(target, file), content)
  } catch (error) {
    if (error instanceof RegistryError) throw error
    outError(out, error)
  }
}

// Import and export specifiers only (not `Array.from('..')`); `src=` attributes and `require`
// aren't used in registry code and aren't checked.
const relativeImport = /(?:(?<![.\w])from|\bimport)\s*\(?\s*['"`](\.{1,2}(?:\/[^'"`]*)?)['"`]/g

// The exact versions the repo installs, from the root package.json.
function repoVersions() {
  const manifest = readJson(join(repo, 'package.json'), 'package.json') as Record<string, unknown>
  return new Map(
    ['dependencies', 'devDependencies'].flatMap((field) =>
      Object.entries((manifest[field] ?? {}) as Record<string, string>),
    ),
  )
}

function checkDependency(name: string, built: Set<string>) {
  if (!name.includes('/') && !name.includes(':')) return built.has(name)
  const scoped = /^@([^/]+)\/([^/]+)$/.exec(name)
  if (scoped) return `@${scoped[1]}` !== scope || built.has(scoped[2]!)
  try {
    return ['http:', 'https:'].includes(new URL(name).protocol)
  } catch {
    return false
  }
}

/** Builds every item under `registry` into `out`; throws RegistryError on the first invalid item. */
export function buildRegistry({ registry, out }: { registry: string; out: string }) {
  if (!existsSync(registry) || !statSync(registry).isDirectory()) {
    throw new RegistryError(`--registry ${registry} is not a folder`)
  }
  // The upstream schemas name their draft by an https id Ajv doesn't map; their own shape isn't in question.
  const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false })
  const itemSchema = readJson(join(schemaDir, 'registry-item.json'), 'schema') as {
    properties: Record<string, unknown>
  }
  ajv.addSchema(itemSchema, itemSchemaId)
  const validateItem = ajv.getSchema(itemSchemaId)!
  const validateIndex = ajv.compile(readJson(join(schemaDir, 'registry.json'), 'schema') as object)
  const validateMeta = ajv.compile(
    readJson(join(schemaDir, 'meta.schema.json'), 'schema') as object,
  )
  const knownFields = new Set([...Object.keys(itemSchema.properties), '$schema'])

  const unknownFolder = readdirSync(registry).find(
    (entry) =>
      !entry.startsWith('.') &&
      !Object.hasOwn(kinds, entry) &&
      !unbuiltFolders.has(entry) &&
      isFolder(join(registry, entry), `registry/${entry}`),
  )
  if (unknownFolder) {
    throw new RegistryError(
      `registry/${unknownFolder}: not a registry folder; items go under ${Object.keys(kinds).join(', ')}`,
    )
  }

  const items: BuiltItem[] = []
  const labels = new Map<string, string>()
  for (const [kind, rules] of Object.entries(kinds)) {
    const kindDir = join(registry, kind)
    if (!existsSync(kindDir)) continue
    if (!isFolder(kindDir, `registry/${kind}`)) {
      throw new RegistryError(`registry/${kind}: is not a folder`)
    }
    let entries: string[]
    try {
      entries = readdirSync(kindDir).sort()
    } catch (error) {
      throw new RegistryError(`registry/${kind}: cannot be read (${errorCode(error)})`)
    }
    for (const name of entries) {
      if (name.startsWith('.')) continue
      const dir = join(kindDir, name)
      const label = `${kind}/${name}`
      if (!isFolder(dir, label)) {
        throw new RegistryError(`${label}: files belong in an item folder with an item.json`)
      }
      if (!namePattern.test(name)) {
        throw new RegistryError(
          `${label}: item folder names use lowercase letters, digits, - and _ only`,
        )
      }
      const itemPath = join(dir, 'item.json')
      if (!existsSync(itemPath)) {
        const found = filesOf(dir, label)
        if (fixtureKinds.has(kind) && found.length > 0 && found.every(isFixtureFile)) continue
        const what = found.length > 0 ? 'has source files but no item.json' : 'has no item.json'
        throw new RegistryError(`${label}: ${what}`)
      }

      const source = readJson(itemPath, label)
      if (typeof source !== 'object' || source === null || Array.isArray(source)) {
        throw new RegistryError(`${label}: item.json must hold an object`)
      }
      const unknown = Object.keys(source).filter((field) => !knownFields.has(field))
      if (unknown.length > 0) {
        throw new RegistryError(
          `${label}: unknown field ${unknown.map((field) => `"${field}"`).join(', ')} in item.json; TrevUI fields go under meta`,
        )
      }
      const item: SourceItem = { ...(source as SourceItem) }
      if (item.$schema !== undefined && item.$schema !== itemSchemaId) {
        throw new RegistryError(`${label}: $schema must be ${itemSchemaId} or left out`)
      }
      delete item.$schema
      if (item.name !== name) {
        throw new RegistryError(
          `${label}: item.json name "${String(item.name)}" must match the folder`,
        )
      }
      if (item.type !== rules.type) {
        throw new RegistryError(`${label}: type must be "${rules.type}" for items in ${kind}/`)
      }
      const categories = Array.isArray(item.categories) ? item.categories : []
      if (kind === 'layouts' && !categories.includes('layout')) {
        throw new RegistryError(`${label}: layouts need "layout" in categories`)
      }
      if (!validateMeta(item.meta ?? {})) {
        throw new RegistryError(`${label}: meta ${describe(validateMeta.errors)}`)
      }
      const misplaced = Object.keys((item.meta ?? {}) as object).filter(
        (field) => !(rules.meta as readonly string[]).includes(field),
      )
      if (misplaced.length > 0) {
        throw new RegistryError(`${label}: meta ${misplaced.join(', ')} does not apply to ${kind}/`)
      }
      if (
        !Array.isArray(item.files) ||
        item.files.length === 0 ||
        item.files.some((file) => typeof file !== 'string')
      ) {
        throw new RegistryError(`${label}: files must list at least one file name`)
      }

      const realDir = realpathSync.native(dir)
      const listed = new Set<string>()
      const shipped = new Set<string>()
      const files = item.files.map((file) => {
        const path = resolve(dir, file)
        const spelled = relative(resolve(dir), path)
        if (!within(path, resolve(dir)) || spelled === '') {
          throw new RegistryError(`${label}: lists ${file}, which is outside the item folder`)
        }
        if (basename(path) === 'item.json') {
          throw new RegistryError(
            `${label}: lists item.json, which is metadata, not a file to ship`,
          )
        }
        if (listed.has(path)) throw new RegistryError(`${label}: lists ${file} twice`)
        listed.add(path)
        shipped.add(spelled)
        if (!existsSync(path)) {
          throw new RegistryError(`${label}: lists ${file}, which is not in the folder`)
        }
        // The shipped path is the listed one, so it must be the file's own path on disk: no link
        // on the way and the same case, or the CLI would write a path that doesn't exist.
        if (relative(realDir, realpathSync.native(path)) !== spelled) {
          throw new RegistryError(
            `${label}: lists ${file}, which is a link or differs in case from the file on disk; list the real path`,
          )
        }
        if (!lstatSync(path).isFile()) {
          throw new RegistryError(`${label}: lists ${file}, which is not a file`)
        }
        let content: string
        try {
          content = readFileSync(path, 'utf8')
        } catch (error) {
          throw new RegistryError(`${label}: ${file} cannot be read (${errorCode(error)})`)
        }
        // The CLI writes each kind under its own alias, so a relative path out of the item breaks
        // in the user's project; shared code is imported as `@/lib/...`, which the CLI rewrites.
        for (const [, specifier] of content.matchAll(relativeImport)) {
          if (!within(resolve(dirname(path), specifier!), resolve(dir))) {
            throw new RegistryError(
              `${label}: ${file} imports ${specifier} from outside the item; import shared code from @/lib/...`,
            )
          }
        }
        return {
          // Always from registry/, as the CLI expects, however --registry was spelled.
          path: ['registry', kind, name, ...spelled.split(sep)].join('/'),
          type: item.type,
          content,
        }
      })
      const unlisted = filesOf(dir, label).find(
        (file) => file !== 'item.json' && !isFixtureFile(file) && !shipped.has(file),
      )
      if (unlisted) {
        throw new RegistryError(`${label}: ${unlisted} is not in files; list it or remove it`)
      }
      const previous = labels.get(item.name)
      if (previous) {
        throw new RegistryError(`${label}: the name "${item.name}" is also used by ${previous}`)
      }
      labels.set(item.name, label)

      const built: BuiltItem = { $schema: itemSchemaId, ...item, files }
      if (!validateItem(built)) {
        throw new RegistryError(`${label}: ${describe(validateItem.errors)}`)
      }
      items.push(built)
    }
  }
  if (items.length === 0) throw new RegistryError(`--registry ${registry} holds no items`)

  const names = new Set(labels.keys())
  const tested = repoVersions()
  for (const item of items) {
    const label = labels.get(String(item.name))
    // Users get the versions the repo tests, not whatever is latest on install day.
    for (const dependency of (item.dependencies ?? []) as string[]) {
      const at = dependency.lastIndexOf('@')
      const [name, version] =
        at > 0 ? [dependency.slice(0, at), dependency.slice(at + 1)] : [dependency, '']
      if (!version) {
        throw new RegistryError(
          `${label}: dependency "${dependency}" needs a pinned version (name@version)`,
        )
      }
      if (tested.get(name) !== version) {
        throw new RegistryError(
          `${label}: dependency "${dependency}" differs from the version the repo tests (${tested.get(name) ?? 'not installed'})`,
        )
      }
    }
    const dependencies = (item.registryDependencies ?? []) as string[]
    const missing = dependencies.filter((name) => !checkDependency(name, names))
    if (missing.length > 0) {
      throw new RegistryError(
        `${labels.get(String(item.name))}: registryDependencies names ${missing.map((name) => `"${name}"`).join(', ')}, which is not an item, a scoped name or a URL`,
      )
    }
  }

  const index = {
    $schema: indexSchemaId,
    name: 'trevui',
    // Index entries carry no `$schema` and no file contents.
    items: items.map(({ files, ...entry }) => ({
      ...Object.fromEntries(Object.entries(entry).filter(([key]) => key !== '$schema')),
      files: files.map(({ path, type }) => ({ path, type })),
    })),
  }
  if (!validateIndex(index)) {
    throw new RegistryError(`registry.json: ${describe(validateIndex.errors)}`)
  }

  const output = new Map([['registry.json', `${JSON.stringify(index, null, 2)}\n`]])
  for (const item of items) output.set(`r/${item.name}.json`, `${JSON.stringify(item, null, 2)}\n`)
  writeOut(out, registry, output)
  return items.map((item) => item.name)
}

function options(args: string[]) {
  const values: Record<string, string> = {
    '--registry': join(repo, 'registry'),
    '--out': join(repo, 'dist/registry'),
  }
  for (let at = 0; at < args.length; at += 2) {
    const flag = args[at]!
    if (!Object.hasOwn(values, flag)) {
      throw new RegistryError(`unknown argument ${flag}; use --registry <dir> and --out <dir>`)
    }
    const value = args[at + 1]
    if (value === undefined || value.startsWith('--')) {
      throw new RegistryError(`${flag} needs a value`)
    }
    values[flag] = value
  }
  return { registry: values['--registry']!, out: values['--out']! }
}

// Real paths on both sides, so the script also runs when started through a symlink.
const entry = process.argv[1] && existsSync(process.argv[1]) ? realpathSync(process.argv[1]) : ''
if (entry === realpathSync(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2)
  try {
    const names = buildRegistry(options(args))
    process.stdout.write(`registry:build: ${names.length} items (${names.join(', ')})\n`)
  } catch (error) {
    const message = error instanceof RegistryError ? error.message : `failed: ${String(error)}`
    console.error(`registry:build: ${message}`)
    process.exit(1)
  }
}
