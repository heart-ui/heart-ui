// Writes each registry item's `<name>.api.json`: the component API users rely on, committed so
// every change to it shows in review (docs/conventions.md, Docs site).
// Usage: node scripts/registry-api.ts [--check] [--registry <dir>] [--changesets <dir>]
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  type ApiSnapshot,
  apiChecker,
  breakingChanges,
  type Checker,
  isBreakingBump,
  itemExports,
  itemSnapshot,
  snapshotText,
} from './api-snapshot.ts'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const kinds = ['ui', 'blocks', 'layouts', 'lib']

class ApiError extends Error {}

/** One snapshot file: what the code says it should hold, and what it holds now (null: none). */
export interface SnapshotEntry {
  name: string
  /** Relative to the registry, `ui/button/button.api.json`. */
  file: string
  path: string
  expected: string | null
  current: string | null
}

const readText = (path: string) => (existsSync(path) ? readFileSync(path, 'utf8') : null)

/**
 * Every snapshot the registry should hold, and every snapshot file it holds that no component
 * explains. With `extract` false only presence is checked: an existing snapshot counts as
 * current, so no type checker starts (it takes seconds, and the registry build runs often).
 */
export function snapshotEntries(registry: string, extract = true): SnapshotEntry[] {
  if (!kinds.some((kind) => existsSync(join(registry, kind)))) {
    throw new ApiError(`${registry} holds no ${kinds.join(', ')} folder; is --registry right?`)
  }
  let checker: Checker | undefined
  const lazy = () => {
    if (!existsSync(join(registry, 'tsconfig.json'))) {
      throw new ApiError(
        `${join(registry, 'tsconfig.json')} is missing; the API needs the registry's path aliases`,
      )
    }
    return (checker ??= apiChecker(registry))
  }
  const entries: SnapshotEntry[] = []
  for (const kind of kinds) {
    const kindDir = join(registry, kind)
    if (!existsSync(kindDir) || !statSync(kindDir).isDirectory()) continue
    for (const name of readdirSync(kindDir).sort()) {
      const dir = join(kindDir, name)
      if (name.startsWith('.') || !statSync(dir).isDirectory()) continue
      const stray = readdirSync(dir).filter((file) => file.endsWith('.api.json'))
      const itemPath = join(dir, 'item.json')
      const isItem = existsSync(itemPath) && !name.startsWith('_')
      const hasComponents = isItem && itemExports(dir).length > 0
      const own = `${name}.api.json`
      if (hasComponents) {
        const path = join(dir, own)
        const current = readText(path)
        let expected: string
        if (extract) {
          const item = JSON.parse(readFileSync(itemPath, 'utf8')) as {
            meta?: { version?: unknown }
          }
          const version = typeof item.meta?.version === 'string' ? item.meta.version : ''
          expected = snapshotText(itemSnapshot(lazy, { name, version, dir })!)
        } else {
          expected = current ?? ''
        }
        entries.push({ name, file: `${kind}/${name}/${own}`, path, expected, current })
      }
      for (const file of stray.filter((entry) => !hasComponents || entry !== own)) {
        const path = join(dir, file)
        entries.push({
          name,
          file: `${kind}/${name}/${file}`,
          path,
          expected: null,
          current: readText(path),
        })
      }
    }
  }
  return entries
}

/** What is out of date, one line each; empty when every snapshot is current. */
export function snapshotProblems(entries: SnapshotEntry[]): string[] {
  return entries
    .filter((entry) => entry.expected !== entry.current)
    .map((entry) => {
      const what =
        entry.expected === null
          ? 'belongs to no component'
          : entry.current === null
            ? 'is missing'
            : 'is stale'
      return `${entry.file} ${what}; run pnpm registry:api`
    })
}

function git(cwd: string, args: string[]) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return { ok: result.status === 0, out: result.stdout ?? '', error: result.error }
}

// `available` is false outside git, where the working tree stands in. `read` gives a snapshot's
// committed text by its path relative to the registry, `files` every committed snapshot, and
// `isNew` whether a changeset (absolute path) was added or changed on this branch.
interface Baseline {
  available: boolean
  read: (file: string) => string | null
  files: () => string[]
  isNew: (path: string) => boolean
}

// The snapshots as committed where this branch left main (the merge base with origin/main): the
// baseline a break is judged against, so a deleted or conflicted file can't hide one. Without
// origin/main, CI refuses (it would judge against the branch itself) and a local run warns and
// uses HEAD.
function committedBaseline(registry: string, warn: (text: string) => void): Baseline {
  const none: Baseline = { available: false, read: () => null, files: () => [], isNew: () => true }
  const topLevel = git(registry, ['rev-parse', '--show-toplevel'])
  if (topLevel.error) throw new ApiError(`git could not start (${topLevel.error.message})`)
  if (!topLevel.ok) return none
  const root = realpathSync(topLevel.out.trim())
  const inRepo = (path: string) => relative(root, realpathSync(path)).split(sep).join('/')
  const folder = inRepo(registry)
  // A registry git ignores (a scratch copy) has no history: its working tree stands in.
  if (folder && git(root, ['check-ignore', '-q', folder]).ok) return none
  let base = git(root, ['merge-base', 'HEAD', 'origin/main'])
  if (!base.ok) {
    if (process.env.CI) {
      throw new ApiError(
        'origin/main is not available, so breaking changes cannot be judged; fetch full history (fetch-depth: 0)',
      )
    }
    base = git(root, ['rev-parse', '--verify', '--quiet', 'HEAD'])
    if (!base.ok) return none
    warn('origin/main is not available; judging breaking changes against HEAD')
  }
  const ref = base.out.trim()
  const inFolder = (file: string) => (folder ? `${folder}/${file}` : file)
  return {
    available: true,
    read: (file) => {
      const shown = git(root, ['show', `${ref}:${inFolder(file)}`])
      return shown.ok ? shown.out : null
    },
    files: () =>
      git(root, ['ls-tree', '-r', '--name-only', ref, '--', folder || '.'])
        .out.split('\n')
        .filter((path) => path.endsWith('.api.json'))
        .map((path) => (folder ? path.slice(folder.length + 1) : path)),
    isNew: (path) => {
      if (!existsSync(path)) return false
      const file = inRepo(path)
      // A changeset git ignores can't be judged by history: it counts as pending.
      if (git(root, ['check-ignore', '-q', file]).ok) return true
      const committed = git(root, ['cat-file', '-e', `${ref}:${file}`]).ok
      if (!committed) return true
      return !git(root, ['diff', '--quiet', ref, '--', file]).ok
    },
  }
}

// The changeset lines that announce a break: BREAKING and the item's name in backticks on one
// line, in a changeset added on this branch and not yet released (pre mode keeps released ones in
// the folder, listed in pre.json).
function announcements(changesets: string, baseline: Baseline): string[] {
  if (!existsSync(changesets)) return []
  let released: string[] = []
  try {
    const pre = JSON.parse(readFileSync(join(changesets, 'pre.json'), 'utf8')) as {
      changesets?: unknown
    }
    if (Array.isArray(pre.changesets)) released = pre.changesets.map(String)
  } catch {
    // No pre mode, or no readable pre.json: every changeset in the folder is pending.
  }
  return readdirSync(changesets)
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .filter((file) => !released.includes(file.slice(0, -3)))
    .filter((file) => baseline.isNew(join(changesets, file)))
    .flatMap((file) => readFileSync(join(changesets, file), 'utf8').split('\n'))
    .filter((line) => line.includes('BREAKING'))
}

function parsed(text: string | null): ApiSnapshot | null {
  if (text === null) return null
  try {
    const value = JSON.parse(text) as ApiSnapshot
    return Array.isArray(value?.components) ? value : null
  } catch {
    return null
  }
}

/**
 * Each breaking change since the baseline that lacks its announcement: the version raised at the
 * breaking position and a changeset line naming the item. Removed items count too.
 */
export function unannouncedBreaks(
  registry: string,
  entries: SnapshotEntry[],
  changesets: string,
  warn: (text: string) => void = () => {},
): string[] {
  const baseline = committedBaseline(registry, warn)
  const lines = announcements(changesets, baseline)
  const problems: string[] = []
  const judge = (file: string, name: string, before: ApiSnapshot, after: ApiSnapshot | null) => {
    const breaking = breakingChanges(before, after ?? { ...before, components: [] })
    if (breaking.length === 0) return
    const needs = [
      ...(after === null || isBreakingBump(before.version, after.version)
        ? []
        : [`a version above ${before.version} at the breaking position (now ${after.version})`]),
      ...(lines.some((line) => line.includes(`\`${name}\``))
        ? []
        : [`a changeset line that says BREAKING and names \`${name}\``]),
    ]
    if (needs.length > 0) {
      problems.push(
        `${file}: breaking change (${breaking.join('; ')}); needs ${needs.join(' and ')}`,
      )
    }
  }
  // An item still in the registry keeps its version requirement even with no snapshot left.
  const emptied = (file: string, before: ApiSnapshot): ApiSnapshot | null => {
    const version = itemVersion(join(registry, dirname(file)))
    return version ? { ...before, version, components: [] } : null
  }
  const seen = new Set<string>()
  for (const entry of entries) {
    seen.add(entry.file)
    // With git, only what main holds can break users: a snapshot new on this branch is free.
    const before = baseline.available ? parsed(baseline.read(entry.file)) : parsed(entry.current)
    if (!before) continue
    const after = entry.expected === null ? emptied(entry.file, before) : parsed(entry.expected)
    judge(entry.file, entry.name, before, after)
  }
  for (const file of baseline.files()) {
    if (seen.has(file) || existsSync(join(registry, file))) continue
    const before = parsed(baseline.read(file))
    if (before) judge(file, before.name, before, emptied(file, before))
  }
  return problems
}

function itemVersion(dir: string): string | null {
  try {
    const item = JSON.parse(readFileSync(join(dir, 'item.json'), 'utf8')) as {
      meta?: { version?: unknown }
    }
    return typeof item.meta?.version === 'string' ? item.meta.version : null
  } catch {
    return null
  }
}

/** Rewrites the snapshots; refuses, writing nothing, when a breaking change isn't announced. */
export function writeSnapshots(
  registry: string,
  changesets: string,
  warn: (text: string) => void = () => {},
) {
  const entries = snapshotEntries(registry)
  const refused = unannouncedBreaks(registry, entries, changesets, warn)
  if (refused.length > 0) throw new ApiError(refused.join('\n'))
  const written: string[] = []
  for (const entry of entries) {
    if (entry.expected === entry.current) continue
    if (entry.expected === null) rmSync(entry.path, { force: true })
    else writeFileSync(entry.path, entry.expected)
    written.push(entry.file)
  }
  return { total: entries.filter((entry) => entry.expected !== null).length, written }
}

function options(args: string[]) {
  const values: Record<string, string> = {
    '--registry': join(repo, 'registry'),
    '--changesets': join(repo, '.changeset'),
  }
  let check = false
  for (let at = 0; at < args.length; at++) {
    const flag = args[at]!
    if (flag === '--check') {
      check = true
      continue
    }
    if (!Object.hasOwn(values, flag)) {
      throw new ApiError(
        `unknown argument ${flag}; use [--check] [--registry <dir>] [--changesets <dir>]`,
      )
    }
    const value = args[++at]
    if (value === undefined || value.startsWith('--')) throw new ApiError(`${flag} needs a value`)
    values[flag] = value
  }
  return { check, registry: values['--registry']!, changesets: values['--changesets']! }
}

// Real paths on both sides, so the script also runs when started through a symlink.
const entry = process.argv[1] && existsSync(process.argv[1]) ? realpathSync(process.argv[1]) : ''
if (entry === realpathSync(fileURLToPath(import.meta.url))) {
  const warn = (text: string) => process.stderr.write(`registry:api: warning: ${text}\n`)
  try {
    const { check, registry, changesets } = options(process.argv.slice(2))
    if (check) {
      const entries = snapshotEntries(registry)
      const problems = [
        ...snapshotProblems(entries),
        ...unannouncedBreaks(registry, entries, changesets, warn),
      ]
      if (problems.length > 0) throw new ApiError(problems.join('\n'))
      process.stdout.write('registry:api: every snapshot is current\n')
    } else {
      const { total, written } = writeSnapshots(registry, changesets, warn)
      for (const file of written) process.stdout.write(`registry:api: wrote ${file}\n`)
      process.stdout.write(`registry:api: ${total} snapshots, ${written.length} changed\n`)
    }
  } catch (error) {
    const message = error instanceof ApiError ? error.message : `failed: ${String(error)}`
    process.stderr.write(`registry:api: ${message.split('\n').join('\nregistry:api: ')}\n`)
    process.exit(1)
  }
}
