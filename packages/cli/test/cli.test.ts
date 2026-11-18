import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { run, type Command, type CommandContext, type Io } from '../src/cli.ts'
import { CliError } from '../src/errors.ts'

const packageDir = fileURLToPath(new URL('..', import.meta.url))
const manifest = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')) as {
  version: string
  bin: Record<string, string>
}

function capture(cwd = process.cwd()) {
  const out: string[] = []
  const err: string[] = []
  const io: Io = { cwd, stdout: (text) => out.push(text), stderr: (text) => err.push(text) }
  return { io, out: () => out.join(''), err: () => err.join('') }
}

let seen: CommandContext[] = []
const table: Record<string, Command> = {
  greet: {
    summary: 'Say hello.',
    usage: 'heart-ui greet <name...>',
    options: {
      loud: { type: 'boolean', description: 'Shout.' },
      theme: { type: 'string', description: 'Theme name.' },
    },
    run(ctx) {
      seen.push(ctx)
      ctx.io.stdout(`hello ${ctx.args.join(' ')}\n`)
    },
  },
  fail: {
    summary: 'Fails.',
    usage: 'heart-ui fail',
    run() {
      throw new CliError('No heart-ui.json here.')
    },
  },
  crash: {
    summary: 'Crashes.',
    usage: 'heart-ui crash',
    run() {
      throw new TypeError('x is undefined')
    },
  },
}

let tmp: string
beforeEach(() => {
  seen = []
  tmp = mkdtempSync(join(tmpdir(), 'heart-ui-cli-'))
})
afterEach(() => rmSync(tmp, { recursive: true, force: true }))

describe('AC-001 the heart-ui bin prints its version', () => {
  it('runs the bin entry with --version', () => {
    const result = spawnSync(process.execPath, [join(packageDir, 'src/index.ts'), '--version'], {
      encoding: 'utf8',
    })
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    expect(result.stdout).toBe(`${manifest.version}\n`)
  })

  it('maps the heart-ui bin to the built entry, which starts with a shebang', () => {
    expect(manifest.bin).toEqual({ 'heart-ui': './dist/index.mjs' })
    expect(readFileSync(join(packageDir, 'src/index.ts'), 'utf8')).toMatch(
      /^#!\/usr\/bin\/env node\n/,
    )
  })
})

describe('AC-002 argument parsing', () => {
  it('prints help listing every command', async () => {
    const c = capture()
    expect(await run(['--help'], c.io, table)).toBe(0)
    expect(c.out()).toContain('Usage: heart-ui <command>')
    expect(c.out()).toMatch(/greet\s+Say hello\./)
    expect(c.out()).toMatch(/fail\s+Fails\./)
    expect(c.out()).toContain('--cwd')
    expect(c.err()).toBe('')
  })

  it('prints the version in process', async () => {
    const c = capture()
    expect(await run(['--version'], c.io, table)).toBe(0)
    expect(c.out()).toBe(`${manifest.version}\n`)
  })

  it("prints a command's usage and options", async () => {
    const c = capture()
    expect(await run(['greet', '--help'], c.io, table)).toBe(0)
    expect(c.out()).toContain('Usage: heart-ui greet <name...>')
    expect(c.out()).toMatch(/--loud\s+Shout\./)
    expect(c.out()).toMatch(/--theme <value>\s+Theme name\./)
    expect(c.out()).toContain('--cwd')
    expect(seen).toHaveLength(0)
  })

  it('passes positionals and boolean and string options to the command', async () => {
    const c = capture(tmp)
    expect(await run(['greet', 'a', '--loud', 'b', '--theme', 'dark'], c.io, table)).toBe(0)
    expect(c.out()).toBe('hello a b\n')
    expect(seen[0]?.args).toEqual(['a', 'b'])
    expect(seen[0]?.options).toEqual({ loud: true, theme: 'dark' })
    expect(seen[0]?.cwd).toBe(tmp)
  })

  it('accepts --option=value', async () => {
    const c = capture(tmp)
    expect(await run(['greet', '--theme=dark'], c.io, table)).toBe(0)
    expect(seen[0]?.options).toEqual({ theme: 'dark' })
  })

  it('resolves --cwd against the working directory', async () => {
    mkdirSync(join(tmp, 'app'))
    const c = capture(tmp)
    expect(await run(['greet', '--cwd', 'app'], c.io, table)).toBe(0)
    expect(seen[0]?.cwd).toBe(join(tmp, 'app'))
    expect(seen[0]?.options).toEqual({})
  })
})

describe('AC-003 argument mistakes', () => {
  const nodeText = /ERR_PARSE_ARGS|positional argument|place it at the end/

  it.each([
    [[], /Usage: heart-ui <command>/],
    [['nope'], /^heart-ui: Unknown command "nope"\. Run heart-ui --help to see the commands\.\n$/],
    [['greet', '--lod'], /^heart-ui: Unknown option --lod for "heart-ui greet"\./],
    [['greet', '-x'], /^heart-ui: Unknown option -x for "heart-ui greet"\./],
    [['greet', '--theme'], /^heart-ui: Option --theme needs a value\.\n$/],
    [['greet', '--loud=yes'], /^heart-ui: Option --loud takes no value\.\n$/],
    [['greet', '--cwd'], /^heart-ui: Option --cwd needs a value\.\n$/],
    [['greet', '--cwd', 'missing'], /^heart-ui: No such folder: .*missing\.\n$/],
  ])('%j exits 2 with one line', async (argv, message) => {
    const c = capture(tmp)
    expect(await run(argv, c.io, table)).toBe(2)
    expect(c.err()).toMatch(message)
    expect(c.err()).not.toMatch(nodeText)
    expect(c.out()).toBe('')
    expect(seen).toHaveLength(0)
  })

  it('rejects a --cwd that is a file', async () => {
    writeFileSync(join(tmp, 'file.txt'), '')
    const c = capture(tmp)
    expect(await run(['greet', '--cwd', 'file.txt'], c.io, table)).toBe(2)
    expect(c.err()).toMatch(/^heart-ui: No such folder: .*file\.txt\.\n$/)
  })
})

describe('AC-004 command errors', () => {
  it('prints a CliError message and exits 1', async () => {
    const c = capture()
    expect(await run(['fail'], c.io, table)).toBe(1)
    expect(c.err()).toBe('heart-ui: No heart-ui.json here.\n')
    expect(c.out()).toBe('')
  })

  it('prints an unexpected error as one line without a stack', async () => {
    const c = capture()
    expect(await run(['crash'], c.io, table)).toBe(1)
    expect(c.err()).toBe('heart-ui: Unexpected error. Please report it.\n')
  })
})

describe('AC-002 global options anywhere', () => {
  it.each([[['--cwd', 'app', 'greet']], [['--cwd=app', 'greet']], [['greet', '--cwd', 'app']]])(
    'accepts %j',
    async (argv) => {
      mkdirSync(join(tmp, 'app'))
      const c = capture(tmp)
      expect(await run(argv, c.io, table)).toBe(0)
      expect(seen[0]?.cwd).toBe(join(tmp, 'app'))
    },
  )

  it.each([[['greet', '--version']], [['--cwd', '.', '--version']]])(
    'prints the version for %j',
    async (argv) => {
      const c = capture(tmp)
      expect(await run(argv, c.io, table)).toBe(0)
      expect(c.out()).toBe(`${manifest.version}\n`)
      expect(seen).toHaveLength(0)
    },
  )

  it('accepts -h for help, before or after the command', async () => {
    const main = capture()
    expect(await run(['-h'], main.io, table)).toBe(0)
    expect(main.out()).toContain('Usage: heart-ui <command>')
    const command = capture()
    expect(await run(['greet', '-h'], command.io, table)).toBe(0)
    expect(command.out()).toContain('Usage: heart-ui greet')
  })
})

describe('AC-003 unreadable folders and hostile text', () => {
  it('reports a --cwd it cannot stat as a usage mistake', async () => {
    symlinkSync('loop', join(tmp, 'loop'))
    const c = capture(tmp)
    expect(await run(['greet', '--cwd', 'loop'], c.io, table)).toBe(2)
    expect(c.err()).toMatch(/^heart-ui: No such folder: .*loop\.\n$/)
  })

  it('strips control characters from what it echoes', async () => {
    const c = capture()
    expect(await run(['\u001b]8;;https://evil\u0007x'], c.io, table)).toBe(2)
    const codes = [...c.err().slice(0, -1)].map((char) => char.charCodeAt(0))
    expect(codes.filter((code) => code < 0x20 || (code >= 0x7f && code <= 0x9f))).toEqual([])
    expect(c.err()).toContain('https://evil')
  })
})

describe('AC-004 command errors without system text', () => {
  it('names only the code of an unexpected system error', async () => {
    const c = capture()
    const system = Object.assign(new Error("EACCES: permission denied, stat '/root/x'"), {
      code: 'EACCES',
    })
    const failing: Record<string, Command> = {
      io: {
        summary: 'Fails.',
        usage: 'heart-ui io',
        run() {
          throw system
        },
      },
    }
    expect(await run(['io'], c.io, failing)).toBe(1)
    expect(c.err()).toBe('heart-ui: Unexpected error (EACCES). Please report it.\n')
  })
})

describe('AC-003 round 2 option values', () => {
  it.each([
    [['greet', '--theme', '--loud'], /^heart-ui: Option --theme needs a value\.\n$/],
    [['greet', '--theme', '--cwd', 'x'], /^heart-ui: Option --theme needs a value\.\n$/],
    [['--cwd', '--help', 'greet'], /^heart-ui: Option --cwd needs a value\.\n$/],
    [['--theme', 'dark', 'greet'], /^heart-ui: Option --theme goes after the command name\./],
  ])('%j exits 2', async (argv, message) => {
    const c = capture(tmp)
    expect(await run(argv, c.io, table)).toBe(2)
    expect(c.err()).toMatch(message)
    expect(seen).toHaveLength(0)
  })

  it('accepts a value that starts with a dash when written inline', async () => {
    const c = capture(tmp)
    expect(await run(['greet', '--theme=-dark'], c.io, table)).toBe(0)
    expect(seen[0]?.options).toEqual({ theme: '-dark' })
  })
})
