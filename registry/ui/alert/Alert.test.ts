import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { fluent } from '../../lib/icon/sets/fluent'
import { Alert, AlertDescription, AlertTitle } from '.'

afterEach(unmountAll)

/** A computed style of a probe element carrying the given utility classes. */
function probe(className: string, read: (style: CSSStyleDeclaration) => string) {
  const element = document.createElement('div')
  element.className = `border ${className}`
  document.body.append(element)
  const value = read(getComputedStyle(element))
  element.remove()
  return value
}

const part = (root: Element, slot: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!

const alert = (props: Record<string, unknown> = {}) =>
  render(() =>
    h(Alert, props, () => [
      h(AlertTitle, null, () => 'Payment failed'),
      h(AlertDescription, null, () => 'The card was declined.'),
    ]),
  )

const variants = [
  ['info', 'info'],
  ['success', 'check'],
  ['warning', 'warning'],
  ['danger', 'error'],
] as const

describe('Alert', () => {
  describe('variants', () => {
    it.each(variants)('%s has its subtle pair, status border and icon', (variant, icon) => {
      const root = part(alert({ variant }), 'alert')
      const style = getComputedStyle(root)
      expect(style.backgroundColor).toBe(probe(`bg-${variant}-subtle`, (s) => s.backgroundColor))
      expect(style.color).toBe(probe(`text-${variant}-subtle-foreground`, (s) => s.color))
      expect(style.borderTopColor).toBe(probe(`border-${variant}`, (s) => s.borderTopColor))
      expect(parseFloat(style.borderTopWidth)).toBeGreaterThan(0)
      const path = root.querySelector('[data-slot="alert-icon"] path')!
      expect(fluent[icon].body).toContain(path.getAttribute('d'))
    })

    it('is info by default', () => {
      const root = part(alert(), 'alert')
      expect(getComputedStyle(root).backgroundColor).toBe(
        probe('bg-info-subtle', (s) => s.backgroundColor),
      )
      const path = root.querySelector('[data-slot="alert-icon"] path')!
      expect(fluent.info.body).toContain(path.getAttribute('d'))
    })
    it.each(['neutral', 'constructor', 'toString'])(
      'falls back to info for an unknown variant (%s)',
      (variant) => {
        const root = part(alert({ variant }), 'alert')
        expect(getComputedStyle(root).backgroundColor).toBe(
          probe('bg-info-subtle', (s) => s.backgroundColor),
        )
        expect(root.getAttribute('role')).toBe('status')
        const path = root.querySelector('[data-slot="alert-icon"] path')!
        expect(fluent.info.body).toContain(path.getAttribute('d'))
      },
    )
  })

  describe('accessibility', () => {
    it.each(variants)('%s has the right live role and a hidden icon', (variant) => {
      const root = part(alert({ variant }), 'alert')
      expect(root.getAttribute('role')).toBe(variant === 'danger' ? 'alert' : 'status')
      expect(part(root, 'alert-icon').getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('parts', () => {
    it('renders the title and description beside the icon', () => {
      const root = part(alert(), 'alert')
      const title = part(root, 'alert-title')
      const description = part(root, 'alert-description')
      expect(title.textContent).toBe('Payment failed')
      expect(description.textContent).toBe('The card was declined.')
      expect(getComputedStyle(title).fontWeight).toBe('500')
      const icon = part(root, 'alert-icon').getBoundingClientRect()
      expect(title.getBoundingClientRect().left).toBeGreaterThan(icon.right)
      expect(description.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        title.getBoundingClientRect().bottom,
      )
    })
  })

  describe('parts text size', () => {
    it('follows a text size set on the alert', () => {
      const root = render(() =>
        h(Alert, { class: 'text-base' }, () => [
          h(AlertTitle, null, () => 'Title'),
          h(AlertDescription, null, () => 'Detail'),
        ]),
      )
      const base = probe('text-base', (s) => s.fontSize)
      expect(getComputedStyle(part(root, 'alert-title')).fontSize).toBe(base)
      expect(getComputedStyle(part(root, 'alert-description')).fontSize).toBe(base)
    })
  })

  describe('attributes', () => {
    it('passes attributes through each part and merges class last', () => {
      const root = render(() =>
        h(Alert, { id: 'notice', class: 'p-2' }, () => [
          h(AlertTitle, { 'data-test': 't', class: 'font-semibold' }, () => 'Title'),
          h(AlertDescription, { 'data-test': 'd', class: 'text-base' }, () => 'Detail'),
        ]),
      )
      const box = part(root, 'alert')
      expect(box.id).toBe('notice')
      expect(box.className).toMatch(/(^| )p-2( |$)/)
      expect(box.className).not.toMatch(/(^| )p-4( |$)/)
      const title = part(root, 'alert-title')
      expect(title.dataset.test).toBe('t')
      expect(title.className).toMatch(/(^| )font-semibold( |$)/)
      expect(title.className).not.toMatch(/(^| )font-medium( |$)/)
      const description = part(root, 'alert-description')
      expect(description.dataset.test).toBe('d')
      expect(description.className).toMatch(/(^| )text-base( |$)/)
      expect(description.className).not.toMatch(/(^| )text-sm( |$)/)
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('alert', { mode })
      await expectNoAxeViolations()
    })
  })
})
