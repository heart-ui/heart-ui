import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { CliError } from './errors.ts'
import { isDirectory, isFile, isObject, readJsonFile } from './fs.ts'
import { parseJsonc } from './jsonc.ts'

export type PackageManager = 'pnpm' | 'yarn' | 'bun' | 'npm'

export type Project = {
  root: string
  framework: 'nuxt' | 'vite' | null
  packageManager: PackageManager
  /** Tailwind CSS major version; `null` when the project names none. */
  tailwindMajor: number | null
  /** Import alias (`@`, `~`, `#utils`) to the absolute path it points to. */
  aliases: Record<string, string>
}

const lockFiles: [string, PackageManager][] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm'],
]

/** Detects the framework, package manager, Tailwind version and aliases of the project in `cwd`. */
export async function detectProject(cwd: string): Promise<Project> {
  const root = resolve(cwd)
  const manifestPath = join(root, 'package.json')
  const manifest = await readJsonFile(manifestPath)
  if (manifest === undefined) throw new CliError(`No package.json in ${root}.`)
  if (!isObject(manifest)) throw new CliError(`${manifestPath} must hold a JSON object.`)

  const deps: Record<string, unknown> = {
    ...(isObject(manifest.devDependencies) ? manifest.devDependencies : {}),
    ...(isObject(manifest.dependencies) ? manifest.dependencies : {}),
  }
  const framework = 'nuxt' in deps ? 'nuxt' : 'vite' in deps ? 'vite' : null
  const dirs = await projectDirs(root)

  return {
    root,
    framework,
    packageManager: managerFromField(manifest.packageManager) ?? managerFromLockFile(dirs) ?? 'npm',
    tailwindMajor: await tailwindMajor(root),
    aliases: framework === 'nuxt' ? nuxtAliases(root) : await tsconfigAliases(root),
  }
}

// The project folder, then its parents up to the enclosing workspace or git root. Without one,
// only the project folder: a stray lock file in a home folder says nothing about this project.
// The home folder never counts as a root, even when it is a git repo of dotfiles.
async function projectDirs(root: string): Promise<string[]> {
  const home = homedir()
  const dirs: string[] = []
  for (let dir = root; ; dir = dirname(dir)) {
    if (dir === home && dir !== root) return [root]
    dirs.push(dir)
    if (await isBoundary(dir)) return dirs
    if (dirname(dir) === dir) return [root]
  }
}

async function isBoundary(dir: string): Promise<boolean> {
  // `.git` is a file in a worktree or submodule.
  const git = join(dir, '.git')
  if (isDirectory(git) || isFile(git) || isFile(join(dir, 'pnpm-workspace.yaml'))) return true
  if (!isFile(join(dir, 'package.json'))) return false
  // An unreadable parent manifest is not this project's problem; it just isn't a workspace root.
  const manifest = await readJsonFile(join(dir, 'package.json')).catch(() => undefined)
  return isObject(manifest) && manifest.workspaces !== undefined
}

function managerFromField(field: unknown): PackageManager | undefined {
  const match = typeof field === 'string' ? /^(pnpm|yarn|bun|npm)@/.exec(field) : null
  return match?.[1] as PackageManager | undefined
}

// The nearest lock file wins: a workspace keeps one at its root.
function managerFromLockFile(dirs: string[]): PackageManager | undefined {
  for (const dir of dirs) {
    for (const [file, manager] of lockFiles) if (isFile(join(dir, file))) return manager
  }
  return undefined
}

async function tailwindMajor(root: string): Promise<number | null> {
  const version = await findVersion(root, 'tailwindcss')
  return version === null || version === 'unknown' ? null : version.major
}

/** `open` when a declared range lets the install pick a later minor (`^1.2`, `>=1.2`). */
export type Version = { major: number; minor: number; open?: boolean }

/**
 * The version of `name` in the project at `root`: installed in its own node_modules, else the
 * lowest the declared range allows, else hoisted in its workspace. `'unknown'` when declared with a
 * range that names no version (`latest`) and not installed; `null` when absent.
 */
export async function findVersion(root: string, name: string): Promise<Version | 'unknown' | null> {
  const installed = await installedVersion(root, name)
  if (installed) return installed
  const manifest = await readJsonFile(join(root, 'package.json')).catch(() => undefined)
  const declared = isObject(manifest) ? declaredRange(manifest, name) : undefined
  const fromRange = parseVersion(declared)
  if (fromRange) return fromRange
  for (const dir of (await projectDirs(root)).slice(1)) {
    const hoisted = await installedVersion(dir, name)
    if (hoisted) return hoisted
  }
  return declared === undefined ? null : 'unknown'
}

function declaredRange(manifest: Record<string, unknown>, name: string): unknown {
  for (const field of ['dependencies', 'devDependencies']) {
    const deps = manifest[field]
    if (isObject(deps) && name in deps) return deps[name]
  }
  return undefined
}

async function installedVersion(dir: string, name: string): Promise<Version | null> {
  const path = join(dir, 'node_modules', name, 'package.json')
  if (!isFile(path)) return null
  // A broken install says nothing reliable; fall back to the declared range.
  const manifest = await readJsonFile(path).catch(() => undefined)
  return isObject(manifest) ? parseVersion(manifest.version) : null
}

/**
 * The lowest version a semver range allows, for the ranges people write (`^4.1.0`, `~3.4`, `>=4`,
 * `3.x`). `open` when the install may pick a later minor: `^` and `>=`, or no fixed minor (`3`).
 */
export function parseVersion(range: unknown): Version | null {
  if (typeof range !== 'string') return null
  const match = /^\s*(\^|~|>=|=)?\s*v?(\d+)(?:\.(\d+|x|X|\*))?(?=$|[.\-\s])/.exec(range)
  if (!match) return null
  const [, operator, major, minor] = match
  const fixedMinor = minor !== undefined && /^\d+$/.test(minor)
  const version: Version = { major: Number(major), minor: fixedMinor ? Number(minor) : 0 }
  return operator === '^' || operator === '>=' || !fixedMinor ? { ...version, open: true } : version
}

// Nuxt 4's default aliases; `app/` is its source folder, the root in a Nuxt 3 layout.
function nuxtAliases(root: string): Record<string, string> {
  const src = isDirectory(join(root, 'app')) ? join(root, 'app') : root
  return { '@': src, '~': src, '@@': root, '~~': root }
}

// A tsconfig's effective options after `extends`. `paths` keeps its raw patterns and the folder of
// the config that set them: tsc resolves them only once the final `baseUrl` is known.
type Resolved = {
  baseUrl?: string
  paths?: { patterns: Record<string, unknown>; dir: string }
  references: string[]
}

async function tsconfigAliases(root: string): Promise<Record<string, string>> {
  const loaded = new Map<string, Promise<Resolved>>()
  const aliases: Record<string, string> = {}
  const add = (file: string, resolved: Resolved) => {
    // The first config to name an alias wins: the root, then references in their order.
    for (const [alias, path] of Object.entries(folderAliases(resolved, dirname(file)))) {
      aliases[alias] ??= path
    }
  }
  const rootFile = join(root, 'tsconfig.json')
  const top = await load(rootFile, loaded, [])
  add(rootFile, top)
  for (const reference of top.references) {
    const file = isDirectory(reference) ? join(reference, 'tsconfig.json') : reference
    add(file, await load(file, loaded, []))
  }
  return aliases
}

// Only `prefix/*` patterns name a folder; an exact pattern maps one specifier to one file.
function folderAliases(resolved: Resolved, configDir: string): Record<string, string> {
  const { paths, baseUrl } = resolved
  const aliases: Record<string, string> = {}
  for (const [pattern, targets] of Object.entries(paths?.patterns ?? {})) {
    const target = Array.isArray(targets) ? targets[0] : undefined
    if (!pattern.endsWith('/*') || typeof target !== 'string' || !target.endsWith('*')) continue
    const path = target.replaceAll('${configDir}', configDir).replace(/\/?\*$/, '')
    aliases[pattern.slice(0, -2)] = resolve(baseUrl ?? paths?.dir ?? configDir, path)
  }
  return aliases
}

// Loads `file` once per detection; `chain` breaks `extends` cycles.
function load(
  file: string,
  loaded: Map<string, Promise<Resolved>>,
  chain: string[],
): Promise<Resolved> {
  if (chain.includes(file)) return Promise.resolve<Resolved>({ references: [] })
  let result = loaded.get(file)
  if (!result) {
    result = resolveTsconfig(file, loaded, [...chain, file])
    loaded.set(file, result)
  }
  return result
}

async function resolveTsconfig(
  file: string,
  loaded: Map<string, Promise<Resolved>>,
  chain: string[],
): Promise<Resolved> {
  const config = await readJsonFile(file, parseJsonc)
  if (config === undefined) return { references: [] }
  if (!isObject(config)) throw new CliError(`${file} must hold a JSON object.`)
  const dir = dirname(file)

  let baseUrl: string | undefined
  let paths: Resolved['paths']
  const parents = typeof config.extends === 'string' ? [config.extends] : config.extends
  if (Array.isArray(parents)) {
    for (const parent of parents) {
      // Package presets (`@vue/tsconfig/...`) carry no project aliases.
      if (typeof parent !== 'string' || !parent.startsWith('.')) continue
      const path = resolve(dir, parent)
      const target = isFile(path) || path.endsWith('.json') ? path : `${path}.json`
      // A later entry of an `extends` array overrides an earlier one, option by option.
      const next = await load(target, loaded, chain)
      baseUrl = next.baseUrl ?? baseUrl
      paths = next.paths ?? paths
    }
  }

  const options = isObject(config.compilerOptions) ? config.compilerOptions : {}
  if (typeof options.baseUrl === 'string') baseUrl = resolve(dir, options.baseUrl)
  // As in tsc, a config's own `paths` replaces the inherited one whole.
  if (isObject(options.paths)) paths = { patterns: options.paths, dir }
  // References are not inherited.
  const references = (Array.isArray(config.references) ? config.references : []).flatMap(
    (reference) =>
      isObject(reference) && typeof reference.path === 'string'
        ? [resolve(dir, reference.path)]
        : [],
  )
  return { baseUrl, paths, references }
}
