// The demos on disk, for Node-side runners that can't use the galleries' import.meta.glob.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { statesFor } from './demo-states.ts'

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

/** The states a demo is screenshotted and server-rendered in (see statesFor). */
export function demoStates(kind: DemoKind, name: string, registry = registryDir) {
  if (kind === 'ui') return statesFor(kind, undefined)
  const itemPath = join(registry, kind, name, 'item.json')
  if (!existsSync(itemPath)) return statesFor(kind, undefined)
  let item: { meta?: { states?: unknown } } | null
  try {
    item = JSON.parse(readFileSync(itemPath, 'utf8')) as typeof item
  } catch {
    throw new Error(`${kind}/${name}/item.json is not valid JSON; run pnpm registry:build`)
  }
  return statesFor(kind, item?.meta)
}

/** A baseline's file name. ui demos have one state, so their names carry none. */
export function baselineName(at: {
  kind: DemoKind
  name: string
  state: string
  theme: string
  mode: 'light' | 'dark'
  width: number
}) {
  const state = at.kind === 'ui' ? '' : `-${at.state}`
  return `${at.kind}-${at.name}${state}-${at.theme}-${at.mode}-${at.width}.png`
}
