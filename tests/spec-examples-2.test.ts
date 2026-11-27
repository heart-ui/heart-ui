import { describe, expect, it } from 'vitest'
import { timeout, run, spec } from './spec-examples.helpers.ts'

describe('spec examples', () => {
  it(
    'AC-002 a made-up prop fails beside allowed attributes, and form state never falls through',
    () => {
      for (const [code, named] of [
        ['<Button aria-label="x" frobnicate="y">Go</Button>', 'frobnicate'],
        ['<Button id="a" data-test="b" frobnicate="y">Go</Button>', 'frobnicate'],
        ['<Checkbox checked>Agree</Checkbox>', 'checked'],
        ['<Button @change="go">Go</Button>', 'change'],
        ['<Checkbox type="email" placeholder="x">Agree</Checkbox>', 'type'],
        ['<Select><SelectTrigger aria-label="Pick" rows="3" /></Select>', 'rows'],
      ] as const) {
        const result = run(['--md', spec({ Usage: code })])
        expect(result.status, code).toBe(1)
        expect(result.output, code).toContain(named)
        expect(result.output, code).not.toMatch(/unknown prop (?:aria-label|id|data-test)/)
      }
      const form = spec({
        Usage: '<Input type="email" name="email" required autocomplete="email" @change="go" />',
      })
      const allowed = run(['--md', form])
      expect(allowed.status, allowed.output).toBe(0)
    },
    timeout,
  )
})
