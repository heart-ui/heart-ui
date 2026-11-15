import { afterEach, describe, expect, it } from 'vitest'
import { createCommentVNode, h } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Badge } from '.'

afterEach(unmountAll)

const variants = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const

/** The colour a token utility resolves to, read from a probe element. */
function token(className: string, property: 'color' | 'backgroundColor') {
  const probe = document.createElement('span')
  probe.className = className
  document.body.append(probe)
  const value = getComputedStyle(probe)[property]
  probe.remove()
  return value
}

describe('Badge', () => {
  describe('variants and sizes', () => {
    it.each([
      ['neutral', 'bg-muted', 'text-muted-foreground'],
      ['primary', 'bg-primary-subtle', 'text-primary-subtle-foreground'],
      ['success', 'bg-success-subtle', 'text-success-subtle-foreground'],
      ['warning', 'bg-warning-subtle', 'text-warning-subtle-foreground'],
      ['danger', 'bg-danger-subtle', 'text-danger-subtle-foreground'],
      ['info', 'bg-info-subtle', 'text-info-subtle-foreground'],
    ] as const)('%s uses its subtle pair', (variant, background, text) => {
      const root = render(() => h(Badge, { variant }, () => 'Paid'))
      const badge = getComputedStyle(root.querySelector('[data-slot="badge"]')!)
      expect(badge.backgroundColor).toBe(token(background, 'backgroundColor'))
      expect(badge.color).toBe(token(text, 'color'))
    })

    it('gives every variant its own look', () => {
      const root = render(() =>
        h(
          'div',
          variants.map((variant) => h(Badge, { variant }, () => variant)),
        ),
      )
      const looks = [...root.querySelectorAll('[data-slot="badge"]')].map(
        (badge) => getComputedStyle(badge).backgroundColor,
      )
      expect(new Set(looks).size).toBe(variants.length)
    })

    it('sm is smaller than md in text and padding', () => {
      const root = render(() =>
        h('div', [
          h(Badge, { size: 'sm' }, () => 'Draft'),
          h(Badge, { size: 'md' }, () => 'Draft'),
        ]),
      )
      const [sm, md] = [...root.querySelectorAll('[data-slot="badge"]')].map((badge) =>
        getComputedStyle(badge),
      )
      expect(parseFloat(sm!.fontSize)).toBeLessThan(parseFloat(md!.fontSize))
      expect(parseFloat(sm!.paddingInlineStart)).toBeLessThan(parseFloat(md!.paddingInlineStart))
      expect(parseFloat(sm!.paddingTop)).toBeGreaterThan(0)
    })

    it('defaults to neutral md and merges class last', () => {
      const root = render(() => h(Badge, { class: 'part-badge' }, () => 'Draft'))
      const badge = root.querySelector('[data-slot="badge"]')!
      expect(badge.classList.contains('text-sm')).toBe(true)
      expect(getComputedStyle(badge).backgroundColor).toBe(token('bg-muted', 'backgroundColor'))
      expect(badge.className.endsWith('part-badge')).toBe(true)
    })
  })

  describe('content', () => {
    it('renders its label as text, with a hidden leading icon before it', () => {
      const root = render(() =>
        h(Badge, { variant: 'warning' }, { default: () => 'Overdue', leading: () => h('svg') }),
      )
      const badge = root.querySelector('[data-slot="badge"]')!
      const leading = badge.querySelector('[data-slot="leading"]')!
      expect(leading.getAttribute('aria-hidden')).toBe('true')
      expect(badge.firstElementChild).toBe(leading)
      expect(badge.textContent).toBe('Overdue')
    })

    it('renders no leading wrapper without an icon, or when the slot renders nothing', () => {
      const root = render(() =>
        h('div', [
          h(Badge, null, () => 'Draft'),
          h(Badge, null, { default: () => 'Draft', leading: () => [createCommentVNode('v-if')] }),
        ]),
      )
      expect(root.querySelector('[data-slot="leading"]')).toBeNull()
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('badge', { mode })
      await expectNoAxeViolations()
    })
  })
})
