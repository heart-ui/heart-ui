// The visual matrix covers every preset theme, in both modes, at each kind's widths.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { demoFiles, themeNames, visualWidths } from '../apps/demo-files'

const visual = join(import.meta.dirname, '../apps/playground-vite/visual')

describe('visual matrix covers every theme', () => {
  it('lists the five presets', () => {
    expect(themeNames().sort()).toEqual(['default', 'forest', 'graphite', 'sunset', 'violet'])
  })

  it('has a baseline per demo, theme, mode and width', () => {
    const missing: string[] = []
    for (const { kind, name } of demoFiles()) {
      for (const theme of themeNames()) {
        for (const mode of ['light', 'dark']) {
          for (const width of visualWidths[kind]) {
            const file = `${kind}-${name}-${theme}-${mode}-${width}.png`
            if (!existsSync(join(visual, '__screenshots__', file))) missing.push(file)
          }
        }
      }
    }
    expect(missing).toEqual([])
  })
})
