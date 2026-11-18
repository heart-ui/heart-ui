import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import manifest from '../package.json' with { type: 'json' }
import { createAdd } from './commands/add.ts'
import { createInit } from './commands/init.ts'
import { createList } from './commands/list.ts'
import { CliError, printable } from './errors.ts'
import { isDirectory } from './fs.ts'

export type Io = {
  cwd: string
  stdout: (text: string) => void
  stderr: (text: string) => void
  /** Asks a yes-or-no question; absent when stdin is not a terminal. */
  confirm?: (question: string) => Promise<boolean>
}

type OptionSpec = { type: 'string' | 'boolean'; description: string; short?: string }

export type CommandContext = {
  /** The project folder: the working directory, or `--cwd` resolved against it. */
  cwd: string
  args: string[]
  options: Record<string, string | boolean>
  io: Io
}

export type Command = {
  summary: string
  usage: string
  options?: Record<string, OptionSpec>
  run: (ctx: CommandContext) => Promise<number | void> | number | void
}

/** The commands `heart-ui` runs, by name. */
export const commands: Record<string, Command> = {
  init: createInit(),
  add: createAdd(),
  list: createList(),
}

const globalOptions: Record<string, OptionSpec> = {
  cwd: { type: 'string', description: 'Run in this folder instead of the current one.' },
  help: { type: 'boolean', short: 'h', description: 'Show help.' },
  version: { type: 'boolean', description: 'Show the version.' },
}

const USAGE_ERROR = 2

// Terminal control characters in echoed input (argv, a registry's JSON, a cloned repo's config)
// could rewrite the user's terminal.

/** Runs the CLI with `argv` (no node or script path) and returns the exit code. */
export async function run(
  argv: string[],
  io: Io,
  table: Record<string, Command> = commands,
): Promise<number> {
  try {
    return await dispatch(argv, io, table)
  } catch (error) {
    if (error instanceof CliError) {
      io.stderr(`heart-ui: ${printable(error.message)}\n`)
      return error.exitCode
    }
    // A system or programming error's own text means nothing to the user; its code helps a report.
    const code = (error as { code?: unknown } | null)?.code
    const tag = typeof code === 'string' ? ` (${printable(code)})` : ''
    io.stderr(`heart-ui: Unexpected error${tag}. Please report it.\n`)
    return 1
  }
}

const globalFlags = ['--help', '-h', '--version']

// The index of the command name: the first argument that is not a global option or its value.
// A command's own options go after its name, since its option table is unknown before it.
function commandIndex(argv: string[]): number {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? ''
    if (arg === '--') return -1
    if (!arg.startsWith('-')) return i
    if (arg === '--cwd') i++
    else if (!globalFlags.includes(arg) && !arg.startsWith('--cwd=')) {
      throw new CliError(
        `Option ${arg.split('=')[0]} goes after the command name. Run heart-ui --help.`,
        USAGE_ERROR,
      )
    }
  }
  return -1
}

async function dispatch(argv: string[], io: Io, table: Record<string, Command>): Promise<number> {
  const index = commandIndex(argv)
  const name = index === -1 ? undefined : argv[index]
  const command = name !== undefined && Object.hasOwn(table, name) ? table[name] : undefined
  if (name !== undefined && !command) {
    throw new CliError(
      `Unknown command "${name}". Run heart-ui --help to see the commands.`,
      USAGE_ERROR,
    )
  }

  const specs = { ...command?.options, ...globalOptions }
  // Non-strict tokens, so every mistake gets our one-line message instead of Node's.
  const { tokens } = parseArgs({
    args: argv.filter((_, i) => i !== index),
    options: Object.fromEntries(
      Object.entries(specs).map(([key, { type, short }]) => [
        key,
        short ? { type, short } : { type },
      ]),
    ),
    strict: false,
    allowPositionals: true,
    tokens: true,
  })
  const args: string[] = []
  const options: Record<string, string | boolean> = {}
  const where = name
    ? ` for "heart-ui ${name}". Run heart-ui ${name} --help.`
    : '. Run heart-ui --help.'
  for (const token of tokens) {
    if (token.kind === 'positional') args.push(token.value)
    if (token.kind !== 'option') continue
    const spec = Object.hasOwn(specs, token.name) ? specs[token.name] : undefined
    if (!spec) throw new CliError(`Unknown option ${token.rawName}${where}`, USAGE_ERROR)
    // Without strict mode, parseArgs takes the next argument as the value even when it is an option.
    const missing = token.value === undefined || (!token.inlineValue && token.value.startsWith('-'))
    if (spec.type === 'string' && missing) {
      throw new CliError(`Option ${token.rawName} needs a value.`, USAGE_ERROR)
    }
    if (spec.type === 'boolean' && token.value !== undefined) {
      throw new CliError(`Option ${token.rawName} takes no value.`, USAGE_ERROR)
    }
    options[token.name] = token.value ?? true
  }

  const { cwd: cwdOption, help, version, ...commandOptions } = options
  if (version) {
    io.stdout(`${manifest.version}\n`)
    return 0
  }
  if (!command) {
    if (help) {
      io.stdout(mainHelp(table))
      return 0
    }
    io.stderr(mainHelp(table))
    return USAGE_ERROR
  }
  if (help) {
    io.stdout(commandHelp(command))
    return 0
  }
  const cwd = resolve(io.cwd, typeof cwdOption === 'string' ? cwdOption : '.')
  if (cwdOption !== undefined && !isDirectory(cwd)) {
    throw new CliError(`No such folder: ${cwd}.`, USAGE_ERROR)
  }
  const code = await command.run({ cwd, args, options: commandOptions, io })
  return typeof code === 'number' ? code : 0
}

function columns(rows: [string, string][]): string {
  const width = Math.max(...rows.map(([left]) => left.length)) + 2
  return rows.map(([left, right]) => `  ${left.padEnd(width)}${right}\n`).join('')
}

function optionRows(specs: Record<string, OptionSpec>): [string, string][] {
  return Object.entries(specs).map(([key, spec]) => [
    (spec.short ? `-${spec.short}, ` : '') +
      (spec.type === 'string' ? `--${key} ${key === 'cwd' ? '<path>' : '<value>'}` : `--${key}`),
    spec.description,
  ])
}

function mainHelp(table: Record<string, Command>): string {
  const names = Object.keys(table)
  return [
    'Usage: heart-ui <command> [options]\n\n',
    'Commands:\n',
    names.length
      ? columns(names.map((name) => [name, table[name]?.summary ?? '']))
      : '  (none yet)\n',
    '\nOptions:\n',
    columns(optionRows(globalOptions)),
    '\nRun heart-ui <command> --help for its options.\n',
  ].join('')
}

function commandHelp(command: Command): string {
  return [
    `Usage: ${command.usage}\n\n`,
    `${command.summary}\n\n`,
    'Options:\n',
    columns(optionRows({ ...command.options, ...globalOptions })),
  ].join('')
}
