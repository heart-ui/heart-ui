import { readFileSync, realpathSync, statSync } from 'node:fs'
import { extname, relative, resolve, sep } from 'node:path'
import { auditSource, type CheckResult, hasHtmlTemplate } from '../audit/checks.ts'
import { MAX_DEPTH, MAX_EXPRESSIONS, TooDeepError } from '../audit/scan.ts'
import type { Command, Io } from '../cli.ts'
import { CliError, escapeControls, printable } from '../errors.ts'

const extensions = new Set(['.vue', '.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs'])
// Screens are small; the cap keeps a hostile file from holding the audit (or the MCP server) up.
const MAX_BYTES = 512 * 1024

/** The `audit` command: the screen checklist A1 to A8 (docs/agent-support.md). */
export function createAudit(): Command {
  return {
    summary: 'Check screen files against the Heart UI checklist (A1 to A8).',
    usage: 'heart-ui audit <file...> [--json]',
    options: {
      json: { type: 'boolean', description: 'Print the results as JSON.' },
    },
    run: (ctx) => audit(ctx.cwd, ctx.args, ctx.options.json === true, ctx.io),
  }
}

function read(path: string, shown: string): string {
  try {
    const stat = statSync(path)
    if (stat.isDirectory()) throw new CliError(`${shown} is a folder: name the files to audit.`, 2)
    // A device or pipe (a committed link to /dev/zero) would read forever or block.
    if (!stat.isFile()) throw new CliError(`Can't audit ${shown}: it is not a regular file.`, 2)
    if (stat.size > MAX_BYTES) {
      throw new CliError(`Can't audit ${shown}: it is larger than 512 KB.`, 2)
    }
    return readFileSync(path, 'utf8')
  } catch (error) {
    if (error instanceof CliError) throw error
    const code = (error as { code?: unknown }).code
    if (code === 'ENOENT') throw new CliError(`No such file: ${shown}.`, 2)
    if (code === 'EISDIR') throw new CliError(`${shown} is a folder: name the files to audit.`, 2)
    throw new CliError(`Can't read ${shown}.`)
  }
}

// A parent route or layout the user didn't name: read only a regular file, under the size cap,
// whose real path stays inside the project, so a committed symlink can't reach out or block.
function readInside(root: string): (path: string) => string | undefined {
  const realRoot = realpathSync(root)
  return (path) => {
    try {
      const real = realpathSync(path)
      if (real !== realRoot && !real.startsWith(realRoot + sep)) return undefined
      const stat = statSync(real)
      if (!stat.isFile() || stat.size > MAX_BYTES) return undefined
      return readFileSync(real, 'utf8')
    } catch {
      return undefined
    }
  }
}

function audit(cwd: string, args: string[], json: boolean, io: Io): number {
  if (!args.length) throw new CliError('Name the files to audit: heart-ui audit <file...>.', 2)
  const inputs = args.map((arg) => {
    const path = resolve(cwd, arg)
    const shown = relative(cwd, path) || arg
    const extension = extname(path).toLowerCase()
    if (!extensions.has(extension)) {
      throw new CliError(`Can't audit ${shown}: only .vue, .ts and .js files.`, 2)
    }
    const source = read(path, shown)
    const vue = extension === '.vue'
    return { path, shown, source, vue }
  })

  const readFile = readInside(cwd)
  const files: { file: string; checks: CheckResult[] }[] = inputs.map((input) => {
    try {
      if (input.vue && !hasHtmlTemplate(input.source)) {
        throw new CliError(`Can't audit ${input.shown}: its template is not HTML.`, 2)
      }
      const options = { vue: input.vue, root: cwd, readFile }
      return { file: input.shown, checks: auditSource(input.path, input.source, options) }
    } catch (error) {
      if (!(error instanceof TooDeepError)) throw error
      const why =
        error.reason === 'code'
          ? 'its code is nested too deeply to parse'
          : error.reason === 'expressions'
            ? `it holds more than ${MAX_EXPRESSIONS} template expressions`
            : error.reason === 'comments'
              ? 'its block comments sit on lines too long to parse in time'
              : `it nests deeper than ${MAX_DEPTH} levels`
      throw new CliError(`Can't audit ${input.shown}: ${why}.`, 2)
    }
  })
  const failures = files.flatMap(({ checks }) => checks.flatMap((check) => check.findings))
  const failing = files.filter(({ checks }) => checks.some((check) => !check.pass)).length

  if (json) {
    io.stdout(`${escapeControls(JSON.stringify({ ok: failures.length === 0, files }))}\n`)
    return failures.length ? 1 : 0
  }
  for (const { file, checks } of files) {
    const lines = checks
      .flatMap((check) => check.findings.map((finding) => ({ ...finding, id: check.id })))
      .sort((a, b) => a.line - b.line)
    for (const finding of lines) {
      io.stdout(
        `${printable(file)}:${finding.line}  ${finding.id}  ${printable(finding.message)}\n`,
      )
    }
  }
  const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`
  io.stdout(
    failures.length
      ? `${plural(failures.length, 'failure')} in ${failing} of ${plural(files.length, 'file')}.\n`
      : `No failures in ${plural(files.length, 'file')}.\n`,
  )
  return failures.length ? 1 : 0
}
