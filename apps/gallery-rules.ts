// Shared by both playgrounds so their galleries list the same demos and read the same parameters.
// Each app's Vite build resolves the `@registry` alias in the glob below.
import type { Component } from 'vue'
import { statesFor } from './demo-states'

import type { ProvidedDemoState } from '@registry/blocks/_fixtures/demo-state'

export { demoStateKey } from '@registry/blocks/_fixtures/demo-state'

/** Demo loaders by item name: the folder that holds the demo, unique across ui, blocks and layouts. */
export function indexDemos<T>(modules: Record<string, T>): Map<string, T> {
  const demos = new Map<string, T>()
  for (const [path, load] of Object.entries(modules)) {
    const name = path.split('/').at(-2)!
    if (demos.has(name)) throw new Error(`More than one demo is named "${name}" (${path})`)
    demos.set(name, load)
  }
  return demos
}

export const demos = indexDemos(
  import.meta.glob<{ default: Component }>('@registry/{ui,blocks,layouts}/*/*.demo.vue'),
)

// The whole module, not its `meta` export: an item.json without meta must not break the gallery.
const items = import.meta.glob<{ default?: { meta?: { states?: unknown } } }>(
  '@registry/{blocks,layouts}/*/item.json',
  { eager: true },
)
const demoPaths = new Map(
  Object.keys(import.meta.glob('@registry/{ui,blocks,layouts}/*/*.demo.vue')).map((path) => [
    path.split('/').at(-2)!,
    path,
  ]),
)

/**
 * The kind of item the demo for a name belongs to. A layout renders the page's `main` itself, so
 * galleries and the test harness wrap only other demos in one.
 */
export function demoKind(name: string) {
  return demoPaths.get(name)?.split('/').at(-3)
}

/** The states the demo for an item name is shown in, as the Node runners compute them. */
export function demoStatesOf(name: string) {
  const path = demoPaths.get(name)
  if (!path) return statesFor('ui', undefined)
  const kind = path.split('/').at(-3)!
  const item = Object.entries(items).find(([path]) => path.split('/').at(-2) === name)?.[1]
  return statesFor(kind, item?.default?.meta)
}

function first(value: unknown) {
  const item = Array.isArray(value) ? value[0] : value
  return typeof item === 'string' ? item : undefined
}

/** `<html>` attributes for the gallery's `mode`, `dir` and `theme` query parameters. */
export function galleryAttrs(query: Record<string, unknown>) {
  const theme = first(query.theme)
  return {
    class: first(query.mode) === 'dark' ? 'dark' : undefined,
    dir: first(query.dir) === 'rtl' ? 'rtl' : 'ltr',
    'data-heart-theme': theme && /^[a-z0-9-]+$/.test(theme) ? theme : 'default',
  }
}

/** What the gallery provides a demo: its `state` query parameter and the states its item renders. */
export function galleryState(name: string, query: Record<string, unknown>): ProvidedDemoState {
  return { state: first(query.state), states: demoStatesOf(name) }
}
