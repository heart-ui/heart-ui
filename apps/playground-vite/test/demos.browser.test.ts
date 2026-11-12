import { afterEach, describe, it } from 'vitest'
import { demos } from '../../gallery-rules'
import { expectNoAxeViolations, mountDemo, unmountAll } from './harness'

afterEach(unmountAll)

describe.each(['light', 'dark'] as const)('every demo in %s mode', (mode) => {
  it.each([...demos.keys()])('%s has no axe violations', async (name) => {
    await mountDemo(name, { mode })
    // The whole body, so content a demo teleports out of its root (portals) is checked too.
    await expectNoAxeViolations(document.body)
  })
})
