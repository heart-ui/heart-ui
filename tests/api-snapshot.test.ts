import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { renderPages } from '../apps/docs/scripts/pages.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const timeout = 120_000

type Member = { name: string; type?: string; default?: string; required?: boolean }
type Snapshot = {
  name: string
  version: string
  components: {
    name: string
    props: (Member & { description?: string })[]
    slots: { name: string; description?: string }[]
    events: { name: string; payload: string; description?: string }[]
  }[]
}

function run(script: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  const result = spawnSync(process.execPath, [join(root, 'scripts', script), ...args], {
    cwd: root,
    encoding: 'utf8',
    env,
  })
  if (result.error) throw result.error
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

const sample = (props: string) => `<script setup lang="ts">
export interface SampleProps {
${props}
}
withDefaults(defineProps<SampleProps>(), { tone: 'a' })
defineSlots<{ default(): unknown }>()
defineEmits<{ close: [] }>()
</script>

<template><p><slot /></p></template>
`
const twoProps = "  /** Tone. */\n  tone?: 'a' | 'b'\n  size?: 'sm' | 'md'"

// A registry under the repo (dist/ is ignored), so the type checker resolves `vue` from the
// repo's node_modules: one lib item without components and one ui item with one.
const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function fixture(component = sample(twoProps), version = '0.1.0') {
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
const withoutCI = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => key !== 'CI'),
) as NodeJS.ProcessEnv

// Commits the fixture as its own git repository, so `registry:api` finds a committed baseline.
function commit(dir: string, message = 'snapshot') {
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

describe('API snapshots', () => {
  it(
    'AC-001 writes a snapshot per component item',
    () => {
      const reg = fixture()
      const first = reg.api()
      expect(first.status, first.output).toBe(0)
      const snapshot = reg.read()
      expect(snapshot).toEqual({
        name: 'sample',
        version: '0.1.0',
        components: [
          {
            name: 'Sample',
            props: [
              {
                name: 'tone',
                type: "'a' | 'b'",
                required: false,
                default: "'a'",
                description: 'Tone.',
              },
              { name: 'size', type: "'sm' | 'md'", required: false },
            ],
            slots: [{ name: 'default' }],
            events: [{ name: 'close', payload: '' }],
          },
        ],
      })
      expect(readFileSync(reg.snapshotPath, 'utf8').endsWith('}\n')).toBe(true)
      expect(existsSync(join(reg.registry, 'lib/utils/utils.api.json'))).toBe(false)
      const text = readFileSync(reg.snapshotPath, 'utf8')
      expect(reg.api().status).toBe(0)
      expect(readFileSync(reg.snapshotPath, 'utf8')).toBe(text)
    },
    timeout,
  )

  it(
    'AC-002 snapshot matches the docs page',
    () => {
      const snapshot = JSON.parse(
        readFileSync(join(root, 'registry/ui/button/button.api.json'), 'utf8'),
      ) as Snapshot
      const page = renderPages().find((entry) => entry.name === 'button')!.item
      const props = page.slice(page.indexOf('\n## Props\n'), page.indexOf('\n## Slots\n'))
      const row = (name: string) =>
        props.split('\n').find((line) => line.startsWith(`| \`${name}\` |`)) ?? ''
      const button = snapshot.components.find((component) => component.name === 'Button')!
      expect(button.props.length).toBeGreaterThan(3)
      const dialog = JSON.parse(
        readFileSync(join(root, 'registry/ui/dialog/dialog.api.json'), 'utf8'),
      ) as Snapshot
      const dialogPage = renderPages().find((entry) => entry.name === 'dialog')!.item
      const events = dialogPage.slice(dialogPage.indexOf('\n## Events\n'))
      const open = dialog.components
        .flatMap((component) => component.events)
        .find((event) => event.name === 'update:open')!
      expect(open.payload).toBe('boolean')
      expect(events).toMatch(/\| `update:open` \| `boolean` \|/)
      for (const prop of button.props) {
        expect(row(prop.name), prop.name).toContain(`\`${prop.type!.replace(/\|/g, '\\|')}\``)
        if (prop.default !== undefined) {
          expect(row(prop.name), prop.name).toContain(`\`${prop.default}\``)
        }
      }
    },
    timeout,
  )

  it(
    'AC-003 build fails on a missing or orphaned snapshot, the check on a stale one',
    () => {
      const reg = fixture()
      const missing = reg.build()
      expect(missing.status).toBe(1)
      expect(missing.output).toMatch(/ui\/sample\/sample\.api\.json.*pnpm registry:api/)

      expect(reg.api().status).toBe(0)
      expect(reg.build().status).toBe(0)

      reg.setItem(sample(twoProps).replace("{ tone: 'a' }", "{ tone: 'b' }"))
      const stale = reg.api(['--check'])
      expect(stale.status).toBe(1)
      expect(stale.output).toMatch(/sample\.api\.json is stale.*pnpm registry:api/)

      expect(reg.api().status).toBe(0)
      writeFileSync(join(reg.registry, 'lib/utils/utils.api.json'), '{}\n')
      const orphan = reg.build()
      expect(orphan.status).toBe(1)
      expect(orphan.output).toMatch(/lib\/utils\/utils\.api\.json.*pnpm registry:api/)
    },
    timeout,
  )

  it(
    'AC-004 build publishes the snapshot',
    () => {
      const reg = fixture()
      expect(reg.api().status).toBe(0)
      expect(reg.build().status).toBe(0)
      const published = join(reg.dir, 'out/docs/sample.api.json')
      expect(readFileSync(published, 'utf8')).toBe(readFileSync(reg.snapshotPath, 'utf8'))
      const marker = JSON.parse(
        readFileSync(join(reg.dir, 'out/.heart-ui-registry-build.json'), 'utf8'),
      ) as { files: string[] }
      expect(marker.files).toContain('docs/sample.api.json')
      // The real publish, dry: it builds the repo's registry and lists what it would upload.
      const publish = run('registry-publish.ts', ['--dry-run'])
      expect(publish.status, publish.output).toBe(0)
      expect(publish.output).toContain('docs/button.api.json')
    },
    timeout,
  )

  it(
    'AC-005 breaking changes need a version and a changeset',
    () => {
      const reg = fixture()
      expect(reg.api().status).toBe(0)
      const before = readFileSync(reg.snapshotPath, 'utf8')
      const dropped = sample("  /** Tone. */\n  tone?: 'a' | 'b'\n  label: string")

      reg.setItem(dropped)
      const refused = reg.api()
      expect(refused.status).toBe(1)
      expect(refused.output).toMatch(/Sample: prop size removed/)
      expect(refused.output).toMatch(/Sample: prop label is now required/)
      expect(readFileSync(reg.snapshotPath, 'utf8')).toBe(before)

      reg.setItem(dropped, '0.1.1')
      expect(reg.api().status).toBe(1)
      reg.setItem(dropped, '0.2.0')
      expect(reg.api().status).toBe(1)
      writeFileSync(
        join(reg.dir, 'changesets/sample.md'),
        'BREAKING: the `sample` item drops size.\n',
      )
      const accepted = reg.api()
      expect(accepted.status).toBe(0)
      expect(reg.read().version).toBe('0.2.0')
      expect(reg.read().components[0]!.props.map((prop) => prop.name)).toEqual(['tone', 'label'])
    },
    timeout,
  )

  it(
    'AC-006 committed snapshots are current',
    () => {
      const kinds = ['ui', 'blocks', 'layouts', 'lib']
      const before = new Map<string, string>()
      for (const kind of kinds) {
        const dir = join(root, 'registry', kind)
        if (!existsSync(dir)) continue
        for (const name of readdirSync(dir)) {
          const path = join(dir, name, `${name}.api.json`)
          if (existsSync(path)) before.set(path, readFileSync(path, 'utf8'))
        }
      }
      expect(before.has(join(root, 'registry/ui/button/button.api.json'))).toBe(true)
      const check = run('registry-api.ts', ['--check'])
      expect(check.status, check.output).toBe(0)
      for (const [path, text] of before) expect(readFileSync(path, 'utf8'), path).toBe(text)
      const scripts = (
        JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
          scripts: Record<string, string>
        }
      ).scripts
      // pnpm check and check:item run this script, so both fail on a stale snapshot.
      expect(scripts['registry:build']).toBe(
        'node scripts/registry-api.ts --check && node scripts/registry-build.ts',
      )
    },
    timeout,
  )
  it(
    'AC-005 the guard compares with the committed snapshot, also in --check',
    () => {
      const reg = fixture()
      expect(reg.api().status).toBe(0)
      commit(reg.dir)
      const dropped = sample("  /** Tone. */\n  tone?: 'a' | 'b'")

      // A deleted or conflicted snapshot can't hide the change: git holds the baseline.
      rmSync(reg.snapshotPath)
      reg.setItem(dropped)
      const deleted = reg.api()
      expect(deleted.status).toBe(1)
      expect(deleted.output).toMatch(/Sample: prop size removed/)
      writeFileSync(reg.snapshotPath, '<<<<<<< HEAD\n{}\n=======\n')
      expect(reg.api().output).toMatch(/Sample: prop size removed/)

      // An announced change writes; --check still holds the branch to the announcement.
      reg.setItem(dropped, '0.2.0')
      writeFileSync(join(reg.dir, 'changesets/sample.md'), 'BREAKING: `sample` drops size.\n')
      expect(reg.api().status).toBe(0)
      expect(reg.api(['--check']).status).toBe(0)
      rmSync(join(reg.dir, 'changesets/sample.md'))
      const unannounced = reg.api(['--check'])
      expect(unannounced.status).toBe(1)
      expect(unannounced.output).toMatch(/sample\.api\.json: breaking change.*names `sample`/)
    },
    timeout,
  )

  it(
    'AC-005 removing an item or its components is breaking',
    () => {
      const reg = fixture()
      expect(reg.api().status).toBe(0)
      commit(reg.dir)
      writeFileSync(join(reg.registry, 'ui/sample/index.ts'), 'export const none = 1\n')
      const emptied = reg.api()
      expect(emptied.status).toBe(1)
      expect(emptied.output).toMatch(/Sample: component removed/)
      expect(existsSync(reg.snapshotPath)).toBe(true)

      rmSync(join(reg.registry, 'ui/sample'), { recursive: true })
      const gone = reg.api(['--check'])
      expect(gone.status).toBe(1)
      expect(gone.output).toMatch(
        /ui\/sample\/sample\.api\.json: breaking change.*Sample: component removed/,
      )
    },
    timeout,
  )

  it(
    'AC-005 only a changeset line naming the item announces it',
    () => {
      const reg = fixture()
      expect(reg.api().status).toBe(0)
      const dropped = sample("  /** Tone. */\n  tone?: 'a' | 'b'")
      reg.setItem(dropped, '0.2.0')
      const changeset = join(reg.dir, 'changesets/cli.md')
      writeFileSync(
        changeset,
        'BREAKING: the CLI no longer prompts.\n\nUnrelated: `sample` text.\n',
      )
      expect(reg.api().status).toBe(1)
      // A plain word is not the item: `input`, `label` and `select` are English too.
      writeFileSync(changeset, 'BREAKING: the CLI no longer reads sample paths.\n')
      expect(reg.api().status).toBe(1)
      writeFileSync(changeset, 'BREAKING: the `sample` item drops size.\n')
      writeFileSync(
        join(reg.dir, 'changesets/pre.json'),
        JSON.stringify({ mode: 'pre', changesets: ['cli'] }),
      )
      expect(reg.api().status).toBe(1)
      rmSync(join(reg.dir, 'changesets/pre.json'))
      expect(reg.api().status).toBe(0)
    },
    timeout,
  )

  it(
    'AC-001 refuses a registry without a tsconfig',
    () => {
      const reg = fixture()
      rmSync(join(reg.registry, 'tsconfig.json'))
      const result = reg.api()
      expect(result.status).toBe(1)
      expect(result.output).toMatch(/registry:api: .*tsconfig\.json/)
    },
    timeout,
  )
  it(
    'AC-005 the baseline is what main holds: new items are free, emptied items need a version',
    () => {
      const reg = fixture()
      rmSync(join(reg.registry, 'ui/sample'), { recursive: true })
      commit(reg.dir, 'main without sample')
      const again = fixture()
      cpSync(join(again.registry, 'ui/sample'), join(reg.registry, 'ui/sample'), {
        recursive: true,
      })
      expect(reg.api().status).toBe(0)
      // Not on main yet: dropping a prop breaks no user.
      reg.setItem(sample("  /** Tone. */\n  tone?: 'a' | 'b'"))
      expect(reg.api().status, reg.api().output).toBe(0)

      const shipped = fixture()
      expect(shipped.api().status).toBe(0)
      commit(shipped.dir)
      writeFileSync(join(shipped.registry, 'ui/sample/index.ts'), 'export const none = 1\n')
      rmSync(shipped.snapshotPath)
      writeFileSync(
        join(shipped.dir, 'changesets/sample.md'),
        'BREAKING: `sample` has no component.\n',
      )
      const emptied = shipped.api(['--check'])
      expect(emptied.status).toBe(1)
      expect(emptied.output).toMatch(/needs a version above 0\.1\.0/)
    },
    timeout,
  )

  it(
    'AC-005 a changeset released before the branch does not announce its break',
    () => {
      const reg = fixture()
      writeFileSync(join(reg.dir, 'changesets/old.md'), 'BREAKING: `sample` dropped tone.\n')
      expect(reg.api().status).toBe(0)
      commit(reg.dir)
      reg.setItem(sample("  /** Tone. */\n  tone?: 'a' | 'b'"), '0.2.0')
      const stale = reg.api()
      expect(stale.status).toBe(1)
      expect(stale.output).toMatch(/names `sample`/)
      writeFileSync(join(reg.dir, 'changesets/new.md'), 'BREAKING: `sample` drops size.\n')
      expect(reg.api().status).toBe(0)
    },
    timeout,
  )

  it(
    'AC-005 a registry at the top of its repository keeps its baseline',
    () => {
      const reg = fixture()
      expect(reg.api().status).toBe(0)
      commit(reg.registry)
      rmSync(reg.snapshotPath)
      reg.setItem(sample("  /** Tone. */\n  tone?: 'a' | 'b'"))
      expect(reg.api().output).toMatch(/Sample: prop size removed/)
    },
    timeout,
  )

  it(
    'AC-006 --check refuses to pass without its inputs',
    () => {
      const missing = run('registry-api.ts', ['--check', '--registry', join(root, 'registy')])
      expect(missing.status).toBe(1)
      expect(missing.output).toMatch(/registy/)

      // In CI the guard needs origin/main; it never falls back to HEAD silently.
      const reg = fixture()
      expect(reg.api().status).toBe(0)
      commit(reg.dir)
      const ci = reg.api(['--check'], { ...withoutCI, CI: 'true' })
      expect(ci.status).toBe(1)
      expect(ci.output).toMatch(/origin\/main/)
      const local = reg.api(['--check'])
      expect(local.status).toBe(0)
      expect(local.output).toMatch(/origin\/main/)
    },
    timeout,
  )
})
