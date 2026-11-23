import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Progress } from '.'

afterEach(() => {
  vi.restoreAllMocks()
  unmountAll()
})

/** A computed style of a probe element carrying the given utility classes. */
function probe(className: string, read: (style: CSSStyleDeclaration) => string) {
  const element = document.createElement('div')
  element.className = className
  document.body.append(element)
  const value = read(getComputedStyle(element))
  element.remove()
  return value
}

const track = (root: Element) => root.querySelector<HTMLElement>('[data-slot="progress"]')!
const indicator = (root: Element) =>
  root.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!

/** Every CSS rule whose selector names the class, with its media conditions, layers and animation. */
function rulesFor(className: string) {
  const escaped = CSS.escape(className)
  const found: { media: string[]; layers: string[]; animation: string }[] = []
  const walk = (rules: CSSRuleList, media: string[], layers: string[]) => {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) walk(rule.cssRules, [...media, rule.conditionText], layers)
      else if (typeof CSSLayerBlockRule !== 'undefined' && rule instanceof CSSLayerBlockRule)
        walk(rule.cssRules, media, [...layers, rule.name])
      else if (rule instanceof CSSStyleRule && rule.selectorText.includes(`.${escaped}`))
        found.push({ media, layers, animation: rule.style.animationName || rule.style.animation })
      else if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules, media, layers)
    }
  }
  for (const sheet of document.styleSheets) walk(sheet.cssRules, [], [])
  return found
}

describe('Progress', () => {
  describe('sizes', () => {
    it('renders a muted pill track and primary fill across sm, md (default) and lg', () => {
      const root = render(() =>
        h('div', { class: 'w-60' }, [
          h(Progress, { modelValue: 50, size: 'sm', 'aria-label': 'Small' }),
          h(Progress, { modelValue: 50, 'aria-label': 'Default' }),
          h(Progress, { modelValue: 50, size: 'md', 'aria-label': 'Medium' }),
          h(Progress, { modelValue: 50, size: 'lg', 'aria-label': 'Large' }),
        ]),
      )
      const bars = [...root.querySelectorAll<HTMLElement>('[data-slot="progress"]')]
      const [sm, def, md, lg] = bars.map((el) => el.getBoundingClientRect().height)
      expect(sm).toBe(parseFloat(probe('h-1', (s) => s.height)))
      expect(def).toBe(parseFloat(probe('h-2', (s) => s.height)))
      expect(md).toBe(def)
      expect(lg).toBe(parseFloat(probe('h-3', (s) => s.height)))
      expect(sm!).toBeLessThan(md!)
      expect(md!).toBeLessThan(lg!)

      const muted = probe('bg-muted', (s) => s.backgroundColor)
      const primary = probe('bg-primary', (s) => s.backgroundColor)
      const transparent = probe('bg-transparent', (s) => s.backgroundColor)
      expect(muted).not.toBe(transparent)
      expect(primary).not.toBe(transparent)
      expect(getComputedStyle(bars[1]!).backgroundColor).toBe(muted)
      expect(getComputedStyle(bars[1]!).borderTopLeftRadius).toBe(
        probe('rounded-full', (s) => s.borderTopLeftRadius),
      )
      expect(getComputedStyle(indicator(root)).backgroundColor).toBe(primary)
    })

    it.each(['xl', 'constructor', 'toString'])('falls back to md for unknown size %s', (bad) => {
      const root = render(() =>
        h('div', { class: 'w-60' }, [
          h(Progress, { modelValue: 50, size: bad as never, 'aria-label': 'Fallback' }),
        ]),
      )
      const el = track(root)
      expect(el.getBoundingClientRect().height).toBe(parseFloat(probe('h-2', (s) => s.height)))
      expect(getComputedStyle(el).backgroundColor).toBe(probe('bg-muted', (s) => s.backgroundColor))
    })
  })

  describe('value', () => {
    it('reflects 0%, partial, 100% and custom max in ARIA, data-state and fill width', async () => {
      const cases = [
        { modelValue: 0, max: 100, state: 'loading', ratio: 0 },
        { modelValue: 60, max: 100, state: 'loading', ratio: 0.6 },
        { modelValue: 100, max: 100, state: 'complete', ratio: 1 },
        { modelValue: 50, max: 200, state: 'loading', ratio: 0.25 },
      ]
      for (const c of cases) {
        const root = render(() =>
          h('div', { class: 'w-60' }, [
            h(Progress, { modelValue: c.modelValue, max: c.max, 'aria-label': 'Task' }),
          ]),
        )
        const bar = track(root)
        const fill = indicator(root)
        expect(bar.getAttribute('aria-valuemin')).toBe('0')
        expect(bar.getAttribute('aria-valuemax')).toBe(String(c.max))
        expect(bar.getAttribute('aria-valuenow')).toBe(String(c.modelValue))
        expect(bar.dataset.state).toBe(c.state)
        expect(fill.dataset.state).toBe(c.state)
        const expectedWidth = bar.getBoundingClientRect().width * c.ratio
        expect(fill.getBoundingClientRect().width).toBeCloseTo(expectedWidth, 0)
      }

      const value = ref<number | null>(20)
      const max = ref(100)
      const root = render(() =>
        h('div', { class: 'w-60' }, [
          h(Progress, { modelValue: value.value, max: max.value, 'aria-label': 'Live' }),
        ]),
      )
      expect(track(root).getAttribute('aria-valuenow')).toBe('20')
      value.value = 100
      await nextTick()
      expect(track(root).getAttribute('aria-valuenow')).toBe('100')
      expect(track(root).dataset.state).toBe('complete')
      expect(indicator(root).style.inlineSize).toBe('100%')

      // Reactive determinate <-> indeterminate transitions and shrinking max below modelValue.
      value.value = null
      await nextTick()
      expect(track(root).dataset.state).toBe('indeterminate')
      expect(track(root).hasAttribute('aria-valuenow')).toBe(false)

      value.value = 80
      await nextTick()
      expect(track(root).getAttribute('aria-valuenow')).toBe('80')
      expect(indicator(root).style.inlineSize).toBe('80%')

      max.value = 50
      await nextTick()
      expect(track(root).getAttribute('aria-valuemax')).toBe('50')
      expect(track(root).getAttribute('aria-valuenow')).toBe('50')
      expect(track(root).dataset.state).toBe('complete')
      expect(indicator(root).style.inlineSize).toBe('100%')
    })

    it('fills from inline-start in both LTR and RTL', () => {
      const ltr = render(() =>
        h('div', { dir: 'ltr', class: 'w-60' }, [
          h(Progress, { modelValue: 40, 'aria-label': 'LTR' }),
        ]),
      )
      const ltrTrack = track(ltr).getBoundingClientRect()
      const ltrFill = indicator(ltr).getBoundingClientRect()
      expect(Math.abs(ltrFill.left - ltrTrack.left)).toBeLessThanOrEqual(1)
      expect(ltrTrack.right - ltrFill.right).toBeGreaterThan(10)

      const rtl = render(() =>
        h('div', { dir: 'rtl', class: 'w-60' }, [
          h(Progress, { modelValue: 40, 'aria-label': 'RTL' }),
        ]),
      )
      const rtlTrack = track(rtl).getBoundingClientRect()
      const rtlFill = indicator(rtl).getBoundingClientRect()
      expect(Math.abs(rtlFill.right - rtlTrack.right)).toBeLessThanOrEqual(1)
      expect(rtlFill.left - rtlTrack.left).toBeGreaterThan(10)
    })

    it('clamps out-of-range values and falls back invalid max to 100 without console errors', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const low = render(() =>
        h('div', { class: 'w-60' }, [h(Progress, { modelValue: -20, 'aria-label': 'Low' })]),
      )
      expect(track(low).getAttribute('aria-valuenow')).toBe('0')
      expect(track(low).dataset.state).toBe('loading')
      expect(indicator(low).getBoundingClientRect().width).toBe(0)

      const high = render(() =>
        h('div', { class: 'w-60' }, [h(Progress, { modelValue: 150, 'aria-label': 'High' })]),
      )
      expect(track(high).getAttribute('aria-valuenow')).toBe('100')
      expect(track(high).dataset.state).toBe('complete')
      expect(indicator(high).getBoundingClientRect().width).toBeCloseTo(
        track(high).getBoundingClientRect().width,
        0,
      )

      for (const badMax of [0, -10, Number.NaN, Number.POSITIVE_INFINITY]) {
        const root = render(() =>
          h('div', { class: 'w-60' }, [
            h(Progress, { modelValue: 25, max: badMax, 'aria-label': 'Bad max' }),
          ]),
        )
        expect(track(root).getAttribute('aria-valuemax')).toBe('100')
        expect(track(root).getAttribute('aria-valuenow')).toBe('25')
      }

      expect(errorSpy).not.toHaveBeenCalled()
    })
  })

  describe('indeterminate', () => {
    it('is indeterminate when modelValue is omitted, null or non-finite', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      for (const props of [
        { 'aria-label': 'Omitted' },
        { modelValue: null, 'aria-label': 'Null' },
        { modelValue: Number.NaN, 'aria-label': 'NaN' },
        { modelValue: Number.POSITIVE_INFINITY, 'aria-label': 'Infinity' },
        { modelValue: Number.NEGATIVE_INFINITY, 'aria-label': '-Infinity' },
      ]) {
        const root = render(() => h('div', { class: 'w-60' }, [h(Progress, props)]))
        const bar = track(root)
        const fill = indicator(root)
        expect(bar.dataset.state).toBe('indeterminate')
        expect(fill.dataset.state).toBe('indeterminate')
        expect(bar.hasAttribute('aria-valuenow')).toBe(false)
        expect(bar.getAttribute('aria-valuemin')).toBe('0')
        expect(bar.getAttribute('aria-valuemax')).toBe('100')
        const ratio = fill.getBoundingClientRect().width / bar.getBoundingClientRect().width
        expect(ratio).toBeGreaterThan(0.2)
        expect(ratio).toBeLessThan(0.6)
      }
      expect(errorSpy).not.toHaveBeenCalled()
    })

    it('animates only under prefers-reduced-motion: no-preference and never reorders Tailwind layers', () => {
      const root = render(() =>
        h('div', { class: 'w-60' }, [h(Progress, { modelValue: null, 'aria-label': 'Loading' })]),
      )
      const fill = indicator(root)
      expect(window.matchMedia('(prefers-reduced-motion: no-preference)').matches).toBe(true)
      const style = getComputedStyle(fill)
      expect(style.animationName).not.toBe('none')
      expect(style.animationIterationCount).toBe('infinite')

      const rules = rulesFor('heart-progress-indeterminate')
      expect(rules.length).toBeGreaterThan(0)
      const tailwindLayers = new Set(['theme', 'base', 'components', 'utilities'])
      for (const { layers } of rules) {
        for (const layer of layers) expect(tailwindLayers.has(layer), layer).toBe(false)
      }

      const animatedRules = rules.filter((r) => r.animation)
      expect(animatedRules.length).toBeGreaterThan(0)
      for (const { media } of animatedRules) {
        expect(media.join(' ')).toMatch(/prefers-reduced-motion:\s*no-preference/)
      }
    })

    it.each(['ltr', 'rtl'] as const)(
      'rests centered via mx-auto when animation is off in %s',
      (dir) => {
        const root = render(() =>
          h('div', { dir, class: 'w-60' }, [
            h(Progress, { modelValue: null, 'aria-label': 'Loading' }),
          ]),
        )
        const bar = track(root)
        const fill = indicator(root)
        expect(fill.className).toMatch(/(^| )mx-auto( |$)/)
        fill.style.animation = 'none'
        const barBox = bar.getBoundingClientRect()
        const fillBox = fill.getBoundingClientRect()
        const startGap = fillBox.left - barBox.left
        const endGap = barBox.right - fillBox.right
        expect(startGap).toBeGreaterThan(20)
        expect(Math.abs(startGap - endGap)).toBeLessThanOrEqual(1)
      },
    )
  })

  describe('accessibility', () => {
    it('uses role progressbar, omits synthetic aria-label, forwards attributes and merges class last', () => {
      const unnamed = track(render(() => h(Progress, { modelValue: 50 })))
      expect(unnamed.getAttribute('role')).toBe('progressbar')
      expect(unnamed.hasAttribute('aria-label')).toBe(false)

      const labelledBy = render(() =>
        h('div', [
          h('span', { id: 'p-label' }, 'Exporting'),
          h(Progress, {
            modelValue: 50,
            'aria-labelledby': 'p-label',
            'aria-valuetext': '2 of 4 files',
            id: 'export-progress',
            'data-test': 'x',
            class: 'bg-surface-sunken rounded-md',
          }),
        ]),
      )
      const bar = track(labelledBy)
      expect(bar.getAttribute('role')).toBe('progressbar')
      expect(bar.hasAttribute('aria-label')).toBe(false)
      expect(bar.getAttribute('aria-labelledby')).toBe('p-label')
      expect(bar.getAttribute('aria-valuetext')).toBe('2 of 4 files')
      expect(bar.id).toBe('export-progress')
      expect(bar.dataset.test).toBe('x')
      expect(bar.className).toMatch(/(^| )bg-surface-sunken( |$)/)
      expect(bar.className).not.toMatch(/(^| )bg-muted( |$)/)
      expect(bar.className).toMatch(/(^| )rounded-md( |$)/)
      expect(bar.className).not.toMatch(/(^| )rounded-full( |$)/)

      const labelled = track(
        render(() => h(Progress, { modelValue: 50, 'aria-label': 'Uploading' })),
      )
      expect(labelled.getAttribute('aria-label')).toBe('Uploading')
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('progress', { mode })
      await expectNoAxeViolations()
    })
  })
})
