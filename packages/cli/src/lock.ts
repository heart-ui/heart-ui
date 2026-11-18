import { createHash } from 'node:crypto'
import { CliError } from './errors.ts'
import { isObject, readJsonFile } from './fs.ts'

/** What `add` and `update` installed (docs/registry.md, Lock file). */
export type Lock = { items: Record<string, LockEntry> }
export type LockEntry = {
  registry: string
  version: string | null
  /** Path relative to the project root, to `sha256-<base64>` of the file as written. */
  files: Record<string, string>
}

export const LOCK_FILE = 'heart-ui.lock.json'

/** The Subresource Integrity form of `text`'s SHA-256. */
export function hashText(text: string): string {
  return `sha256-${createHash('sha256').update(text).digest('base64')}`
}

/** Reads the lock file; an empty lock when there is none. */
export async function readLock(path: string): Promise<{ lock: Lock; text?: string }> {
  const value = await readJsonFile(path)
  if (value === undefined) return { lock: { items: {} } }
  if (!isLock(value)) throw new CliError(`${path} is not a valid lock file.`)
  return { lock: value, text: formatLock(value) }
}

/** The lock as written: two-space JSON, items sorted by key, a final newline. */
export function formatLock(lock: Lock): string {
  const items = Object.fromEntries(Object.entries(lock.items).sort(([a], [b]) => (a < b ? -1 : 1)))
  return `${JSON.stringify({ items }, null, 2)}\n`
}

function isLock(value: unknown): value is Lock {
  if (!isObject(value) || !isObject(value.items)) return false
  return Object.values(value.items).every(
    (entry) =>
      isObject(entry) &&
      typeof entry.registry === 'string' &&
      (entry.version === null || typeof entry.version === 'string') &&
      isObject(entry.files) &&
      Object.values(entry.files).every((digest) => typeof digest === 'string'),
  )
}
