import { describe, expect, it } from 'vitest'
import { timeout, run } from './toolchain.helpers.ts'

describe('toolchain', () => {
  // Typecheck is the slowest test in the suite, so it runs in its own file, beside the rest.
  describe('pass on the scaffold', () => {
    it.each(['typecheck'])(
      '%s exits 0',
      (script) => {
        const result = run(script)
        expect(result.status, result.output).toBe(0)
      },
      timeout,
    )
  })
})
