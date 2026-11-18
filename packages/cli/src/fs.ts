import { randomBytes } from 'node:crypto'
import { lstatSync, statSync } from 'node:fs'
import {
  chmod,
  link,
  open,
  readFile,
  realpath,
  rename,
  rm,
  stat as statFile,
} from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { CliError } from './errors.ts'

// Writes `text` to a new temp file beside `near`, flushed to disk, and returns its path.
async function writeTemp(near: string, text: string): Promise<string> {
  const temp = join(dirname(near), `.${randomBytes(6).toString('hex')}.tmp`)
  const handle = await open(temp, 'wx')
  try {
    await handle.writeFile(text)
    await handle.sync()
  } catch (error) {
    await handle.close()
    await rm(temp, { force: true })
    throw error
  }
  await handle.close()
  return temp
}

/** Writes `text` so that a crash at any moment leaves either the old file or the new one. */
export async function writeFileAtomic(path: string, text: string): Promise<void> {
  let temp = ''
  try {
    temp = await writeTemp(path, text)
    await rename(temp, path)
  } catch (error) {
    if (temp) await rm(temp, { force: true })
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

/** True when anything sits at `path`: a file, a folder, or a symlink, even a dangling one. */
export function exists(path: string): boolean {
  try {
    lstatSync(path)
    return true
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    return code !== 'ENOENT' && code !== 'ENOTDIR'
  }
}

/** Creates `path` with `text`, failing with EEXIST rather than replacing anything already there. */
export async function writeNewFile(path: string, text: string): Promise<void> {
  const temp = await writeTemp(path, text)
  try {
    // link, unlike rename, refuses an existing target, so a file created meanwhile survives.
    await link(temp, path)
  } finally {
    await rm(temp, { force: true })
  }
}

/** Replaces the contents of an existing file in place of its link target, keeping its mode. */
export async function editFile(path: string, text: string): Promise<void> {
  const target = await realpath(path)
  const { mode } = await statFile(target)
  const temp = await writeTemp(target, text)
  try {
    await chmod(temp, mode)
    await rename(temp, target)
  } catch (error) {
    await rm(temp, { force: true })
    throw error
  }
}
