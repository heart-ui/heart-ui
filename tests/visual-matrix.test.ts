// The visual matrix covers every preset theme, in both modes, at each kind's widths, and each
// block and layout state.
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { baselineName, demoFiles, demoStates, themeNames, visualWidths } from '../apps/demo-files'

const visual = join(import.meta.dirname, '../apps/playground-vite/visual')

describe('visual matrix covers every theme', () => {
  it('lists the five presets', () => {
    expect(themeNames().sort()).toEqual(['default', 'forest', 'graphite', 'sunset', 'violet'])
  })

  it('has a baseline per demo, state, theme, mode and width', () => {
    const missing: string[] = []
    for (const { kind, name } of demoFiles()) {
      for (const state of demoStates(kind, name)) {
        for (const theme of themeNames()) {
          for (const mode of ['light', 'dark'] as const) {
            for (const width of visualWidths[kind]) {
              const file = baselineName({ kind, name, state, theme, mode, width })
              if (!existsSync(join(visual, '__screenshots__', file))) missing.push(file)
            }
          }
        }
      }
    }
    expect(missing).toEqual([])
  })

  it('names ui baselines as before and block baselines with their state', () => {
    const at = { theme: 'default', mode: 'light', width: 375 } as const
    expect(baselineName({ kind: 'ui', name: 'button', state: 'default', ...at })).toBe(
      'ui-button-default-light-375.png',
    )
    expect(baselineName({ kind: 'blocks', name: 'stats-row', state: 'empty', ...at })).toBe(
      'blocks-stats-row-empty-default-light-375.png',
    )
  })

  it('gives the placeholder block default plus all four states at three widths', () => {
    expect(demoStates('blocks', 'placeholder-block')).toEqual([
      'default',
      'empty',
      'loading',
      'error',
      'long',
    ])
    expect(demoStates('ui', 'button')).toEqual(['default'])
    expect(visualWidths.blocks).toEqual([375, 768, 1280])
  })

  it("reads a block's states defensively, and never reads item.json for ui", () => {
    const dir = mkdtempSync(join(tmpdir(), 'heart-ui-states-'))
    try {
      const write = (path: string, text: string) => {
        mkdirSync(join(dir, path, '..'), { recursive: true })
        writeFileSync(join(dir, path), text)
      }
      write('blocks/no-meta/item.json', '{"name":"no-meta"}')
      write('blocks/broken/item.json', '{"name": "broken",}')
      write('ui/odd/item.json', 'not json')
      expect(demoStates('blocks', 'no-meta', dir)).toEqual([
        'default',
        'empty',
        'loading',
        'error',
        'long',
      ])
      expect(demoStates('ui', 'odd', dir)).toEqual(['default'])
      expect(() => demoStates('blocks', 'broken', dir)).toThrow(/blocks\/broken\/item\.json/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
