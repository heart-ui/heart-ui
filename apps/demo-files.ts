// The demos on disk, for Node-side runners that can't use the galleries' import.meta.glob.
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export const registryDir = join(import.meta.dirname, '../registry')
export type DemoKind = 'ui' | 'blocks' | 'layouts'

/** Visual widths: blocks and layouts reflow, so they are pinned at phone, tablet and desktop. */
export const visualWidths: Record<DemoKind, number[]> = {
  ui: [1024],
  blocks: [375, 768, 1280],
  layouts: [375, 768, 1280],
}

/** Every item folder under ui, blocks and layouts that holds a `*.demo.vue`. */
export function demoFiles(registry = registryDir): { kind: DemoKind; name: string }[] {
  return (['ui', 'blocks', 'layouts'] as const).flatMap((kind) => {
    const dir = join(registry, kind)
    if (!existsSync(dir)) return []
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .filter((entry) =>
        readdirSync(join(dir, entry.name)).some((file) => file.endsWith('.demo.vue')),
      )
      .map((entry) => ({ kind, name: entry.name }))
  })
}

/** Theme names from `registry/themes/*.json`. */
export function themeNames(registry = registryDir) {
  return readdirSync(join(registry, 'themes'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.slice(0, -'.json'.length))
}
