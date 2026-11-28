import { afterEach, describe, expect, it } from 'vitest'
import { createCommentVNode, h, type VNode } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { EmptyState } from '.'

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

const part = (root: Element, slot: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${slot}"]`)

const emptyState = (
  props: Record<string, unknown> = {},
  slots: Record<string, () => unknown> = {},
) =>
  part(
    render(() => h(EmptyState, { title: 'No invoices yet', ...props }, slots)),
    'empty-state',
  )!

describe('EmptyState', () => {
  describe('text', () => {
    it('renders the title and the description below it', () => {
      const root = emptyState({ description: 'Invoices you send show up here.' })
      const title = part(root, 'empty-state-title')!
      const description = part(root, 'empty-state-description')!
      expect(title.textContent).toBe('No invoices yet')
      expect(getComputedStyle(title).fontWeight).toBe('600')
      expect(getComputedStyle(title).color).toBe(probe('text-foreground', (s) => s.color))
      expect(description.textContent).toBe('Invoices you send show up here.')
      expect(getComputedStyle(description).color).toBe(
        probe('text-muted-foreground', (s) => s.color),
      )
      expect(description.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        title.getBoundingClientRect().bottom,
      )
    })

    it('renders no description element without a description', () => {
      const root = emptyState()
      expect(part(root, 'empty-state-description')).toBeNull()
    })
  })

  describe('icon', () => {
    it('renders the slot above the title in a hidden wrapper', () => {
      const root = emptyState({}, { icon: () => h('svg', { 'data-test': 'glyph' }) })
      const wrapper = part(root, 'empty-state-icon')!
      expect(wrapper.getAttribute('aria-hidden')).toBe('true')
      expect(wrapper.querySelector('[data-test="glyph"]')).not.toBeNull()
      const title = part(root, 'empty-state-title')!
      expect(title.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        wrapper.getBoundingClientRect().bottom,
      )
    })

    it('renders no wrapper without the slot', () => {
      expect(part(emptyState(), 'empty-state-icon')).toBeNull()
    })

    it('renders no wrapper when the slot renders nothing', () => {
      const root = emptyState({}, { icon: () => [createCommentVNode('v-if')] })
      expect(part(root, 'empty-state-icon')).toBeNull()
    })

    it('renders no wrapper when the slot holds only empty text', () => {
      const root = emptyState({}, { icon: () => [''] })
      expect(part(root, 'empty-state-icon')).toBeNull()
    })
  })

  describe('actions', () => {
    it('renders the slot below the description, children in a row', () => {
      const root = emptyState(
        { description: 'Invoices you send show up here.' },
        {
          actions: () => [
            h('button', { type: 'button', 'data-test': 'a' }, 'Create'),
            h('button', { type: 'button', 'data-test': 'b' }, 'Import'),
          ],
        },
      )
      const wrapper = part(root, 'empty-state-actions')!
      const description = part(root, 'empty-state-description')!
      expect(wrapper.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        description.getBoundingClientRect().bottom,
      )
      const [a, b] = [...wrapper.querySelectorAll('button')].map((el) => el.getBoundingClientRect())
      expect(a!.top).toBe(b!.top)
      expect(b!.left).toBeGreaterThan(a!.right)
    })

    it('renders no wrapper without the slot', () => {
      expect(part(emptyState(), 'empty-state-actions')).toBeNull()
    })

    it('renders no wrapper when the slot renders nothing', () => {
      const root = emptyState({}, { actions: () => [createCommentVNode('v-if')] })
      expect(part(root, 'empty-state-actions')).toBeNull()
    })

    it('renders no wrapper when the slot holds only empty text', () => {
      const root = emptyState({}, { actions: () => [''] })
      expect(part(root, 'empty-state-actions')).toBeNull()
    })
  })

  describe('layout', () => {
    it('centres its content in a column no wider than content-narrow', () => {
      const host = render(() =>
        h('div', { class: 'w-content-max' }, [
          h(EmptyState, { title: 'No invoices yet', description: 'A '.repeat(200) }),
        ]),
      )
      const root = part(host, 'empty-state')!
      const style = getComputedStyle(root)
      expect(style.flexDirection).toBe('column')
      expect(style.alignItems).toBe('center')
      expect(style.textAlign).toBe('center')
      const description = part(root, 'empty-state-description')!
      const narrow = parseFloat(probe('w-content-narrow', (s) => s.width))
      expect(narrow).toBeGreaterThan(0)
      expect(description.getBoundingClientRect().width).toBeLessThanOrEqual(narrow)
      const box = root.getBoundingClientRect()
      const text = description.getBoundingClientRect()
      expect(Math.abs(text.left - box.left - (box.right - text.right))).toBeLessThan(1)
    })

    it.each([
      [
        'a table cell',
        (child: VNode) =>
          h('table', { class: 'w-48' }, [h('tbody', [h('tr', [h('td', [child])])])]),
      ],
      ['a grid', (child: VNode) => h('div', { class: 'grid w-48' }, [child])],
      ['a flex row', (child: VNode) => h('div', { class: 'flex w-48' }, [child])],
    ] as const)('wraps an unbroken word inside %s', (_, host) => {
      const word = 'x'.repeat(120)
      const outer = render(() => host(h(EmptyState, { title: word, description: word })))
      const frame = outer.firstElementChild!.getBoundingClientRect()
      const limit = parseFloat(probe('w-48', (style) => style.width))
      const root = part(outer, 'empty-state')!
      expect(frame.width).toBeLessThanOrEqual(limit)
      expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(limit)
      for (const slot of ['empty-state-title', 'empty-state-description']) {
        const text = part(root, slot)!.getBoundingClientRect()
        expect(text.right).toBeLessThanOrEqual(frame.left + limit)
      }
    })

    it('wraps an unbroken word inside a narrow region', () => {
      const word = 'x'.repeat(120)
      const host = render(() =>
        h('div', { class: 'w-48' }, [h(EmptyState, { title: word, description: word })]),
      )
      const root = part(host, 'empty-state')!
      const box = root.getBoundingClientRect()
      for (const slot of ['empty-state-title', 'empty-state-description']) {
        const text = part(root, slot)!.getBoundingClientRect()
        expect(text.left).toBeGreaterThanOrEqual(box.left)
        expect(text.right).toBeLessThanOrEqual(box.right)
      }
    })
  })

  describe('attributes', () => {
    it('passes attributes through and merges class last', () => {
      const root = emptyState({ id: 'none', 'data-test': 'x', class: 'p-2' })
      expect(root.id).toBe('none')
      expect(root.dataset.test).toBe('x')
      expect(root.className).toMatch(/(^| )p-2( |$)/)
      expect(root.className).not.toMatch(/(^| )p-6( |$)/)
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('empty-state', { mode })
      await expectNoAxeViolations()
    })
  })
})
