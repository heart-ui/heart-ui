import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Separator } from '.'

afterEach(unmountAll)

/** The colour a token utility resolves to, read from a probe element. */
function token(className: string) {
  const probe = document.createElement('span')
  probe.className = className
  document.body.append(probe)
  const value = getComputedStyle(probe).backgroundColor
  probe.remove()
  return value
}

const rule = (root: Element) => root.querySelector<HTMLElement>('[data-slot="separator"]')!

describe('Separator', () => {
  describe('orientation', () => {
    it('is a one-pixel border-coloured rule across the width by default', () => {
      const root = render(() => h('div', { class: 'w-60' }, [h(Separator)]))
      const separator = rule(root)
      expect(separator.dataset.orientation).toBe('horizontal')
      const box = separator.getBoundingClientRect()
      expect(box.width).toBe(separator.parentElement!.getBoundingClientRect().width)
      expect(box.height).toBe(1)
      expect(token('bg-border')).not.toBe(token('bg-transparent'))
      expect(getComputedStyle(separator).backgroundColor).toBe(token('bg-border'))
    })

    it('stretches a vertical rule to the height of its row', () => {
      const root = render(() =>
        h('div', { class: 'flex h-10 items-center' }, [
          h('span', 'Docs'),
          h(Separator, { orientation: 'vertical' }),
          h('span', 'Blog'),
        ]),
      )
      const separator = rule(root)
      expect(separator.dataset.orientation).toBe('vertical')
      const box = separator.getBoundingClientRect()
      expect(box.width).toBe(1)
      expect(box.height).toBe(separator.parentElement!.getBoundingClientRect().height)
      expect(box.height).toBeGreaterThan(1)
    })
  })

  describe('accessibility', () => {
    it('is decorative by default: role none, no orientation for readers', () => {
      const separator = rule(render(() => h(Separator, { orientation: 'vertical' })))
      expect(separator.getAttribute('role')).toBe('none')
      expect(separator.hasAttribute('aria-orientation')).toBe(false)
    })

    it('is a separator with decorative off, and says when it is vertical', () => {
      const horizontal = rule(render(() => h(Separator, { decorative: false })))
      expect(horizontal.getAttribute('role')).toBe('separator')
      expect(horizontal.hasAttribute('aria-orientation')).toBe(false)
      const vertical = rule(
        render(() => h(Separator, { decorative: false, orientation: 'vertical' })),
      )
      expect(vertical.getAttribute('role')).toBe('separator')
      expect(vertical.getAttribute('aria-orientation')).toBe('vertical')
    })
  })

  describe('attributes', () => {
    it('passes attributes through and merges class last', () => {
      const separator = rule(
        render(() => h(Separator, { id: 'rule', 'data-test': 'x', class: 'bg-primary' })),
      )
      expect(separator.id).toBe('rule')
      expect(separator.dataset.test).toBe('x')
      expect(separator.className).toMatch(/(^| )bg-primary( |$)/)
      expect(separator.className).not.toMatch(/(^| )bg-border( |$)/)
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('separator', { mode })
      await expectNoAxeViolations()
    })
  })
})
