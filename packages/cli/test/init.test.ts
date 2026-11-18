import {
  chmodSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { generateTheme, type Knobs } from '@heart-ui/theme'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { run } from '../src/cli.ts'
import { createInit, installCommand, type Installer } from '../src/commands/init.ts'
import { CliError } from '../src/errors.ts'
import {
  buildRegistry,
  capture,
  copyFixture,
  listFiles,
  registryFetch,
  registryUrl,
  repo,
} from './helpers/project.ts'

const defaultKnobs = JSON.parse(
  readFileSync(join(repo, 'registry/themes/default.json'), 'utf8'),
) as Knobs
const themeCss = readFileSync(join(repo, 'packages/theme/css/theme.css'), 'utf8')

type Item = { dependencies?: string[]; files: { path: string; content: string }[] }
let out: string
let item: (name: string) => Item
beforeAll(() => {
  out = buildRegistry()
  item = (name) => JSON.parse(readFileSync(join(out, 'r', `${name}.json`), 'utf8')) as Item
}, 120_000)
afterAll(() => rmSync(dirname(out), { recursive: true, force: true }))

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(dirname(root), { recursive: true, force: true })
})

function project(name: string, change?: (root: string) => void) {
  const root = copyFixture(name)
  roots.push(root)
  change?.(root)
  return root
}

function setup(
  options: { overrides?: Record<string, unknown>; nodeVersion?: string; fail?: boolean } = {},
) {
  const installs: { manager: string; deps: string[]; cwd: string }[] = []
  const install: Installer = async (manager, deps, cwd) => {
    installs.push({ manager, deps, cwd })
    if (options.fail) throw new CliError('pnpm exited with 1')
  }
  const registry = registryFetch(out, options.overrides)
  const init = createInit({
    fetch: registry.fetch,
    install,
    nodeVersion: options.nodeVersion ?? '22.18.0',
    // A cache per test, so one test's item never stands in for another's.
    cacheDir: mkdtempSync(join(dirname(out), 'cache-')),
    registryUrl,
  })
  return { table: { init }, installs, calls: registry.calls }
}

type Manifest = { dependencies: Record<string, string>; devDependencies: Record<string, string> }
const read = (root: string, path: string) => readFileSync(join(root, path), 'utf8')
const editJson = (root: string, path: string, change: (json: Manifest) => void) => {
  const json = JSON.parse(read(root, path)) as Manifest
  change(json)
  writeFileSync(join(root, path), JSON.stringify(json))
}
const helperDeps = () => [
  ...(item('utils').dependencies ?? []),
  ...(item('icon').dependencies ?? []),
]

describe('AC-001 a Vite project', () => {
  it('writes the config, theme, helpers and agent file, and installs the helpers once', async () => {
    const root = project('init-vite')
    const { table, installs } = setup()
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table)).toBe(0)
    expect(c.err()).toBe('')

    expect(JSON.parse(read(root, 'heart-ui.json'))).toEqual({
      framework: 'vite',
      css: 'src/assets/css/theme.css',
      aliases: {
        ui: '@/components/ui',
        blocks: '@/components/blocks',
        layouts: '@/layouts',
        lib: '@/lib',
      },
      iconSet: 'fluent',
      registries: { '@heart-ui': registryUrl },
    })
    expect(read(root, 'src/assets/css/theme.css')).toBe(themeCss)
    expect(read(root, 'src/assets/css/tokens.css')).toBe(generateTheme(defaultKnobs))
    for (const name of ['utils', 'icon']) {
      for (const file of item(name).files) {
        expect(read(root, file.path.replace(/^registry\/lib\//, 'src/lib/'))).toBe(file.content)
      }
    }
    expect(installs).toEqual([{ manager: 'pnpm', deps: helperDeps(), cwd: root }])
    expect(c.out()).toContain('src/assets/css/theme.css')
    expect(c.out()).toContain('heart-ui.json')
  })

  it('rewrites helper imports to the aliases it writes', async () => {
    const root = project('init-vite')
    const { table } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    expect(read(root, 'src/lib/icon/icon.ts')).toMatch(/from '@\/lib\/utils\/utils'/)
  })
})

describe('AC-003 a Nuxt project', () => {
  it('writes under app/ and records nuxt', async () => {
    const root = project('init-nuxt')
    const { table, installs } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    const config = JSON.parse(read(root, 'heart-ui.json')) as { framework: string; css: string }
    expect(config.framework).toBe('nuxt')
    expect(config.css).toBe('app/assets/css/theme.css')
    expect(read(root, 'app/assets/css/tokens.css')).toBe(generateTheme(defaultKnobs))
    expect(read(root, 'app/lib/utils/utils.ts')).toBe(item('utils').files[0]?.content)
    expect(installs[0]?.manager).toBe('npm')
  })
})

describe('AC-004 minimum versions', () => {
  const failsWith = async (root: string, message: string, nodeVersion?: string) => {
    const before = listFiles(root)
    const { table, installs } = setup({ nodeVersion })
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table)).toBe(1)
    expect(c.err()).toBe(`heart-ui: ${message}\n`)
    expect(listFiles(root)).toEqual(before)
    expect(installs).toEqual([])
  }

  it('needs Node 22', async () => {
    await failsWith(
      project('init-vite'),
      'Node 20.11.0 found; Heart UI needs Node 22 or later.',
      '20.11.0',
    )
  })

  it('needs Vue 3.5', async () => {
    const root = project('init-vite', (r) =>
      editJson(r, 'package.json', (p) => (p.dependencies.vue = '~3.4.0')),
    )
    await failsWith(root, 'Vue 3.4 found; Heart UI needs Vue 3.5 or later.')
  })

  it('needs Vue in a Vite project', async () => {
    const root = project('init-vite', (r) =>
      editJson(r, 'package.json', (p) => delete p.dependencies.vue),
    )
    await failsWith(root, 'Vue not found; Heart UI needs Vue 3.5 or later.')
  })

  it('needs Nuxt 4', async () => {
    const root = project('init-nuxt', (r) =>
      editJson(r, 'package.json', (p) => (p.dependencies.nuxt = '3.15.4')),
    )
    await failsWith(root, 'Nuxt 3.15 found; Heart UI needs Nuxt 4 or later.')
  })

  it('needs Tailwind CSS 4', async () => {
    const root = project('init-vite', (r) =>
      editJson(r, 'package.json', (p) => (p.devDependencies.tailwindcss = '^3.4.17')),
    )
    await failsWith(root, 'Tailwind CSS 3.4 found; Heart UI needs Tailwind CSS 4 or later.')
  })

  it('reads the installed version over the declared range', async () => {
    const root = project('init-vite', (r) => {
      mkdirSync(join(r, 'node_modules/vue'), { recursive: true })
      writeFileSync(join(r, 'node_modules/vue/package.json'), JSON.stringify({ version: '3.4.38' }))
    })
    await failsWith(root, 'Vue 3.4 found; Heart UI needs Vue 3.5 or later.')
  })

  it('needs Tailwind CSS at all', async () => {
    const root = project('init-vite', (r) =>
      editJson(r, 'package.json', (p) => delete p.devDependencies.tailwindcss),
    )
    await failsWith(
      root,
      'Tailwind CSS not found; Heart UI needs Tailwind CSS 4 or later. Set it up first: https://tailwindcss.com/docs/installation',
    )
  })

  it('needs Nuxt or Vite', async () => {
    const root = project('init-vite', (r) =>
      editJson(r, 'package.json', (p) => delete p.devDependencies.vite),
    )
    await failsWith(root, `No Nuxt or Vite project in ${root}; Heart UI works with either.`)
  })
})

describe('AC-005 presets', () => {
  it('writes the chosen preset', async () => {
    const root = project('init-vite')
    const { table } = setup()
    expect(await run(['init', '--yes', '--theme', 'default'], capture(root).io, table)).toBe(0)
    expect(read(root, 'src/assets/css/tokens.css')).toBe(generateTheme(defaultKnobs))
  })

  it('names the presets for an unknown one and writes nothing', async () => {
    const root = project('init-vite')
    const before = listFiles(root)
    const { table } = setup()
    const c = capture(root)
    expect(await run(['init', '--yes', '--theme', 'neon'], c.io, table)).toBe(1)
    expect(c.err()).toBe('heart-ui: No theme preset "neon". Presets: default.\n')
    expect(listFiles(root)).toEqual(before)
  })
})

describe('AC-006 existing files', () => {
  it.each([
    [
      'heart-ui.json',
      /^heart-ui: heart-ui\.json already exists in .*; Heart UI is already set up here\.\n$/,
    ],
    [
      'src/lib/utils/utils.ts',
      /^heart-ui: src\/lib\/utils\/utils\.ts already exists\. Move it away and run heart-ui init again\.\n$/,
    ],
    [
      'src/assets/css/tokens.css',
      /^heart-ui: src\/assets\/css\/tokens\.css already exists\. Move it away and run heart-ui init again\.\n$/,
    ],
  ])('refuses when %s exists', async (path, message) => {
    const root = project('init-vite', (r) => {
      mkdirSync(dirname(join(r, path)), { recursive: true })
      writeFileSync(join(r, path), 'mine\n')
    })
    const before = listFiles(root)
    const { table, installs } = setup()
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table)).toBe(1)
    expect(c.err()).toMatch(message)
    expect(listFiles(root)).toEqual(before)
    expect(read(root, path)).toBe('mine\n')
    expect(installs).toEqual([])
  })
})

describe('AC-007 confirmation', () => {
  it('asks before writing when interactive', async () => {
    const root = project('init-vite')
    const questions: string[] = []
    const { table } = setup()
    const c = capture(root, async (question) => {
      questions.push(question)
      return true
    })
    expect(await run(['init'], c.io, table)).toBe(0)
    expect(questions).toHaveLength(1)
    expect(c.out()).toContain('src/assets/css/tokens.css')
    expect(read(root, 'heart-ui.json')).toContain('"vite"')
  })

  it('writes nothing when the answer is no', async () => {
    const root = project('init-vite')
    const before = listFiles(root)
    const { table, installs } = setup()
    const c = capture(root, async () => false)
    expect(await run(['init'], c.io, table)).toBe(1)
    expect(c.err()).toBe('heart-ui: Cancelled; nothing was written.\n')
    expect(listFiles(root)).toEqual(before)
    expect(installs).toEqual([])
  })

  it('asks for --yes when it cannot ask', async () => {
    const root = project('init-vite')
    const before = listFiles(root)
    const { table } = setup()
    const c = capture(root)
    expect(await run(['init'], c.io, table)).toBe(2)
    expect(c.err()).toBe(
      'heart-ui: stdin is not a terminal, so init cannot ask. Run heart-ui init --yes.\n',
    )
    expect(listFiles(root)).toEqual(before)
  })
})

describe('AC-008 agent rule files', () => {
  it('writes AGENTS.md with the rules, under 40 lines', async () => {
    const root = project('init-vite')
    const { table } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    const agents = read(root, 'AGENTS.md')
    expect(agents.trimEnd().split('\n').length).toBeLessThan(40)
    for (const text of [
      '`@/components/ui` (src/components/ui)',
      '`@/components/blocks` (src/components/blocks)',
      '`@/layouts` (src/layouts)',
      '`@/lib` (src/lib)',
      'Pick one layout',
      'empty, loading, error',
      '`heart-ui list`',
      '`search_items`',
      'One primary action per view',
      'No raw values',
      'heart-ui audit <files>',
    ]) {
      expect(agents).toContain(text)
    }
  })

  it('appends to an existing AGENTS.md and points CLAUDE.md at it, once', async () => {
    const root = project('init-vite', (r) => {
      writeFileSync(join(r, 'AGENTS.md'), '# Ours\n\nKeep this.\n')
      writeFileSync(join(r, 'CLAUDE.md'), '# Claude\n')
    })
    const { table } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    const agents = read(root, 'AGENTS.md')
    expect(agents.startsWith('# Ours\n\nKeep this.\n')).toBe(true)
    expect(agents.match(/heart-ui:start/g)).toHaveLength(1)
    const claude = read(root, 'CLAUDE.md')
    expect(claude.startsWith('# Claude\n')).toBe(true)
    expect(claude.match(/AGENTS\.md/g)).toHaveLength(1)
  })

  it('leaves AGENTS.md and CLAUDE.md alone when they already hold Heart UI', async () => {
    const block = '<!-- heart-ui:start -->\nold\n<!-- heart-ui:end -->\n'
    const root = project('init-vite', (r) => {
      writeFileSync(join(r, 'AGENTS.md'), block)
      writeFileSync(join(r, 'CLAUDE.md'), 'Read AGENTS.md first.\n')
    })
    const { table } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    expect(read(root, 'AGENTS.md')).toBe(block)
    expect(read(root, 'CLAUDE.md')).toBe('Read AGENTS.md first.\n')
  })
})

describe('AC-009 the CSS entry', () => {
  it('replaces the one Tailwind import with the theme', async () => {
    const root = project('init-vite')
    const { table } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    expect(read(root, 'src/style.css')).toBe("@import './assets/css/theme.css';\n")
  })

  it('keeps the rest of the file and the quote style', async () => {
    const root = project('init-nuxt', (r) =>
      writeFileSync(
        join(r, 'app/assets/css/main.css'),
        "/* app */\n@import 'tailwindcss';\nbody { margin: 0; }\n",
      ),
    )
    const { table } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    expect(read(root, 'app/assets/css/main.css')).toBe(
      "/* app */\n@import './theme.css';\nbody { margin: 0; }\n",
    )
  })

  it.each([
    [
      'no file imports Tailwind',
      (r: string) => writeFileSync(join(r, 'src/style.css'), 'body {}\n'),
    ],
    [
      'two files import Tailwind',
      (r: string) => writeFileSync(join(r, 'src/other.css'), "@import 'tailwindcss';\n"),
    ],
  ])('edits nothing when %s, and says what to import', async (_, change) => {
    const root = project('init-vite', change)
    const style = read(root, 'src/style.css')
    const { table } = setup()
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table)).toBe(0)
    expect(read(root, 'src/style.css')).toBe(style)
    expect(c.out()).toContain('Import src/assets/css/theme.css')
  })
})

describe('AC-010 the @ alias', () => {
  it('names the paths entry to add and writes nothing', async () => {
    const root = project('init-vite', (r) => writeFileSync(join(r, 'tsconfig.json'), '{}'))
    const before = listFiles(root)
    const { table } = setup()
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      'heart-ui: The import alias "@" points nowhere. Add "@/*": ["./src/*"] to compilerOptions.paths in tsconfig.json, and the same alias to your Vite config.\n',
    )
    expect(listFiles(root)).toEqual(before)
  })
})

describe('AC-011 dependencies', () => {
  it('skips dependencies the project already declares', async () => {
    const [first, ...rest] = helperDeps()
    const root = project('init-vite', (r) =>
      editJson(r, 'package.json', (p) => {
        const [name, version] = (first ?? '').split(/(?<=.)@/)
        p.dependencies[name ?? ''] = version ?? ''
      }),
    )
    const { table, installs } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    expect(installs[0]?.deps).toEqual(rest)
  })

  it('installs nothing when every dependency is declared', async () => {
    const root = project('init-vite', (r) =>
      editJson(r, 'package.json', (p) => {
        for (const dep of helperDeps()) {
          const [name, version] = dep.split(/(?<=.)@/)
          p.dependencies[name ?? ''] = version ?? ''
        }
      }),
    )
    const { table, installs } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    expect(installs).toEqual([])
  })

  it.each([
    ['pnpm', 'pnpm', ['add', '--save-exact', 'a@1.0.0', '@s/b@2.0.0']],
    ['npm', 'npm', ['install', '--save-exact', 'a@1.0.0', '@s/b@2.0.0']],
    ['yarn', 'yarn', ['add', '--exact', 'a@1.0.0', '@s/b@2.0.0']],
    ['bun', 'bun', ['add', '--exact', 'a@1.0.0', '@s/b@2.0.0']],
  ] as const)('pins exactly with %s', (manager, command, args) => {
    expect(installCommand(manager, ['a@1.0.0', '@s/b@2.0.0'])).toEqual({ command, args })
  })

  it('gives the command to run by hand when the install fails', async () => {
    const root = project('init-vite')
    const { table } = setup({ fail: true })
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      `heart-ui: Installing dependencies failed (pnpm exited with 1). Run this in ${root}: pnpm add --save-exact ${helperDeps().join(' ')}\n`,
    )
    expect(read(root, 'heart-ui.json')).toContain('"vite"')
  })

  it.each(['clsx; rm -rf ~', '--global', 'a b', 'https://evil.example.com/x.tgz', 'file:../x'])(
    'refuses the dependency %j before writing anything',
    async (dep) => {
      const utils = { ...item('utils'), dependencies: [dep] }
      const root = project('init-vite')
      const before = listFiles(root)
      const { table, installs } = setup({ overrides: { utils } })
      const c = capture(root)
      expect(await run(['init', '--yes'], c.io, table)).toBe(1)
      expect(c.err()).toBe(
        `heart-ui: @heart-ui lists "${dep}" as a dependency of utils, which is not an npm package.\n`,
      )
      expect(listFiles(root)).toEqual(before)
      expect(installs).toEqual([])
    },
  )
})

describe('AC-004 open ranges', () => {
  it.each(['^3.4.0', '>=3.5.0'])('accepts Vue %s, which installs 3.5 or later', async (range) => {
    const root = project('init-vite', (r) =>
      editJson(r, 'package.json', (p) => (p.dependencies.vue = range)),
    )
    const { table } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
  })
})

describe('AC-006 nothing half-written', () => {
  const refuses = async (root: string, message: RegExp) => {
    const before = listFiles(root)
    const { table, installs } = setup()
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table)).toBe(1)
    expect(c.err()).toMatch(message)
    expect(listFiles(root)).toEqual(before)
    expect(installs).toEqual([])
  }

  it('refuses when a folder sits where a file would go', async () => {
    const root = project('init-vite', (r) =>
      mkdirSync(join(r, 'src/lib/utils/utils.ts'), { recursive: true }),
    )
    await refuses(root, /src\/lib\/utils\/utils\.ts already exists/)
  })

  it('refuses when a dangling symlink sits where a file would go', async () => {
    const root = project('init-vite', (r) => {
      mkdirSync(join(r, 'src/assets/css'), { recursive: true })
      symlinkSync('missing.css', join(r, 'src/assets/css/theme.css'))
    })
    await refuses(root, /src\/assets\/css\/theme\.css already exists/)
  })

  it('removes what it wrote when a later write fails, and writes no heart-ui.json', async () => {
    // A file where the icon folder must go makes that write fail after others succeeded.
    const root = project('init-vite', (r) => {
      mkdirSync(join(r, 'src/lib'), { recursive: true })
      writeFileSync(join(r, 'src/lib/icon'), 'not a folder\n')
    })
    await refuses(root, /^heart-ui: Could not write src\/lib\/icon\/.*; nothing was set up\.\n$/)
  })

  it('refuses a helper file outside registry/lib/', async () => {
    const utils = {
      ...item('utils'),
      files: [{ path: 'registry/ui/x/X.ts', type: 'registry:lib', content: '' }],
    }
    const root = project('init-vite')
    const before = listFiles(root)
    const { table } = setup({ overrides: { utils } })
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      'heart-ui: @heart-ui sent utils with a file outside registry/lib/: "registry/ui/x/X.ts".\n',
    )
    expect(listFiles(root)).toEqual(before)
  })

  it('refuses a helper path holding control characters', async () => {
    const utils = {
      ...item('utils'),
      files: [{ path: 'registry/lib/\u001b[2Kx.ts', type: 'registry:lib', content: '' }],
    }
    const root = project('init-vite')
    const before = listFiles(root)
    const { table } = setup({ overrides: { utils } })
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table)).toBe(1)
    expect(c.err()).toBe('heart-ui: @heart-ui sent an invalid item for "utils".\n')
    expect(listFiles(root)).toEqual(before)
  })
})

describe('AC-008 linked agent files', () => {
  it('keeps CLAUDE.md a link to AGENTS.md and adds the block once', async () => {
    const root = project('init-vite', (r) => {
      writeFileSync(join(r, 'AGENTS.md'), '# Ours\n')
      symlinkSync('AGENTS.md', join(r, 'CLAUDE.md'))
    })
    const { table } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    expect(lstatSync(join(root, 'CLAUDE.md')).isSymbolicLink()).toBe(true)
    expect(read(root, 'AGENTS.md').match(/heart-ui:start/g)).toHaveLength(1)
    expect(read(root, 'AGENTS.md')).not.toContain('follow the Heart UI rules in AGENTS.md')
  })

  it('edits the target of a linked file and keeps the link', async () => {
    const root = project('init-vite', (r) => {
      mkdirSync(join(r, 'docs'))
      writeFileSync(join(r, 'docs/agents.md'), '# Shared\n')
      symlinkSync('docs/agents.md', join(r, 'AGENTS.md'))
    })
    const { table } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    expect(lstatSync(join(root, 'AGENTS.md')).isSymbolicLink()).toBe(true)
    expect(read(root, 'docs/agents.md')).toContain('heart-ui:start')
  })
})

describe('AC-009 CSS entry details', () => {
  it('keeps CRLF line endings', async () => {
    const root = project('init-vite', (r) =>
      writeFileSync(join(r, 'src/style.css'), '@import "tailwindcss";\r\nbody {}\r\n'),
    )
    const { table } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    expect(read(root, 'src/style.css')).toBe('@import "./assets/css/theme.css";\r\nbody {}\r\n')
  })

  it('writes a path holding $ as it is', async () => {
    const root = project('init-vite', (r) => {
      rmSync(join(r, 'src/style.css'))
      mkdirSync(join(r, "src/$'styles"))
      writeFileSync(join(r, "src/$'styles/main.css"), "@import 'tailwindcss';\n")
    })
    const { table } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    expect(read(root, "src/$'styles/main.css")).toBe("@import '../assets/css/theme.css';\n")
  })
})

describe('AC-011 strict dependency specs', () => {
  it.each([
    'x@1 | sh',
    'x@>=1 <2',
    'x@*',
    'x@^1.0.0',
    'npm:x@1.0.0',
    'x@1.0.0\u001b]52;c;ZQ==\u0007',
  ])('refuses %j', async (dep) => {
    const utils = { ...item('utils'), dependencies: [dep] }
    const root = project('init-vite')
    const before = listFiles(root)
    const { table, installs } = setup({ overrides: { utils } })
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      `heart-ui: @heart-ui lists ${JSON.stringify(dep)} as a dependency of utils, which is not an npm package.\n`,
    )
    expect(listFiles(root)).toEqual(before)
    expect(installs).toEqual([])
  })

  it('installs a helper dependency the project declares at another major', async () => {
    const dep = helperDeps().find((d) => d.startsWith('tailwind-merge@')) ?? ''
    const root = project('init-vite', (r) =>
      editJson(r, 'package.json', (p) => (p.dependencies['tailwind-merge'] = '^2.5.0')),
    )
    const { table, installs } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    expect(installs[0]?.deps).toContain(dep)
  })

  it('lists the packages it will install before asking', async () => {
    const root = project('init-vite')
    const { table } = setup()
    const c = capture(root, async () => true)
    expect(await run(['init'], c.io, table)).toBe(0)
    for (const dep of helperDeps()) expect(c.out()).toContain(dep)
  })
})

describe('AC-006 round 2: rollback', () => {
  const dirs = (root: string) =>
    readdirSync(root, { recursive: true, encoding: 'utf8', withFileTypes: false })
      .filter((path) => !path.startsWith('.git'))
      .sort()

  it('restores edits, removes created files and folders, and writes no heart-ui.json when an edit fails', async () => {
    const root = project('init-vite', (r) => {
      writeFileSync(join(r, 'AGENTS.md'), '# Ours\n')
      mkdirSync(join(r, 'docs/locked'), { recursive: true })
      writeFileSync(join(r, 'docs/locked/claude.md'), '# Claude\n')
      symlinkSync('docs/locked/claude.md', join(r, 'CLAUDE.md'))
      chmodSync(join(r, 'docs/locked'), 0o555)
    })
    try {
      const before = dirs(root)
      const { table, installs } = setup()
      const c = capture(root)
      expect(await run(['init', '--yes'], c.io, table)).toBe(1)
      expect(c.err()).toBe('heart-ui: Could not write CLAUDE.md; nothing was set up.\n')
      expect(dirs(root)).toEqual(before)
      expect(read(root, 'AGENTS.md')).toBe('# Ours\n')
      expect(installs).toEqual([])
    } finally {
      chmodSync(join(root, 'docs/locked'), 0o755)
    }
  })

  it('stops when a file it edits changed while the prompt waited', async () => {
    const root = project('init-vite')
    const before = dirs(root)
    const { table, installs } = setup()
    const c = capture(root, async () => {
      writeFileSync(join(root, 'src/style.css'), '@import "tailwindcss";\n.mine {}\n')
      return true
    })
    expect(await run(['init'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      'heart-ui: src/style.css changed while init was waiting; nothing was set up.\n',
    )
    expect(read(root, 'src/style.css')).toBe('@import "tailwindcss";\n.mine {}\n')
    expect(dirs(root)).toEqual(before)
    expect(installs).toEqual([])
  })

  it('refuses to edit an agent file that links outside the project', async () => {
    const outside = mkdtempSync(join(dirname(out), 'outside-'))
    writeFileSync(join(outside, 'bashrc'), 'export X=1\n')
    const root = project('init-vite', (r) =>
      symlinkSync(join(outside, 'bashrc'), join(r, 'AGENTS.md')),
    )
    const before = dirs(root)
    const { table } = setup()
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      'heart-ui: AGENTS.md links outside the project, so init will not edit it. Replace the link with a file and run heart-ui init again.\n',
    )
    expect(readFileSync(join(outside, 'bashrc'), 'utf8')).toBe('export X=1\n')
    expect(dirs(root)).toEqual(before)
  })
})

describe('AC-004 round 2: ranges', () => {
  it.each(['3.x', '~3', '3', '>= 3.5.0'])('accepts Vue %s', async (range) => {
    const root = project('init-vite', (r) =>
      editJson(r, 'package.json', (p) => (p.dependencies.vue = range)),
    )
    const { table } = setup()
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table), c.err()).toBe(0)
  })
})

describe('AC-007 round 2: no network before the usage check', () => {
  it('asks for --yes before fetching anything', async () => {
    const root = project('init-vite')
    const { table, calls } = setup()
    const c = capture(root)
    expect(await run(['init'], c.io, table)).toBe(2)
    expect(calls).toEqual([])
  })
})

describe('AC-009 round 2: comments', () => {
  it('ignores a commented-out Tailwind import', async () => {
    const root = project('init-vite', (r) =>
      writeFileSync(
        join(r, 'src/style.css'),
        '/* @import "tailwindcss"; */\n@import "tailwindcss";\n',
      ),
    )
    const { table } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    expect(read(root, 'src/style.css')).toBe(
      '/* @import "tailwindcss"; */\n@import "./assets/css/theme.css";\n',
    )
  })
})

describe('AC-011 round 2', () => {
  it('counts a catalog or workspace range as declared', async () => {
    const root = project('init-vite', (r) =>
      editJson(r, 'package.json', (p) => {
        p.dependencies['tailwind-merge'] = 'catalog:'
        p.dependencies.clsx = 'workspace:*'
      }),
    )
    const { table, installs } = setup()
    expect(await run(['init', '--yes'], capture(root).io, table)).toBe(0)
    expect(
      installs[0]?.deps.some((d) => d.startsWith('tailwind-merge@') || d.startsWith('clsx@')),
    ).toBe(false)
  })

  it('adds -w for pnpm at a workspace root', () => {
    expect(installCommand('pnpm', ['a@1.0.0'], true)).toEqual({
      command: 'pnpm',
      args: ['add', '-w', '--save-exact', 'a@1.0.0'],
    })
  })

  it('names -w in the manual command at a pnpm workspace root', async () => {
    const root = project('init-vite', (r) =>
      writeFileSync(join(r, 'pnpm-workspace.yaml'), 'packages: []\n'),
    )
    const { table } = setup({ fail: true })
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table)).toBe(1)
    expect(c.err()).toContain(': pnpm add -w --save-exact ')
  })

  it('escapes C1 control characters in a refused dependency', async () => {
    const dep = 'x@1.0.0\u009b2K'
    const utils = { ...item('utils'), dependencies: [dep] }
    const root = project('init-vite')
    const { table } = setup({ overrides: { utils } })
    const c = capture(root)
    expect(await run(['init', '--yes'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      'heart-ui: @heart-ui lists "x@1.0.0\\u009b2K" as a dependency of utils, which is not an npm package.\n',
    )
  })
})
