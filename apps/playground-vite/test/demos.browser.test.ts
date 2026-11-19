import { afterEach, describe, inject, it } from 'vitest'
import { demoStatesOf, demos } from '../../gallery-rules'
import { expectNoAxeViolations, mountDemo, unmountAll } from './harness'

afterEach(unmountAll)

const only = inject('item')
// Blocks and layouts are checked in every state they render, not just the one open on load.
const cases = [...demos.keys()]
  .filter((name) => !only || name === only)
  .flatMap((name) => demoStatesOf(name).map((state) => [name, state] as const))

declare module 'vitest' {
  export interface ProvidedContext {
    item: string
  }
}

describe.each(['light', 'dark'] as const)('every demo in %s mode', (mode) => {
  it.each(cases)('%s in state %s has no axe violations', async (name, state) => {
    await mountDemo(name, { mode, state })
    // The whole body, so content a demo teleports out of its root (portals) is checked too.
    await expectNoAxeViolations(document.body)
  })
})
