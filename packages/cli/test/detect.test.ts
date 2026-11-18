import { cpSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { detectProject } from '../src/detect.ts'
import { CliError } from '../src/errors.ts'

const fixtures = fileURLToPath(new URL('./fixtures', import.meta.url))

describe('AC-007 fixture projects', () => {
  const nuxt = (root: string) => ({
    '@': join(root, 'app'),
    '~': join(root, 'app'),
    '@@': root,
    '~~': root,
  })
  const vite = (root: string) => ({ '@': join(root, 'src') })

  it.each([
    ['nuxt-pnpm', 'nuxt', 'pnpm', 4, nuxt],
    ['nuxt-npm', 'nuxt', 'npm', null, nuxt],
    ['vite-pnpm', 'vite', 'pnpm', 4, vite],
    ['vite-npm', 'vite', 'npm', 3, vite],
  ] as const)('detects %s', async (name, framework, packageManager, tailwindMajor, aliases) => {
    // A copy inside its own git root, so nothing above it (this repo's node_modules) counts.
    const root = join(realpathSync(mkdtempSync(join(tmpdir(), 'heart-ui-fixture-'))), name)
    cpSync(join(fixtures, name), root, { recursive: true })
    mkdirSync(join(root, '.git'))
    expect(await detectProject(root)).toEqual({
      root,
      framework,
      packageManager,
      tailwindMajor,
      aliases: aliases(root),
    })
  })
})

describe('AC-008 edge projects', () => {
  let tmp: string
  beforeEach(() => {
    tmp = realpathSync(mkdtempSync(join(tmpdir(), 'heart-ui-detect-')))
  })
  afterEach(() => rmSync(tmp, { recursive: true, force: true }))

  const write = (path: string, value: unknown) => {
    mkdirSync(dirname(join(tmp, path)), { recursive: true })
    writeFileSync(join(tmp, path), typeof value === 'string' ? value : JSON.stringify(value))
  }
  const viteProject = (extra: Record<string, unknown> = {}) =>
    write('package.json', { devDependencies: { vite: '7.0.0' }, ...extra })

  it('lets the packageManager field beat a lock file', async () => {
    viteProject({ packageManager: 'yarn@4.5.0' })
    write('package-lock.json', '{}')
    expect((await detectProject(tmp)).packageManager).toBe('yarn')
  })

  it("uses an enclosing workspace's lock file", async () => {
    write('pnpm-lock.yaml', "lockfileVersion: '9.0'\n")
    write('pnpm-workspace.yaml', 'packages:\n  - apps/*\n')
    write('apps/web/package.json', { devDependencies: { vite: '7.0.0' } })
    const project = await detectProject(join(tmp, 'apps/web'))
    expect(project.packageManager).toBe('pnpm')
    expect(project.root).toBe(join(tmp, 'apps/web'))
  })

  it.each([
    ['yarn.lock', 'yarn'],
    ['bun.lock', 'bun'],
    ['bun.lockb', 'bun'],
    ['package-lock.json', 'npm'],
    ['pnpm-lock.yaml', 'pnpm'],
  ])('reads %s as %s', async (lock, manager) => {
    viteProject()
    write(lock, '')
    expect((await detectProject(tmp)).packageManager).toBe(manager)
  })

  it('defaults to npm without a lock file', async () => {
    viteProject()
    expect((await detectProject(tmp)).packageManager).toBe('npm')
  })

  it('prefers the installed Tailwind version over the declared range', async () => {
    viteProject({ dependencies: { tailwindcss: '^3.4.0' } })
    write('node_modules/tailwindcss/package.json', { name: 'tailwindcss', version: '4.1.3' })
    expect((await detectProject(tmp)).tailwindMajor).toBe(4)
  })

  it.each([
    ['~3.4.1', 3],
    ['>=4.0.0', 4],
    ['4', 4],
    ['^4.0.0-beta.1', 4],
    ['latest', null],
    ['workspace:*', null],
  ])('reads Tailwind range %s as major %s', async (range, major) => {
    viteProject({ devDependencies: { vite: '7.0.0', tailwindcss: range } })
    expect((await detectProject(tmp)).tailwindMajor).toBe(major)
  })

  it('maps @ to the root of a Nuxt project without app/', async () => {
    write('package.json', { dependencies: { nuxt: '4.2.1' } })
    expect((await detectProject(tmp)).aliases).toEqual({ '@': tmp, '~': tmp, '@@': tmp, '~~': tmp })
  })

  it('resolves paths with baseUrl from a JSONC tsconfig', async () => {
    viteProject()
    write(
      'tsconfig.json',
      `{
  // Comments and trailing commas, as tsc allows.
  "compilerOptions": {
    /* block comment with "quotes" */
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "#utils": ["src/utils/index.ts"],
      "url/*": ["http://example.com//not-a-comment/*"],
    },
  },
}`,
    )
    expect((await detectProject(tmp)).aliases).toEqual({
      '@': join(tmp, 'src'),
      url: join(tmp, 'http:/example.com/not-a-comment'),
    })
  })

  it('reads paths from a tsconfig it extends, relative to that file', async () => {
    viteProject()
    write('tsconfig.json', { extends: './config/base.json' })
    write('config/base.json', { compilerOptions: { paths: { '@/*': ['../src/*'] } } })
    expect((await detectProject(tmp)).aliases).toEqual({ '@': join(tmp, 'src') })
  })

  it('has no framework without Nuxt or Vite', async () => {
    write('package.json', { dependencies: { vue: '3.5.45' } })
    expect((await detectProject(tmp)).framework).toBeNull()
  })

  it('fails clearly without package.json', async () => {
    const error = await detectProject(tmp).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(CliError)
    expect((error as Error).message).toBe(`No package.json in ${tmp}.`)
  })

  it.each(['package.json', 'tsconfig.json'])('fails clearly on a malformed %s', async (file) => {
    viteProject()
    write(file, '{ "oops": ')
    const error = await detectProject(tmp).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(CliError)
    expect((error as Error).message).toBe(`${join(tmp, file)} is not valid JSON.`)
  })
})

describe('AC-008 boundaries and tsconfig inheritance', () => {
  let tmp: string
  beforeEach(() => {
    tmp = realpathSync(mkdtempSync(join(tmpdir(), 'heart-ui-detect-')))
  })
  afterEach(() => rmSync(tmp, { recursive: true, force: true }))

  const write = (path: string, value: unknown) => {
    mkdirSync(dirname(join(tmp, path)), { recursive: true })
    writeFileSync(join(tmp, path), typeof value === 'string' ? value : JSON.stringify(value))
  }
  const vite = { devDependencies: { vite: '7.0.0' } }

  it('ignores a stray lock file above a project outside any workspace', async () => {
    write('pnpm-lock.yaml', '')
    write('code/app/package.json', vite)
    expect((await detectProject(join(tmp, 'code/app'))).packageManager).toBe('npm')
  })

  it.each([
    ['a git root', '.git/HEAD', ''],
    ['an npm workspace', 'package.json', { workspaces: ['apps/*'] }],
  ])('uses the lock file of %s', async (_, marker, content) => {
    write('yarn.lock', '')
    write(marker, content)
    write('apps/web/package.json', vite)
    expect((await detectProject(join(tmp, 'apps/web'))).packageManager).toBe('yarn')
  })

  it("prefers the declared range over a parent folder's Tailwind", async () => {
    write('node_modules/tailwindcss/package.json', { version: '3.4.17' })
    write('pnpm-workspace.yaml', '')
    write('apps/web/package.json', { devDependencies: { vite: '7.0.0', tailwindcss: '^4.1.0' } })
    expect((await detectProject(join(tmp, 'apps/web'))).tailwindMajor).toBe(4)
  })

  it("reads a workspace's hoisted Tailwind when the project declares none", async () => {
    write('node_modules/tailwindcss/package.json', { version: '4.1.3' })
    write('pnpm-workspace.yaml', '')
    write('apps/web/package.json', vite)
    expect((await detectProject(join(tmp, 'apps/web'))).tailwindMajor).toBe(4)
  })

  it('reads package.json and tsconfig.json with a byte order mark', async () => {
    write('package.json', `\uFEFF${JSON.stringify(vite)}`)
    write('tsconfig.json', `\uFEFF{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }`)
    expect((await detectProject(tmp)).aliases).toEqual({ '@': join(tmp, 'src') })
  })

  it('keeps a shared base baseUrl for every config that extends it', async () => {
    write('package.json', vite)
    write('tsconfig.json', {
      files: [],
      references: [{ path: './tsconfig.app.json' }, { path: './tsconfig.vitest.json' }],
    })
    write('tsconfig.base.json', { compilerOptions: { baseUrl: './src' } })
    write('tsconfig.app.json', {
      extends: './tsconfig.base.json',
      compilerOptions: { paths: { '@/*': ['*'] } },
    })
    write('tsconfig.vitest.json', {
      extends: './tsconfig.base.json',
      compilerOptions: { paths: { '@/*': ['*'], '#test/*': ['../test/*'] } },
    })
    expect((await detectProject(tmp)).aliases).toEqual({
      '@': join(tmp, 'src'),
      '#test': join(tmp, 'test'),
    })
  })

  it("replaces a parent's paths with the child's, as tsc does", async () => {
    write('package.json', vite)
    write('tsconfig.base.json', {
      compilerOptions: { paths: { '@/*': ['./src/*'], '#old/*': ['./legacy/*'] } },
    })
    write('tsconfig.json', {
      extends: './tsconfig.base.json',
      compilerOptions: { paths: { '@/*': ['./app/*'] } },
    })
    expect((await detectProject(tmp)).aliases).toEqual({ '@': join(tmp, 'app') })
  })

  it('finds an extended config named with dots and no .json', async () => {
    write('package.json', vite)
    write('tsconfig.app.base.json', { compilerOptions: { paths: { '@/*': ['./src/*'] } } })
    write('tsconfig.json', { extends: './tsconfig.app.base' })
    expect((await detectProject(tmp)).aliases).toEqual({ '@': join(tmp, 'src') })
  })

  it('survives an extends cycle', async () => {
    write('package.json', vite)
    write('tsconfig.json', {
      extends: './a.json',
      compilerOptions: { paths: { '@/*': ['./src/*'] } },
    })
    write('a.json', { extends: './tsconfig.json' })
    expect((await detectProject(tmp)).aliases).toEqual({ '@': join(tmp, 'src') })
  })
})

describe('AC-008 git files, wildcard paths and configDir', () => {
  let tmp: string
  beforeEach(() => {
    tmp = realpathSync(mkdtempSync(join(tmpdir(), 'heart-ui-detect-')))
  })
  afterEach(() => rmSync(tmp, { recursive: true, force: true }))

  const write = (path: string, value: unknown) => {
    mkdirSync(dirname(join(tmp, path)), { recursive: true })
    writeFileSync(join(tmp, path), typeof value === 'string' ? value : JSON.stringify(value))
  }
  const vite = { devDependencies: { vite: '7.0.0' } }

  it('treats a .git file (worktree or submodule) as the repo root', async () => {
    write('yarn.lock', '')
    write('pnpm-workspace.yaml', '')
    write('repo/.git', 'gitdir: ../.git/worktrees/repo\n')
    write('repo/package.json', vite)
    expect((await detectProject(join(tmp, 'repo'))).packageManager).toBe('npm')
  })

  it('keeps only wildcard paths as folder aliases', async () => {
    write('package.json', vite)
    write('tsconfig.json', {
      compilerOptions: {
        paths: { '@/*': ['./src/*'], '@': ['./src/index.ts'], '#utils': ['./u.ts'] },
      },
    })
    expect((await detectProject(tmp)).aliases).toEqual({ '@': join(tmp, 'src') })
  })

  it("resolves inherited paths against the child's baseUrl", async () => {
    write('package.json', vite)
    write('configs/tsconfig.base.json', { compilerOptions: { paths: { '@/*': ['./src/*'] } } })
    write('tsconfig.json', {
      extends: './configs/tsconfig.base.json',
      compilerOptions: { baseUrl: '.' },
    })
    expect((await detectProject(tmp)).aliases).toEqual({ '@': join(tmp, 'src') })
  })

  it('resolves ${configDir} to the folder of the config being read', async () => {
    write('package.json', vite)
    write('configs/tsconfig.base.json', {
      compilerOptions: { paths: { '@/*': ['${configDir}/src/*'] } },
    })
    write('tsconfig.json', { extends: './configs/tsconfig.base.json' })
    expect((await detectProject(tmp)).aliases).toEqual({ '@': join(tmp, 'src') })
  })
})

describe('AC-008 the home folder', () => {
  let home: string
  let saved: string | undefined
  beforeEach(() => {
    home = realpathSync(mkdtempSync(join(tmpdir(), 'heart-ui-home-')))
    saved = process.env.HOME
    process.env.HOME = home
  })
  afterEach(() => {
    process.env.HOME = saved
    rmSync(home, { recursive: true, force: true })
  })

  it('never counts a home folder kept in git as the workspace root', async () => {
    mkdirSync(join(home, '.git'))
    writeFileSync(join(home, 'yarn.lock'), '')
    mkdirSync(join(home, 'code/app'), { recursive: true })
    writeFileSync(
      join(home, 'code/app/package.json'),
      JSON.stringify({ devDependencies: { vite: '7' } }),
    )
    expect((await detectProject(join(home, 'code/app'))).packageManager).toBe('npm')
  })
})
