import { afterEach, describe, inject, it } from 'vitest'
import { demos } from '../../gallery-rules'
import { expectNoAxeViolations, mountDemo, unmountAll } from './harness'

afterEach(unmountAll)

const only = inject('item')
const names = [...demos.keys()].filter((name) => !only || name === only)

declare module 'vitest' {
  export interface ProvidedContext {
    item: string
  }
}

describe.each(['light', 'dark'] as const)('every demo in %s mode', (mode) => {
  it.each(names)('%s has no axe violations', async (name) => {
    await mountDemo(name, { mode })
    // The whole body, so content a demo teleports out of its root (portals) is checked too.
    await expectNoAxeViolations(document.body)
  })
})
