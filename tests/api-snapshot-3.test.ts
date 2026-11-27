import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { timeout, sample, fixture, commit } from './api-snapshot.helpers.ts'

describe('API snapshots', () => {
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
})
