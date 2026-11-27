import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { root, timeout, run, sample, fixture, commit } from './api-snapshot.helpers.ts'

describe('API snapshots', () => {
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
})
