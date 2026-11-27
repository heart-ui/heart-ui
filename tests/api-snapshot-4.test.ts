import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { root, timeout, run, sample, fixture, withoutCI, commit } from './api-snapshot.helpers.ts'

describe('API snapshots', () => {
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
