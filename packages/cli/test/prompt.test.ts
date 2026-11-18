import { PassThrough } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { askYesNo } from '../src/prompt.ts'

describe('AC-007 the yes-or-no prompt', () => {
  const ask = (feed: (input: PassThrough) => void) => {
    const input = new PassThrough()
    const output = new PassThrough()
    const answer = askYesNo('Continue?', input, output)
    feed(input)
    return answer
  }

  it.each([
    ['y\n', true],
    ['yes\n', true],
    ['n\n', false],
    ['\n', false],
  ])('reads %j as %s', async (typed, expected) => {
    expect(await ask((input) => input.write(typed))).toBe(expected)
  })

  it('reads the end of input (Ctrl+D) as no', async () => {
    expect(await ask((input) => input.end())).toBe(false)
  })
})
