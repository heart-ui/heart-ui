import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach } from 'vitest'

export const root = fileURLToPath(new URL('..', import.meta.url))
export const timeout = 120_000

export type Member = { name: string; type?: string; default?: string; required?: boolean }
export type Snapshot = {
  name: string
  version: string
  components: {
    name: string
    props: (Member & { description?: string })[]
    slots: { name: string; description?: string }[]
    events: { name: string; payload: string; description?: string }[]
  }[]
}

export function run(script: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  const result = spawnSync(process.execPath, [join(root, 'scripts', script), ...args], {
    cwd: root,
    encoding: 'utf8',
    env,
  })
  if (result.error) throw result.error
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

export const sample = (props: string) => `<script setup lang="ts">
export interface SampleProps {
${props}
}
withDefaults(defineProps<SampleProps>(), { tone: 'a' })
defineSlots<{ default(): unknown }>()
defineEmits<{ close: [] }>()
</script>

<template><p><slot /></p></template>
`
export const twoProps = "  /** Tone. */\n  tone?: 'a' | 'b'\n  size?: 'sm' | 'md'"

// A registry under the repo (dist/ is ignored), so the type checker resolves `vue` from the
// repo's node_modules: one lib item without components and one ui item with one.
export const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

export function fixture(component = sample(twoProps), version = '0.1.0') {
  mkdirSync(join(root, 'dist'), { recursive: true })
  const dir = mkdtempSync(join(root, 'dist', 'api-snapshot-'))
  dirs.push(dir)
  const registry = join(dir, 'registry')
  cpSync(join(root, 'registry/lib/utils'), join(registry, 'lib/utils'), { recursive: true })
  const files: Record<string, string> = {
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        strict: true,
        target: 'ESNext',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        jsx: 'preserve',
        noEmit: true,
      },
      include: ['**/*.ts', '**/*.vue'],
    }),
    'ui/sample/Sample.vue': component,
    'ui/sample/index.ts': "export { default as Sample } from './Sample.vue'\n",
    'ui/sample/item.json': JSON.stringify({
      name: 'sample',
      type: 'registry:ui',
      title: 'Sample',
      description: 'A sample.',
      files: ['Sample.vue', 'index.ts'],
      meta: { version, tier: 1 },
    }),
  }
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(dirname(join(registry, file)), { recursive: true })
    writeFileSync(join(registry, file), text)
  }
  mkdirSync(join(dir, 'changesets'))
  return {
    dir,
    registry,
    api: (args: string[] = [], env?: NodeJS.ProcessEnv) =>
      run(
        'registry-api.ts',
        ['--registry', registry, '--changesets', join(dir, 'changesets'), ...args],
        env ?? withoutCI,
      ),
    build: () => run('registry-build.ts', ['--registry', registry, '--out', join(dir, 'out')]),
    snapshotPath: join(registry, 'ui/sample/sample.api.json'),
    read: () =>
      JSON.parse(readFileSync(join(registry, 'ui/sample/sample.api.json'), 'utf8')) as Snapshot,
    setItem: (next: string, nextVersion = version) => {
      writeFileSync(join(registry, 'ui/sample/Sample.vue'), next)
      const item = JSON.parse(readFileSync(join(registry, 'ui/sample/item.json'), 'utf8')) as {
        meta: { version: string }
      }
      item.meta.version = nextVersion
      writeFileSync(join(registry, 'ui/sample/item.json'), JSON.stringify(item))
    },
  }
}

// The fixtures' own git repositories have no origin/main, which CI would refuse.
export const withoutCI = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => key !== 'CI'),
) as NodeJS.ProcessEnv

// Commits the fixture as its own git repository, so `registry:api` finds a committed baseline.
export function commit(dir: string, message = 'snapshot') {
  const git = (...args: string[]) => {
    const result = spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
    if (result.status !== 0) throw new Error(`git ${args.join(' ')}: ${result.stderr}`)
  }
  if (!existsSync(join(dir, '.git'))) {
    git('init', '-q', '-b', 'main')
    git('config', 'user.email', 'test@example.com')
    git('config', 'user.name', 'Test')
  }
  git('add', '-A')
  git('commit', '-q', '-m', message)
}
