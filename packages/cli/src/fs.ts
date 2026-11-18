import { randomBytes } from 'node:crypto'
import { statSync } from 'node:fs'
import { open, readFile, rename, rm } from 'node:fs/promises'
import { CliError } from './errors.ts'

/** Writes `text` so that a crash at any moment leaves either the old file or the new one. */
export async function writeFileAtomic(path: string, text: string): Promise<void> {
  const temp = `${path}.${randomBytes(6).toString('hex')}.tmp`
  try {
    const handle = await open(temp, 'wx')
    try {
      await handle.writeFile(text)
      await handle.sync()
    } finally {
      await handle.close()
    }
    await rename(temp, path)
  } catch (error) {
    await rm(temp, { force: true })
    throw error
  }
}

/** Reads and parses a JSON file; `undefined` when it does not exist. */
export async function readJsonFile(
  path: string,
  parse: (text: string) => unknown = JSON.parse,
): Promise<unknown> {
  let text: string
  try {
    text = await readFile(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw new CliError(`Could not read ${path}.`)
  }
  try {
    // Editors on Windows save JSON with a byte order mark, which JSON.parse rejects.
    return parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text)
  } catch {
    throw new CliError(`${path} is not valid JSON.`)
  }
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stat(path: string) {
  try {
    return statSync(path, { throwIfNoEntry: false })
  } catch {
    // A folder we may not search, or a symlink loop: nothing usable there.
    return undefined
  }
}

export const isFile = (path: string) => stat(path)?.isFile() ?? false
export const isDirectory = (path: string) => stat(path)?.isDirectory() ?? false
