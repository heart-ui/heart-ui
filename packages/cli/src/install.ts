import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import type { PackageManager } from './detect.ts'
import { parseVersion } from './detect.ts'
import { CliError, quoted } from './errors.ts'
import { isFile, isObject, readJsonFile } from './fs.ts'
import type { RegistryItem } from './registry.ts'

export type Installer = (manager: PackageManager, deps: string[], cwd: string) => Promise<void>

// An npm registry package pinned to an exact version, as registry items pin them. Nothing here
// has a meaning to a shell (including cmd.exe on Windows) or starts with `-` like a flag.
const packageSpec =
  /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

/** Fails on any dependency of `item` that is not an exact npm spec, before anything is written. */
export function checkSpecs(item: RegistryItem, registry: string): void {
  for (const dep of item.dependencies ?? []) {
    if (!packageSpec.test(dep)) {
      throw new CliError(
        `${registry} lists ${quoted(dep)} as a dependency of ${item.name}, which is not an npm package.`,
      )
    }
  }
}

/** The package manager's command that adds `deps`, pinned exactly. */
export function installCommand(
  manager: PackageManager,
  deps: string[],
  workspaceRoot = false,
): { command: string; args: string[] } {
  const verb = manager === 'npm' ? 'install' : 'add'
  const exact = manager === 'npm' || manager === 'pnpm' ? '--save-exact' : '--exact'
  // pnpm refuses to add to a workspace root unless told it is meant.
  const root = manager === 'pnpm' && workspaceRoot ? ['-w'] : []
  return { command: manager, args: [verb, ...root, exact, ...deps] }
}

const isPnpmWorkspaceRoot = (dir: string) => isFile(join(dir, 'pnpm-workspace.yaml'))

const spawnInstaller: Installer = async (manager, deps, cwd) => {
  const { command, args } = installCommand(manager, deps, isPnpmWorkspaceRoot(cwd))
  // Windows runs package managers through .cmd shims, which Node starts only with a shell. The
  // arguments are safe there: packageSpec admits no character cmd.exe interprets.
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.error) throw new CliError(`${command} could not start`)
  if (result.status !== 0) throw new CliError(`${command} exited with ${result.status}`)
}

/** Installs `deps` in `root`; a failure names the command to run by hand, or `retryMessage`'s text. */
export async function install(
  manager: PackageManager,
  deps: string[],
  root: string,
  installer: Installer = spawnInstaller,
  // When the caller has undone its writes, running the command by hand would finish only half.
  retryMessage?: (reason: string) => string,
): Promise<void> {
  if (!deps.length) return
  try {
    await installer(manager, deps, root)
  } catch (error) {
    const { command, args } = installCommand(manager, deps, isPnpmWorkspaceRoot(root))
    const reason = error instanceof CliError ? error.message : 'see the output above'
    if (retryMessage) throw new CliError(retryMessage(reason))
    throw new CliError(
      `Installing dependencies failed (${reason}). Run this in ${root}: ${command} ${args.join(' ')}`,
    )
  }
}

const splitSpec = (spec: string) => {
  const at = spec.indexOf('@', 1)
  return { name: spec.slice(0, at), version: spec.slice(at + 1) }
}

/**
 * The items' dependencies the project lacks. One declared at the same major (the same minor below
 * 1.0) is kept, and so is a range that names no version (`catalog:`, `workspace:*`); another major
 * (tailwind-merge 2 for an item built on 3) would leave the item broken, so it is installed.
 */
export async function missingDependencies(root: string, items: RegistryItem[]): Promise<string[]> {
  const manifest = await readJsonFile(join(root, 'package.json'))
  const declared = new Map<string, unknown>()
  if (isObject(manifest)) {
    for (const field of ['devDependencies', 'dependencies']) {
      const deps = manifest[field]
      if (isObject(deps)) {
        for (const [name, range] of Object.entries(deps)) declared.set(name, range)
      }
    }
  }
  const missing: string[] = []
  const seen = new Set<string>()
  for (const dep of items.flatMap((item) => item.dependencies ?? [])) {
    const { name, version } = splitSpec(dep)
    if (seen.has(name)) continue
    seen.add(name)
    if (declared.has(name)) {
      const range = parseVersion(declared.get(name))
      const wanted = parseVersion(version)
      // Below 1.0 a minor release may break, so 0.x must match on the minor too.
      const fits =
        range?.major === wanted?.major && (range?.major !== 0 || range.minor === wanted?.minor)
      if (range === null || fits) continue
    }
    missing.push(dep)
  }
  return missing
}
