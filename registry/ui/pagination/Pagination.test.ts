import { ConfigProvider } from 'reka-ui'
import { afterEach, describe, expect, it } from 'vitest'
import { page as screen } from 'vitest/browser'
import { h, nextTick, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  press,
  render,
  tab,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { fluent } from '../../lib/icon'
import { Pagination } from '.'

afterEach(unmountAll)

const draws = (element: Element | null, name: keyof typeof fluent) =>
  element?.querySelector('svg path')?.getAttribute('d') ===
  /d="([^"]+)"/.exec(fluent[name].body)![1]

/** Renders a pagination bound to a ref, and records each `update:page`. */
function paged(props: Record<string, unknown> = {}, start = 1) {
  const current = ref(start)
  const emitted: number[] = []
  render(() =>
    h(Pagination, {
      total: 200,
      pageSize: 10,
      ...props,
      page: current.value,
      'onUpdate:page': (value: number) => {
        emitted.push(value)
        current.value = value
      },
    }),
  )
  return { current, emitted }
}

/** The visible row, as page numbers and `…` for gaps. */
const row = () =>
  [...document.querySelectorAll('nav li')]
    .map((item) => item.textContent!.trim())
    .filter((text) => text !== '')

const button = (name: string) => screen.getByRole('button', { name, exact: true })

describe('Pagination', () => {
  describe('structure', () => {
    it('is a nav named Pagination holding a list of items', async () => {
      paged()
      const nav = screen.getByRole('navigation', { name: 'Pagination' })
      await expect.element(nav).toBeInTheDocument()
      const list = nav.element().querySelector('ul')!
      expect(list.parentElement).toBe(nav.element())
      expect([...list.children].every((child) => child.tagName === 'LI')).toBe(true)
    })

    it('takes its name from navLabel', async () => {
      paged({ navLabel: 'Results pages' })
      await expect
        .element(screen.getByRole('navigation', { name: 'Results pages' }))
        .toBeInTheDocument()
    })

    it('marks the current page and names page buttons by pageLabel', async () => {
      paged({}, 3)
      await expect.element(button('Page 3')).toHaveAttribute('aria-current', 'page')
      expect(document.querySelectorAll('[aria-current]')).toHaveLength(1)
      unmountAll()
      paged({ pageLabel: 'Seite {page}' }, 3)
      await expect.element(button('Seite 3')).toHaveAttribute('aria-current', 'page')
      await expect.element(button('Seite 4')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Page / }).query()).toBeNull()
    })

    it('replaces every {page} in pageLabel', async () => {
      paged({ pageLabel: 'Page {page} (go to {page})' }, 3)
      await expect.element(button('Page 3 (go to 3)')).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('range', () => {
    it.each([
      [1, ['1', '2', '3', '4', '5', '…', '20']],
      [10, ['1', '…', '9', '10', '11', '…', '20']],
      [20, ['1', '…', '16', '17', '18', '19', '20']],
    ] as const)('shows the pages around page %i of 20', (start, expected) => {
      paged({}, start)
      expect(row()).toEqual(expected)
    })

    it.each([5, 0])('shows only page 1 when total is %i', (total) => {
      paged({ total })
      expect(row()).toEqual(['1'])
    })

    it('hides gaps from screen readers', () => {
      paged({}, 10)
      const gaps = [...document.querySelectorAll('nav li')].filter(
        (item) => item.textContent!.trim() === '…',
      )
      expect(gaps).toHaveLength(2)
      for (const gap of gaps) expect(gap.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('events', () => {
    /** Renders with reactive total and page, recording each `update:page`. */
    function live(total: number, start: number) {
      const state = { total: ref(total), page: ref(start), emitted: [] as number[] }
      render(() =>
        h(Pagination, {
          total: state.total.value,
          page: state.page.value,
          'onUpdate:page': (value: number) => {
            state.emitted.push(value)
            state.page.value = value
          },
        }),
      )
      return state
    }

    it('shows the last page when total shrinks below the page, and steps from there', async () => {
      const state = live(300, 30)
      state.total.value = 50
      await nextTick()
      await expect.element(button('Page 5')).toHaveAttribute('aria-current', 'page')
      await expect.element(button('Next page')).toHaveAttribute('aria-disabled', 'true')
      expect(state.emitted).toEqual([])
      await button('Previous page').click()
      expect(state.emitted).toEqual([4])
    })

    it('keeps a deep-linked page while total is still 0', async () => {
      const state = live(0, 5)
      await nextTick()
      expect(row()).toEqual(['1'])
      state.total.value = 200
      await expect.element(button('Page 5')).toHaveAttribute('aria-current', 'page')
      expect(state.emitted).toEqual([])
    })

    it.each([
      [0, 1],
      [-3, 1],
      [99, 20],
      [2.4, 2],
      [Number.NaN, 1],
    ])('shows a page of %s as %i without emitting', async (start, shown) => {
      const { emitted } = paged({}, start)
      await nextTick()
      await expect.element(button(`Page ${shown}`)).toHaveAttribute('aria-current', 'page')
      expect(emitted).toEqual([])
    })

    it('treats a total that is not a number as one page', async () => {
      const { emitted } = paged({ total: Number.NaN }, 3)
      await nextTick()
      expect(row()).toEqual(['1'])
      await expect.element(button('Page 1')).toHaveAttribute('aria-current', 'page')
      await button('Next page').click({ force: true })
      expect(emitted).toEqual([])
    })

    it('emits the page pressed and moves aria-current', async () => {
      const { emitted } = paged()
      await button('Page 4').click()
      await button('Next page').click()
      await button('Previous page').click()
      expect(emitted).toEqual([4, 5, 4])
      await expect.element(button('Page 4')).toHaveAttribute('aria-current', 'page')
    })

    it('works without v-model', async () => {
      render(() => h(Pagination, { total: 50 }))
      await button('Next page').click()
      await expect.element(button('Page 2')).toHaveAttribute('aria-current', 'page')
    })

    it.each([
      ['Previous page', 1],
      ['Next page', 20],
    ] as const)('leaves %s unavailable at the end, emitting nothing', async (name, start) => {
      const { emitted } = paged({}, start)
      const edge = button(name)
      await expect.element(edge).toHaveAttribute('aria-disabled', 'true')
      expect(edge.element().hasAttribute('disabled')).toBe(false)
      await edge.click({ force: true })
      expect(emitted).toEqual([])
      ;(edge.element() as HTMLElement).focus()
      expect(document.activeElement).toBe(edge.element())
    })

    it('makes both buttons available on a middle page', async () => {
      paged({}, 10)
      for (const name of ['Previous page', 'Next page'])
        expect(button(name).element().getAttribute('aria-disabled')).not.toBe('true')
    })
  })

  describe('keyboard', () => {
    it('tabs through previous, each page and next', async () => {
      paged({}, 10)
      const order: string[] = []
      for (let step = 0; step < 7; step++) {
        await tab()
        order.push(document.activeElement!.getAttribute('aria-label')!)
      }
      expect(order).toEqual([
        'Previous page',
        'Page 1',
        'Page 9',
        'Page 10',
        'Page 11',
        'Page 20',
        'Next page',
      ])
    })

    it('goes to a page on Enter and Space', async () => {
      const { emitted } = paged()
      ;(button('Page 3').element() as HTMLElement).focus()
      await press('Enter')
      ;(button('Page 4').element() as HTMLElement).focus()
      await press(' ')
      expect(emitted).toEqual([3, 4])
    })

    it('keeps focus on next when it reaches the last page', async () => {
      const { current } = paged({ total: 30 })
      const next = button('Next page').element() as HTMLElement
      next.focus()
      await press('Enter')
      await press('Enter')
      await nextTick()
      expect(current.value).toBe(3)
      expect(document.activeElement).toBe(next)
      expect(next.getAttribute('aria-disabled')).toBe('true')
      await press('Enter')
      expect(current.value).toBe(3)
    })
  })

  describe('previous and next', () => {
    it('names them by previousLabel and nextLabel', async () => {
      paged({ previousLabel: 'Zurück', nextLabel: 'Weiter' }, 5)
      await expect.element(button('Zurück')).toBeInTheDocument()
      await expect.element(button('Weiter')).toBeInTheDocument()
    })

    it.each([
      ['ltr', 'chevron-left', 'chevron-right'],
      ['rtl', 'chevron-right', 'chevron-left'],
    ] as const)('points the chevrons the reading way (%s)', (dir, previous, next) => {
      render(() => h(ConfigProvider, { dir }, () => h(Pagination, { total: 50, page: 2 })))
      expect(draws(button('Previous page').element(), previous)).toBe(true)
      expect(draws(button('Next page').element(), next)).toBe(true)
    })
  })

  describe('styles', () => {
    it('styles pages as buttons from tokens and merges class last', () => {
      paged({ class: 'part-root justify-center' }, 3)
      const nav = document.querySelector('nav')!
      expect(nav.className.endsWith('part-root justify-center')).toBe(true)
      const current = button('Page 3').element()
      const other = button('Page 4').element()
      expect(current.className).toContain('border-border-control')
      expect(other.className).toContain('bg-transparent')
      expect(other.className).not.toContain('border-border-control')
      for (const element of [current, other, button('Next page').element()]) {
        expect(element.className).toContain('h-control-md')
        expect(element.className).toContain('focus-visible:ring')
      }
    })

    it('fits page 5000 of 10000 inside 375 px', async () => {
      await screen.viewport(375, 800)
      try {
        render(() =>
          h('div', { class: 'p-4' }, [h(Pagination, { total: 100000, pageSize: 10, page: 5000 })]),
        )
        const list = document.querySelector('nav ul')!
        expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth)
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(375)
        for (const item of list.querySelectorAll('button'))
          expect(item.getBoundingClientRect().right).toBeLessThanOrEqual(375)
      } finally {
        await screen.viewport(1024, 800)
      }
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('pagination', { mode })
      await expectNoAxeViolations()
    })

    it('reports no violations at 375 px', async () => {
      await screen.viewport(375, 800)
      try {
        await mountDemo('pagination')
        await expectNoAxeViolations()
      } finally {
        await screen.viewport(1024, 800)
      }
    })
  })
})
