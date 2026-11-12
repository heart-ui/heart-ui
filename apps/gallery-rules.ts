// Shared by both playgrounds so their galleries list the same demos and read the same parameters.
// Each app's Vite build resolves the `@registry` alias in the glob below.
import type { Component } from 'vue'

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
    'data-tre-theme': theme && /^[a-z0-9-]+$/.test(theme) ? theme : 'default',
  }
}
