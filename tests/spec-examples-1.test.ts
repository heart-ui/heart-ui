import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { root, timeout, run, spec } from './spec-examples.helpers.ts'

describe('spec examples', () => {
  it(
    'AC-001 every spec example type-checks',
    () => {
      const result = run([])
      expect(result.status, result.output).toBe(0)
      expect(result.output).toMatch(/every example type-checks/)
    },
    timeout,
  )

  it(
    'AC-002 a made-up prop fails',
    () => {
      const file = spec({
        Usage: '<Button variant="primary">Save</Button>\n<Button frobnicate="x">Go</Button>',
      })
      const result = run(['--md', file])
      expect(result.status).toBe(1)
      expect(result.output).toContain(`${file}:9: `)
      expect(result.output).toMatch(/frobnicate/)
    },
    timeout,
  )

  it(
    'AC-003 a made-up event or component fails',
    () => {
      const event = spec({ Do: '<Button @frobnicate="go">Go</Button>' })
      const failed = run(['--md', event])
      expect(failed.status).toBe(1)
      expect(failed.output).toMatch(/onFrobnicate|frobnicate/)

      const component = spec({ Usage: '<Buton variant="primary">Go</Buton>' })
      const missing = run(['--md', component])
      expect(missing.status).toBe(1)
      expect(missing.output).toMatch(/Buton/)
    },
    timeout,
  )

  it(
    'AC-004 what an example may use',
    () => {
      const file = spec({
        Usage: [
          '<Label for="email">Email</Label>',
          '<Input id="email" v-model="email" type="email" required aria-describedby="hint" data-test="email" />',
          '<Button variant="primary" :loading="saving" @click="save" @keydown.enter="save">Save</Button>',
          '<Button variant="ghost" aria-label="Close"><Icon name="close" /></Button>',
          '<RouterView />',
        ].join('\n'),
        'Do not': '<Button frobnicate="x" @frob="go">Wrong on purpose</Button>',
      })
      const result = run(['--md', file])
      expect(result.status, result.output).toBe(0)
    },
    timeout,
  )

  it('AC-005 the gates run it', () => {
    const scripts = (
      JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
        scripts: Record<string, string>
      }
    ).scripts
    expect(scripts.typecheck).toMatch(/&& node scripts\/spec-examples\.ts$/)
    const plan = spawnSync(
      process.execPath,
      [join(root, 'scripts/check.ts'), '--item', 'button', '--dry-run'],
      { cwd: root, encoding: 'utf8' },
    )
    const typecheck = plan.stdout.split('\n').find((line) => line.startsWith('typecheck: ')) ?? ''
    expect(typecheck).toMatch(/node scripts\/spec-examples\.ts --item button/)
  })
})
