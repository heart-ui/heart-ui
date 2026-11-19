// Which states a demo is rendered in, shared by the Node runners (visual, SSR) and the browser tests.
import type { DemoState } from '../registry/blocks/_fixtures/demo-state'

const dataStates = ['empty', 'loading', 'error', 'long'] as const

/**
 * `default` for ui demos. Blocks and layouts add their `meta.states`, or all four when the demo
 * folder has no item.json (a fixture such as placeholder-block).
 */
export function statesFor(kind: string, meta: { states?: unknown } | undefined): DemoState[] {
  if (kind === 'ui') return ['default']
  const listed = meta?.states
  if (!Array.isArray(listed)) return ['default', ...dataStates]
  return ['default', ...dataStates.filter((state) => listed.includes(state))]
}
