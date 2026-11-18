import { createHash } from 'node:crypto'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { run } from '../src/cli.ts'
import { createAdd } from '../src/commands/add.ts'
import { createInit } from '../src/commands/init.ts'
import type { Installer } from '../src/install.ts'
import {
  buildRegistry,
  capture,
  copyFixture,
  listFiles,
  registryFetch,
  registryUrl,
} from './helpers/project.ts'

type File = { path: string; type: string; content: string; target?: string }
type Item = {
  name: string
  type: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: File[]
  meta?: { version?: string }
}
type Lock = {
  items: Record<string, { registry: string; version: string | null; files: Record<string, string> }>
}

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

const read = (root: string, path: string) => readFileSync(join(root, path), 'utf8')
const lock = (root: string) => JSON.parse(read(root, 'heart-ui.lock.json')) as Lock
const snapshot = (root: string) =>
  Object.fromEntries(listFiles(root).map((path) => [path, read(root, path)]))
const hash = (text: string) => `sha256-${createHash('sha256').update(text).digest('base64')}`

// An installer that records its calls and declares the packages, as a real install would.
function recordingInstaller(root: () => string, fail = false) {
  const calls: { manager: string; deps: string[] }[] = []
  const install: Installer = async (manager, deps) => {
    calls.push({ manager, deps })
    if (fail) throw new Error('exit 1')
    const path = join(root(), 'package.json')
    const manifest = JSON.parse(readFileSync(path, 'utf8')) as {
      dependencies: Record<string, string>
    }
    for (const dep of deps) {
      const at = dep.indexOf('@', 1)
      manifest.dependencies[dep.slice(0, at)] = dep.slice(at + 1)
    }
    writeFileSync(path, JSON.stringify(manifest, null, 2))
  }
  return { install, calls }
}

async function initialised(): Promise<string> {
  const root = copyFixture('init-vite')
  roots.push(root)
  const { install } = recordingInstaller(() => root)
  const init = createInit({
    fetch: registryFetch(out).fetch,
    install,
    nodeVersion: '22.18.0',
    cacheDir: mkdtempSync(join(dirname(out), 'cache-')),
    registryUrl,
  })
  const c = capture(root)
  expect(await run(['init', '--yes'], c.io, { init }), c.err()).toBe(0)
  return root
}

function setup(
  root: string,
  options: { overrides?: Record<string, unknown>; fetch?: typeof fetch; fail?: boolean } = {},
) {
  const registry = registryFetch(out, options.overrides)
  const installer = recordingInstaller(() => root, options.fail)
  const add = createAdd({
    fetch: options.fetch ?? registry.fetch,
    install: installer.install,
    cacheDir: mkdtempSync(join(dirname(out), 'cache-')),
  })
  return { table: { add }, calls: registry.calls, installs: installer.calls }
}

const uiPath = (name: string, file: File, ui = 'src/components/ui') =>
  `${ui}/${name}/${basename(file.path)}`
const fetched = (calls: string[], name: string) =>
  calls.filter((url) => url.endsWith(`/r/${name}.json`)).length

describe('AC-001 adding dialog', () => {
  it('writes dialog and button, keeps the helpers, fetches each once and locks all four', async () => {
    const root = await initialised()
    const helpers = { utils: read(root, 'src/lib/utils/utils.ts') }
    const { table, calls } = setup(root)
    const c = capture(root)
    expect(await run(['add', 'dialog'], c.io, table), c.err()).toBe(0)
    for (const name of ['dialog', 'button']) {
      for (const file of item(name).files) {
        expect(read(root, uiPath(name, file))).toBe(file.content)
      }
    }
    expect(read(root, 'src/lib/utils/utils.ts')).toBe(helpers.utils)
    for (const name of ['dialog', 'button', 'utils', 'icon']) expect(fetched(calls, name)).toBe(1)
    expect(Object.keys(lock(root).items).sort()).toEqual(['button', 'dialog', 'icon', 'utils'])
  })
})

describe('AC-002 adding again', () => {
  it('changes nothing the second time', async () => {
    const root = await initialised()
    const first = setup(root)
    expect(await run(['add', 'dialog'], capture(root).io, first.table)).toBe(0)
    const before = snapshot(root)
    const second = setup(root)
    const c = capture(root)
    expect(await run(['add', 'dialog'], c.io, second.table)).toBe(0)
    expect(snapshot(root)).toEqual(before)
    expect(second.installs).toEqual([])
    expect(c.out()).toContain('up to date')
  })
})

describe('AC-003 lock hashes', () => {
  it('holds the sha256 of every file as written, with registry and version', async () => {
    const root = await initialised()
    const { table } = setup(root)
    expect(await run(['add', 'dialog'], capture(root).io, table)).toBe(0)
    const { items } = lock(root)
    for (const [name, entry] of Object.entries(items)) {
      expect(entry.registry).toBe('@heart-ui')
      expect(entry.version).toBe(item(name).meta?.version ?? null)
      expect(Object.keys(entry.files)).toHaveLength(item(name).files.length)
      for (const [path, digest] of Object.entries(entry.files)) {
        expect(digest).toBe(hash(read(root, path)))
      }
    }
  })
})

describe('AC-004 custom aliases', () => {
  it('writes to the aliases in heart-ui.json and rewrites imports to them', async () => {
    const root = await initialised()
    const config = JSON.parse(read(root, 'heart-ui.json')) as { aliases: Record<string, string> }
    config.aliases.ui = '@/ui'
    config.aliases.lib = '@/shared/lib'
    writeFileSync(join(root, 'heart-ui.json'), JSON.stringify(config))
    const { table } = setup(root)
    const c = capture(root)
    expect(await run(['add', 'dialog'], c.io, table), c.err()).toBe(0)
    const content = read(root, 'src/ui/dialog/DialogContent.vue')
    expect(content).toContain("from '@/shared/lib/utils/utils'")
    expect(content).not.toContain("'@/lib/")
    expect(read(root, 'src/shared/lib/utils/utils.ts')).toBe(item('utils').files[0]?.content)
    expect(Object.keys(lock(root).items.button?.files ?? {})[0]).toMatch(/^src\/ui\/button\//)
  })
})

describe('AC-005 overwrite', () => {
  const mine = (root: string) => {
    mkdirSync(join(root, 'src/components/ui/button'), { recursive: true })
    writeFileSync(join(root, 'src/components/ui/button/Button.vue'), '<template>mine</template>\n')
  }

  it('refuses to replace a file you have and writes nothing', async () => {
    const root = await initialised()
    mine(root)
    const before = snapshot(root)
    const { table, installs } = setup(root)
    const c = capture(root)
    expect(await run(['add', 'button'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      'heart-ui: src/components/ui/button/Button.vue already exists. Run heart-ui add button --overwrite to replace it.\n',
    )
    expect(snapshot(root)).toEqual(before)
    expect(installs).toEqual([])
  })

  it('replaces it with --overwrite and locks the item', async () => {
    const root = await initialised()
    mine(root)
    const { table } = setup(root)
    expect(await run(['add', 'button', '--overwrite'], capture(root).io, table)).toBe(0)
    const button = item('button').files.find((file) => file.path.endsWith('/Button.vue'))
    expect(read(root, 'src/components/ui/button/Button.vue')).toBe(button?.content)
    expect(lock(root).items.button).toBeDefined()
  })
})

describe('AC-006 edited dependencies', () => {
  it('keeps a dependency you changed, leaves it unlocked and says so', async () => {
    const root = await initialised()
    const edited = `${read(root, 'src/lib/utils/utils.ts')}// mine\n`
    writeFileSync(join(root, 'src/lib/utils/utils.ts'), edited)
    const { table } = setup(root)
    const c = capture(root)
    expect(await run(['add', 'dialog'], c.io, table), c.err()).toBe(0)
    expect(read(root, 'src/lib/utils/utils.ts')).toBe(edited)
    expect(lock(root).items.utils).toBeUndefined()
    expect(c.out()).toContain('utils differs from the registry; kept the copy you have.')
  })
})

describe('AC-007 npm dependencies', () => {
  const needed = () => [
    ...new Set(['dialog', 'button'].flatMap((name) => item(name).dependencies ?? [])),
  ]

  it('installs what is missing once, pinned', async () => {
    const root = await initialised()
    const { table, installs } = setup(root)
    expect(await run(['add', 'dialog'], capture(root).io, table)).toBe(0)
    expect(installs).toEqual([{ manager: 'pnpm', deps: needed() }])
  })

  it('gives the command to run when the install fails', async () => {
    const root = await initialised()
    const { table } = setup(root, { fail: true })
    const c = capture(root)
    expect(await run(['add', 'dialog'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      'heart-ui: Installing dependencies failed (see the output above); nothing was added. Fix the install and run heart-ui add again.\n',
    )
  })

  it('refuses a dependency that is not an exact npm spec before writing', async () => {
    const root = await initialised()
    const before = snapshot(root)
    const dialog = { ...item('dialog'), dependencies: ['reka-ui@^2'] }
    const { table, installs } = setup(root, { overrides: { dialog } })
    const c = capture(root)
    expect(await run(['add', 'dialog'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      'heart-ui: @heart-ui lists "reka-ui@^2" as a dependency of dialog, which is not an npm package.\n',
    )
    expect(snapshot(root)).toEqual(before)
    expect(installs).toEqual([])
  })
})

describe('AC-008 mistakes', () => {
  const fails = async (
    root: string,
    argv: string[],
    code: number,
    message: string,
    overrides = {},
  ) => {
    const before = snapshot(root)
    const { table } = setup(root, { overrides })
    const c = capture(root)
    expect(await run(argv, c.io, table)).toBe(code)
    expect(c.err()).toBe(`heart-ui: ${message}\n`)
    expect(snapshot(root)).toEqual(before)
  }

  it('needs an item name', async () => {
    await fails(await initialised(), ['add'], 2, 'Name at least one item: heart-ui add <item...>.')
  })

  it('needs init first', async () => {
    const root = copyFixture('init-vite')
    roots.push(root)
    await fails(root, ['add', 'button'], 1, `No heart-ui.json in ${root}. Run heart-ui init first.`)
  })

  it('names an unknown item', async () => {
    await fails(
      await initialised(),
      ['add', 'nope'],
      1,
      'Item "nope" not found in @heart-ui (https://registry.test/r/nope.json).',
    )
  })

  it('refuses an item of another type', async () => {
    await fails(
      await initialised(),
      ['add', 'button'],
      1,
      'button is a registry:theme item; heart-ui add installs components, helpers, blocks and layouts.',
      { button: { ...item('button'), type: 'registry:theme' } },
    )
  })

  it('refuses a file outside the known folders', async () => {
    const button = {
      ...item('button'),
      files: [{ path: 'registry/other/x.ts', type: 'registry:ui', content: '' }],
    }
    await fails(
      await initialised(),
      ['add', 'button'],
      1,
      '@heart-ui sent button with a file outside registry/ui, lib, blocks and layouts: "registry/other/x.ts".',
      { button },
    )
  })

  it('names a malformed lock file', async () => {
    const root = await initialised()
    writeFileSync(join(root, 'heart-ui.lock.json'), '{"items": 1}')
    await fails(
      root,
      ['add', 'button'],
      1,
      `${join(root, 'heart-ui.lock.json')} is not a valid lock file.`,
    )
  })
})

describe('AC-009 third-party registries', () => {
  it('fetches from the scope, resolves its dependencies there and keys the lock by scope', async () => {
    const root = await initialised()
    const config = JSON.parse(read(root, 'heart-ui.json')) as { registries: Record<string, string> }
    config.registries['@acme'] = 'https://acme.test/items/{name}.json'
    writeFileSync(join(root, 'heart-ui.json'), JSON.stringify(config))
    const acme: Record<string, Item> = {
      'data-grid': {
        name: 'data-grid',
        type: 'registry:ui',
        registryDependencies: ['@acme/grid-utils'],
        files: [
          {
            path: 'registry/ui/data-grid/DataGrid.vue',
            type: 'registry:ui',
            content:
              '<script setup lang="ts">\nimport { sum } from \'@/lib/grid-utils\'\n</script>\n',
          },
        ],
        meta: { version: '1.2.0' },
      },
      'grid-utils': {
        name: 'grid-utils',
        type: 'registry:lib',
        files: [
          {
            path: 'registry/lib/grid-utils/index.ts',
            type: 'registry:lib',
            content: 'export const sum = 1\n',
          },
        ],
      },
    }
    const calls: string[] = []
    const fetchAcme = (async (input: string | URL | Request) => {
      const url = String(input)
      calls.push(url)
      const name = /\/items\/([^/]+)\.json$/.exec(url)?.[1] ?? ''
      return name in acme
        ? new Response(JSON.stringify(acme[name]))
        : new Response('', { status: 404 })
    }) as typeof fetch
    const { table } = setup(root, { fetch: fetchAcme })
    const c = capture(root)
    expect(await run(['add', '@acme/data-grid'], c.io, table), c.err()).toBe(0)
    expect(calls).toEqual([
      'https://acme.test/items/data-grid.json',
      'https://acme.test/items/grid-utils.json',
    ])
    expect(read(root, 'src/components/ui/data-grid/DataGrid.vue')).toContain("'@/lib/grid-utils'")
    expect(read(root, 'src/lib/grid-utils/index.ts')).toBe('export const sum = 1\n')
    const { items } = lock(root)
    expect(items['@acme/data-grid']).toMatchObject({ registry: '@acme', version: '1.2.0' })
    expect(items['@acme/grid-utils']).toMatchObject({ registry: '@acme', version: null })
  })
})

describe('AC-010 rollback', () => {
  it('removes what it wrote and leaves the lock when a later write fails', async () => {
    const root = await initialised()
    mkdirSync(join(root, 'src/components/ui'), { recursive: true })
    // A file where dialog's folder must go: button is written first, then dialog fails.
    writeFileSync(join(root, 'src/components/ui/dialog'), 'blocker\n')
    const before = snapshot(root)
    const { table, installs } = setup(root)
    const c = capture(root)
    expect(await run(['add', 'dialog'], c.io, table)).toBe(1)
    expect(c.err()).toMatch(
      /^heart-ui: Could not write src\/components\/ui\/dialog\/.*; nothing was added\.\n$/,
    )
    expect(snapshot(root)).toEqual(before)
    expect(installs).toEqual([])
  })
})

describe('AC-011 cycles', () => {
  it('fetches and writes each item once', async () => {
    const root = await initialised()
    const button = { ...item('button'), registryDependencies: ['utils', 'icon', 'dialog'] }
    const { table, calls } = setup(root, { overrides: { button } })
    const c = capture(root)
    expect(await run(['add', 'dialog'], c.io, table), c.err()).toBe(0)
    for (const name of ['dialog', 'button', 'utils', 'icon']) expect(fetched(calls, name)).toBe(1)
    expect(Object.keys(lock(root).items).sort()).toEqual(['button', 'dialog', 'icon', 'utils'])
  })
})

describe('AC-006 the lock decides what you changed', () => {
  const newer = () => ({
    ...item('button'),
    meta: { version: '9.0.0' },
    files: item('button').files.map((file) => ({ ...file, content: `${file.content}// v9\n` })),
  })

  it('leaves an untouched dependency the registry has since changed, without calling it yours', async () => {
    const root = await initialised()
    expect(await run(['add', 'button'], capture(root).io, setup(root).table)).toBe(0)
    const before = snapshot(root)
    const { table } = setup(root, { overrides: { button: newer() } })
    const c = capture(root)
    expect(await run(['add', 'toast'], c.io, table), c.err()).toBe(0)
    expect(c.out()).not.toContain('Kept your changes to button')
    expect(c.out()).toContain('button has a newer version; heart-ui update brings it in.')
    for (const path of Object.keys(lock(root).items.button?.files ?? {})) {
      expect(read(root, path)).toBe(before[path])
    }
    expect(lock(root).items.button?.version).toBe(item('button').meta?.version ?? null)
  })

  it('does not ask for --overwrite to add an untouched item again', async () => {
    const root = await initialised()
    expect(await run(['add', 'button'], capture(root).io, setup(root).table)).toBe(0)
    const before = snapshot(root)
    const { table } = setup(root, { overrides: { button: newer() } })
    const c = capture(root)
    expect(await run(['add', 'button'], c.io, table)).toBe(0)
    expect(c.out()).toContain('button has a newer version; heart-ui update brings it in.')
    expect(snapshot(root)).toEqual(before)
  })

  it('reads CRLF line endings as unchanged', async () => {
    const root = await initialised()
    const path = join(root, 'src/lib/utils/utils.ts')
    writeFileSync(path, readFileSync(path, 'utf8').replace(/\n/g, '\r\n'))
    const { table } = setup(root)
    const c = capture(root)
    expect(await run(['add', 'dialog'], c.io, table)).toBe(0)
    expect(c.out()).not.toContain('Kept your changes to utils')
    expect(lock(root).items.utils).toBeDefined()
  })

  it('creates the missing files of a dependency you changed', async () => {
    const root = await initialised()
    expect(await run(['add', 'button'], capture(root).io, setup(root).table)).toBe(0)
    const edited = `${read(root, 'src/components/ui/button/Button.vue')}<!-- mine -->\n`
    writeFileSync(join(root, 'src/components/ui/button/Button.vue'), edited)
    unlinkSync(join(root, 'src/components/ui/button/index.ts'))
    const { table } = setup(root)
    const c = capture(root)
    expect(await run(['add', 'dialog'], c.io, table)).toBe(0)
    expect(read(root, 'src/components/ui/button/Button.vue')).toBe(edited)
    const index = item('button').files.find((file) => file.path.endsWith('/index.ts'))
    expect(read(root, 'src/components/ui/button/index.ts')).toBe(index?.content)
    expect(c.out()).toContain('Kept your changes to button')
    expect(Object.keys(lock(root).items.button?.files ?? {})).toContain(
      'src/components/ui/button/index.ts',
    )
  })
})

describe('AC-007 a failed install and 0.x versions', () => {
  it('leaves files and the lock as they were when the install fails', async () => {
    const root = await initialised()
    const before = snapshot(root)
    const { table } = setup(root, { fail: true })
    expect(await run(['add', 'dialog'], capture(root).io, table)).toBe(1)
    expect(snapshot(root)).toEqual(before)
  })

  it('installs a 0.x dependency declared at another minor', async () => {
    const root = await initialised()
    const manifest = JSON.parse(read(root, 'package.json')) as {
      dependencies: Record<string, string>
    }
    manifest.dependencies['class-variance-authority'] = '^0.6.0'
    writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))
    const { table, installs } = setup(root)
    expect(await run(['add', 'button'], capture(root).io, table)).toBe(0)
    expect(installs[0]?.deps.some((dep) => dep.startsWith('class-variance-authority@0.7'))).toBe(
      true,
    )
  })
})

describe('AC-008 unsafe destinations', () => {
  const fails = async (root: string, argv: string[], message: string, overrides = {}) => {
    const before = snapshot(root)
    const { table, installs } = setup(root, { overrides })
    const c = capture(root)
    expect(await run(argv, c.io, table)).toBe(1)
    expect(c.err()).toBe(`heart-ui: ${message}\n`)
    expect(snapshot(root)).toEqual(before)
    expect(installs).toEqual([])
  }
  const withTarget = (target: string) => ({
    ...item('button'),
    files: [
      ...item('button').files,
      { path: 'registry/ui/button/x.vue', type: 'registry:file', content: '', target },
    ],
  })

  it('names two items that write the same file', async () => {
    const card = {
      ...item('card'),
      files: [{ path: 'registry/ui/button/Button.vue', type: 'registry:ui', content: '' }],
    }
    const dialog = { ...item('dialog'), registryDependencies: ['utils', 'icon', 'button', 'card'] }
    await fails(
      await initialised(),
      ['add', 'dialog'],
      'button and card both write src/components/ui/button/Button.vue.',
      { card, dialog },
    )
  })

  it.each([
    '~/.husky/pre-commit',
    '~/app/.github/workflows/x.yml',
    '.vscode/tasks.json',
    '~/.Git/config',
    '~/src/Node_Modules/x.js',
    '~/src/node_modules./x.js',
    '~/src/GIT~1/config',
  ])('refuses the target %s', async (target) => {
    await fails(
      await initialised(),
      ['add', 'button'],
      '@heart-ui sent an invalid item for "button".',
      {
        button: withTarget(target),
      },
    )
  })

  it.each(['~/package.json', '~/heart-ui.lock.json', 'tsconfig.json'])(
    'refuses the root-level target %s',
    async (target) => {
      await fails(
        await initialised(),
        ['add', 'button'],
        `@heart-ui sent button with a file for the project root, ${JSON.stringify(target)}; items may write only into folders.`,
        { button: withTarget(target) },
      )
    },
  )

  it('refuses a target in a folder that links outside the project', async () => {
    const outside = mkdtempSync(join(dirname(out), 'outside-'))
    const root = await initialised()
    symlinkSync(outside, join(root, 'src/pages'))
    await fails(
      root,
      ['add', 'button'],
      'src/pages/x.vue is outside the project, so add will not write it.',
      { button: withTarget('~/src/pages/x.vue') },
    )
  })

  it('writes a target inside a folder and lists it', async () => {
    const root = await initialised()
    const { table } = setup(root, { overrides: { button: withTarget('~/src/pages/x.vue') } })
    const c = capture(root)
    expect(await run(['add', 'button'], c.io, table), c.err()).toBe(0)
    expect(read(root, 'src/pages/x.vue')).toBe('')
    expect(c.out()).toContain('src/pages/x.vue')
  })

  it('refuses a lock file that links outside the project', async () => {
    const outside = mkdtempSync(join(dirname(out), 'outside-'))
    writeFileSync(join(outside, 'lock.json'), '{"items": {}}\n')
    const root = await initialised()
    symlinkSync(join(outside, 'lock.json'), join(root, 'heart-ui.lock.json'))
    await fails(
      root,
      ['add', 'button'],
      'heart-ui.lock.json links outside the project, so add will not edit it. Replace the link with a file and run heart-ui add again.',
    )
    expect(readFileSync(join(outside, 'lock.json'), 'utf8')).toBe('{"items": {}}\n')
  })

  it('names the item that pulled in one of another type', async () => {
    await fails(
      await initialised(),
      ['add', 'dialog'],
      'icon (needed by dialog) is a registry:theme item; heart-ui add installs components, helpers, blocks and layouts.',
      { icon: { ...item('icon'), type: 'registry:theme' } },
    )
  })
})

describe('AC-005 every replaced file is named', () => {
  const mine = (root: string) => {
    for (const name of ['Button.vue', 'index.ts']) {
      mkdirSync(join(root, 'src/components/ui/button'), { recursive: true })
      writeFileSync(join(root, 'src/components/ui/button', name), 'mine\n')
    }
  }

  it('names every file it would replace', async () => {
    const root = await initialised()
    mine(root)
    const { table } = setup(root)
    const c = capture(root)
    expect(await run(['add', 'button'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      'heart-ui: src/components/ui/button/Button.vue, src/components/ui/button/index.ts already exist. Run heart-ui add button --overwrite to replace them.\n',
    )
  })

  it('lists what --overwrite replaced', async () => {
    const root = await initialised()
    mine(root)
    const { table } = setup(root)
    const c = capture(root)
    expect(await run(['add', 'button', '--overwrite'], c.io, table)).toBe(0)
    expect(c.out()).toContain(
      'Replaced: src/components/ui/button/Button.vue, src/components/ui/button/index.ts',
    )
  })
})

describe('AC-009 unscoped dependencies of a third-party item', () => {
  it('resolves them in the default registry', async () => {
    const root = await initialised()
    const config = JSON.parse(read(root, 'heart-ui.json')) as { registries: Record<string, string> }
    config.registries['@acme'] = 'https://acme.test/items/{name}.json'
    writeFileSync(join(root, 'heart-ui.json'), JSON.stringify(config))
    const grid = {
      name: 'data-grid',
      type: 'registry:ui',
      registryDependencies: ['utils'],
      files: [{ path: 'registry/ui/data-grid/DataGrid.vue', type: 'registry:ui', content: '' }],
    }
    const heart = registryFetch(out)
    const calls: string[] = []
    const both = (async (input: string | URL | Request) => {
      const url = String(input)
      calls.push(url)
      return url.startsWith('https://acme.test/')
        ? new Response(JSON.stringify(grid))
        : heart.fetch(input)
    }) as typeof fetch
    const { table } = setup(root, { fetch: both })
    const c = capture(root)
    expect(await run(['add', '@acme/data-grid'], c.io, table), c.err()).toBe(0)
    expect(calls).toEqual([
      'https://acme.test/items/data-grid.json',
      'https://registry.test/r/utils.json',
    ])
    expect(lock(root).items.utils?.registry).toBe('@heart-ui')
  })
})

describe('AC-007 dependencies of items left as they are', () => {
  it('installs nothing for a dependency left at its installed version', async () => {
    const root = await initialised()
    expect(await run(['add', 'button'], capture(root).io, setup(root).table)).toBe(0)
    const button = {
      ...item('button'),
      dependencies: [...(item('button').dependencies ?? []), '@floating-ui/vue@1.1.0'],
      files: item('button').files.map((file) => ({ ...file, content: `${file.content}// v9\n` })),
    }
    const { table, installs } = setup(root, { overrides: { button } })
    expect(await run(['add', 'toast'], capture(root).io, table)).toBe(0)
    expect(
      installs.flatMap((call) => call.deps).some((dep) => dep.startsWith('@floating-ui/')),
    ).toBe(false)
  })
})

describe('AC-008 unreadable and Windows-only paths', () => {
  const withTarget = (target: string) => ({
    ...item('button'),
    files: [
      ...item('button').files,
      { path: 'registry/ui/button/x.vue', type: 'registry:file', content: '', target },
    ],
  })

  it('refuses a target through a dangling link with one line', async () => {
    const root = await initialised()
    symlinkSync('/heart-ui-missing-target', join(root, 'src/server'))
    const before = snapshot(root)
    const { table } = setup(root, { overrides: { button: withTarget('~/src/server/x.ts') } })
    const c = capture(root)
    expect(await run(['add', 'button'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      'heart-ui: src/server/x.ts is outside the project, so add will not write it.\n',
    )
    expect(snapshot(root)).toEqual(before)
  })

  it.each(['~/src/x.vue:evil', '~/node_modules::$INDEX_ALLOCATION/x.js'])(
    'refuses the NTFS stream path %s',
    async (target) => {
      const root = await initialised()
      const { table } = setup(root, { overrides: { button: withTarget(target) } })
      const c = capture(root)
      expect(await run(['add', 'button'], c.io, table)).toBe(1)
      expect(c.err()).toBe('heart-ui: @heart-ui sent an invalid item for "button".\n')
    },
  )
})

describe('AC-002 items sent with CRLF', () => {
  it('reports an item sent with CRLF as up to date the second time', async () => {
    const root = await initialised()
    const card = {
      ...item('card'),
      files: item('card').files.map((file) => ({
        ...file,
        content: file.content.replace(/\n/g, '\r\n'),
      })),
    }
    expect(
      await run(['add', 'card'], capture(root).io, setup(root, { overrides: { card } }).table),
    ).toBe(0)
    const before = snapshot(root)
    const c = capture(root)
    expect(await run(['add', 'card'], c.io, setup(root, { overrides: { card } }).table)).toBe(0)
    expect(c.out()).toContain('card is up to date.')
    expect(snapshot(root)).toEqual(before)
  })
})

describe('AC-008 links, trailing slashes and odd names', () => {
  it('refuses to --overwrite a file that links outside the project', async () => {
    const outside = mkdtempSync(join(dirname(out), 'outside-'))
    writeFileSync(join(outside, 'Button.vue'), 'theirs\n')
    const root = await initialised()
    mkdirSync(join(root, 'src/components/ui/button'), { recursive: true })
    symlinkSync(join(outside, 'Button.vue'), join(root, 'src/components/ui/button/Button.vue'))
    const { table } = setup(root)
    const c = capture(root)
    expect(await run(['add', 'button', '--overwrite'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      'heart-ui: src/components/ui/button/Button.vue links outside the project, so add will not edit it. Replace the link with a file and run heart-ui add again.\n',
    )
    expect(readFileSync(join(outside, 'Button.vue'), 'utf8')).toBe('theirs\n')
  })

  it('refuses a root-level target spelled with a trailing slash', async () => {
    const root = await initialised()
    const button = {
      ...item('button'),
      files: [
        ...item('button').files,
        {
          path: 'registry/ui/button/x.vue',
          type: 'registry:file',
          content: '',
          target: '~/postcss.config.js/',
        },
      ],
    }
    const { table } = setup(root, { overrides: { button } })
    const c = capture(root)
    expect(await run(['add', 'button'], c.io, table)).toBe(1)
    expect(c.err()).toBe('heart-ui: @heart-ui sent an invalid item for "button".\n')
  })

  it('handles an item named constructor', async () => {
    const root = await initialised()
    const constructorItem = {
      name: 'constructor',
      type: 'registry:ui',
      files: [{ path: 'registry/ui/constructor/C.vue', type: 'registry:ui', content: 'a\n' }],
    }
    const overrides = { constructor: constructorItem }
    expect(
      await run(['add', 'constructor'], capture(root).io, setup(root, { overrides }).table),
    ).toBe(0)
    writeFileSync(join(root, 'src/components/ui/constructor/C.vue'), 'mine\n')
    const c = capture(root)
    expect(await run(['add', 'constructor'], c.io, setup(root, { overrides }).table)).toBe(1)
    expect(c.err()).toBe(
      'heart-ui: src/components/ui/constructor/C.vue already exists. Run heart-ui add constructor --overwrite to replace it.\n',
    )
  })

  it('names two items whose files differ only in case', async () => {
    const card = {
      ...item('card'),
      files: [{ path: 'registry/ui/button/button.vue', type: 'registry:ui', content: '' }],
    }
    const dialog = { ...item('dialog'), registryDependencies: ['utils', 'icon', 'button', 'card'] }
    const root = await initialised()
    const { table } = setup(root, { overrides: { card, dialog } })
    const c = capture(root)
    expect(await run(['add', 'dialog'], c.io, table)).toBe(1)
    expect(c.err()).toBe(
      'heart-ui: button and card both write src/components/ui/button/button.vue.\n',
    )
  })
})
