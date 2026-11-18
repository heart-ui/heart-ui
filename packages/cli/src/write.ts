import { mkdir, readFile, realpath, rm, rmdir } from 'node:fs/promises'
import { dirname, relative } from 'node:path'
import { CliError } from './errors.ts'
import { editFile, writeNewFile } from './fs.ts'

/** A file to create (never replacing anything) or to edit (only while it still holds `original`). */
export type Step =
  | { kind: 'create'; path: string; content: string }
  | { kind: 'edit'; path: string; content: string; original: string }

/**
 * Runs `steps` in order, then `after` (an install, say). On any failure every step is undone
 * (created files and folders removed, edits restored), and whatever could not be undone is named.
 * `command` and `outcome` word the message: `init` and "nothing was set up". A failure of `after`
 * keeps its own message.
 */
export async function writeSteps(
  steps: Step[],
  show: (path: string) => string,
  command: string,
  outcome: string,
  after?: () => Promise<void>,
): Promise<void> {
  const created: string[] = []
  const createdDirs: string[] = []
  const edited: Step[] = []
  let failure = ''
  let afterError: unknown
  try {
    for (const step of steps) {
      failure = `Could not write ${show(step.path)}`
      if (step.kind === 'create') {
        const first = await mkdir(dirname(step.path), { recursive: true })
        if (first) createdDirs.push(...newDirs(first, dirname(step.path)))
        await writeNewFile(step.path, step.content)
        created.push(step.path)
      } else {
        // A prompt or a slow fetch may have taken a while; never replace a change made meanwhile.
        if ((await readFile(step.path, 'utf8')) !== step.original) {
          failure = `${show(step.path)} changed while ${command} was waiting`
          throw new Error(failure)
        }
        await editFile(step.path, step.content)
        edited.push(step)
      }
    }
    if (after) {
      failure = 'The last step failed'
      try {
        await after()
      } catch (error) {
        afterError = error
        throw error
      }
    }
  } catch {
    const left: string[] = []
    for (const step of edited.reverse()) {
      if (step.kind !== 'edit') continue
      await editFile(step.path, step.original).catch(() => left.push(show(step.path)))
    }
    for (const path of created.reverse()) {
      await rm(path, { force: true }).catch(() => left.push(show(path)))
    }
    for (const dir of createdDirs.reverse()) await rmdir(dir).catch(() => {})
    if (afterError instanceof CliError) {
      if (!left.length) throw afterError
      failure = afterError.message.replace(/\.$/, '')
    }
    if (left.length) {
      throw new CliError(
        `${failure}, and could not undo ${left.join(', ')}. Restore them and run heart-ui ${command} again.`,
      )
    }
    throw new CliError(`${failure}; ${outcome}.`)
  }
}

// The folders from `first` (the outermost one mkdir created) down to `last`, outermost first.
function newDirs(first: string, last: string): string[] {
  const dirs: string[] = []
  for (let dir = last; ; dir = dirname(dir)) {
    dirs.unshift(dir)
    if (dir === first || dirname(dir) === dir) return dirs
  }
}

/** Refuses to edit `path` when it links outside `root`, as a cloned repo's file may (~/.bashrc). */
export async function refuseOutside(
  root: string,
  path: string,
  show: (path: string) => string,
  command: string,
): Promise<void> {
  const [target, base] = await Promise.all([realpath(path), realpath(root)])
  const inside = relative(base, target)
  if (inside.startsWith('..') || inside === '' || /^[/\\]|^[A-Za-z]:/.test(inside)) {
    throw new CliError(
      `${show(path)} links outside the project, so ${command} will not edit it. Replace the link with a file and run heart-ui ${command} again.`,
    )
  }
}
