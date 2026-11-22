import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Skeleton } from '.'

afterEach(unmountAll)

/** A computed style of a probe element carrying the given utility classes. */
function probe(className: string, read: (style: CSSStyleDeclaration) => string) {
  const element = document.createElement('div')
  element.className = className
  document.body.append(element)
  const value = read(getComputedStyle(element))
  element.remove()
  return value
}

const skeleton = (root: Element) => root.querySelector<HTMLElement>('[data-slot="skeleton"]')!

/** Every CSS rule whose selector names the class, with the media conditions around it. */
function rulesFor(className: string) {
  const escaped = CSS.escape(className)
  const found: { media: string[] }[] = []
  const walk = (rules: CSSRuleList, media: string[]) => {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) walk(rule.cssRules, [...media, rule.conditionText])
      else if (rule instanceof CSSStyleRule && rule.selectorText.includes(`.${escaped}`))
        found.push({ media })
      else if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules, media)
    }
  }
  for (const sheet of document.styleSheets) walk(sheet.cssRules, [])
  return found
}

describe('Skeleton', () => {
  describe('look', () => {
    it('is a muted, rounded block with no size of its own', () => {
      const root = render(() => h('div', { class: 'w-60' }, [h(Skeleton)]))
      const element = skeleton(root)
      const style = getComputedStyle(element)
      expect(probe('bg-muted', (s) => s.backgroundColor)).not.toBe(
        probe('bg-transparent', (s) => s.backgroundColor),
      )
      expect(style.backgroundColor).toBe(probe('bg-muted', (s) => s.backgroundColor))
      expect(style.borderTopLeftRadius).toBe(probe('rounded-md', (s) => s.borderTopLeftRadius))
      expect(style.display).toBe('block')
      expect(element.getBoundingClientRect().height).toBe(0)
    })
  })

  describe('shape', () => {
    it('takes its size and shape from class, merged last', () => {
      const root = render(() => h(Skeleton, { class: 'h-4 w-48 rounded-full' }))
      const element = skeleton(root)
      const box = element.getBoundingClientRect()
      expect(box.width).toBe(parseFloat(probe('h-4 w-48', (s) => s.width)))
      expect(box.height).toBe(parseFloat(probe('h-4 w-48', (s) => s.height)))
      expect(element.className).toMatch(/(^| )rounded-full( |$)/)
      expect(element.className).not.toMatch(/(^| )rounded-md( |$)/)
      expect(getComputedStyle(element).borderTopLeftRadius).toBe(
        probe('rounded-full', (s) => s.borderTopLeftRadius),
      )
    })
  })

  describe('motion', () => {
    it('pulses when motion is allowed', () => {
      const element = skeleton(render(() => h(Skeleton, { class: 'h-4 w-48' })))
      expect(window.matchMedia('(prefers-reduced-motion: no-preference)').matches).toBe(true)
      const style = getComputedStyle(element)
      expect(style.animationName).not.toBe('none')
      expect(style.animationIterationCount).toBe('infinite')
    })

    it('pulses only under prefers-reduced-motion: no-preference', () => {
      const element = skeleton(render(() => h(Skeleton)))
      const pulse = [...element.classList].filter((name) => /animate-/.test(name))
      expect(pulse.length).toBeGreaterThan(0)
      for (const name of pulse) {
        const rules = rulesFor(name)
        expect(rules.length, name).toBeGreaterThan(0)
        for (const { media } of rules) {
          expect(media.join(' '), name).toMatch(/prefers-reduced-motion:\s*no-preference/)
        }
      }
    })
  })

  describe('accessibility', () => {
    it('is hidden from screen readers and passes attributes through', () => {
      const element = skeleton(
        render(() => h(Skeleton, { id: 'line', 'data-test': 'x', class: 'h-4' })),
      )
      expect(element.getAttribute('aria-hidden')).toBe('true')
      expect(element.id).toBe('line')
      expect(element.dataset.test).toBe('x')
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('skeleton', { mode })
      await expectNoAxeViolations()
    })
  })
})
