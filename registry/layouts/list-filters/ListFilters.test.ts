import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { createApp, h, nextTick, type App, type VNode } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { ListFilters } from '.'

const apps: App[] = []
function mount(view: () => VNode) {
  const root = document.createElement('main')
  document.body.append(root)
  const app = createApp({ render: view })
  app.mount(root)
  apps.push(app)
}

beforeEach(() => page.viewport(1280, 800))

afterEach(() => {
  for (const app of apps.splice(0)) app.unmount()
  unmountAll()
  document.documentElement.removeAttribute('dir')
})

const regions = ['header', 'filters', 'data', 'pagination'] as const
type Region = (typeof regions)[number]

function renderList({
  props = {},
  only = regions,
}: { props?: Record<string, unknown>; only?: readonly Region[] } = {}) {
  const slots = Object.fromEntries(
    only.map((name) => [
      name,
      () => h('div', { 'data-testid': name, class: 'h-control-md w-24' }, name),
    ]),
  )
  mount(() => h(ListFilters, props, slots))
}

const region = (name: Region) =>
  document.querySelector<HTMLElement>(`[data-slot="list-filters-${name}"]`)
const box = (element: Element) => element.getBoundingClientRect()

function tokenHeight(token: string) {
  const probe = document.createElement('div')
  probe.style.height = `var(--h-${token})`
  document.body.append(probe)
  const value = box(probe).height
  probe.remove()
  return value
}

async function settle() {
  await nextTick()
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
}

describe('ListFilters', () => {
  describe('regions', () => {
    it('renders header, filters, data and pagination in that order', async () => {
      renderList()
      await expect.element(page.getByTestId('pagination')).toBeVisible()
      const tops = regions.map((name) => box(region(name)!).top)
      expect([...tops].sort((a, b) => a - b)).toEqual(tops)
      for (const name of regions) {
        expect(region(name)!.contains(page.getByTestId(name).element())).toBe(true)
      }
    })

    it('puts the filters gap-md above the data, and the header section-gap above them', async () => {
      renderList()
      await settle()
      const gap = (above: Region, below: Region) =>
        box(region(below)!).top - box(region(above)!).bottom
      expect(gap('filters', 'data')).toBeCloseTo(tokenHeight('gap-md'), 0)
      expect(gap('data', 'pagination')).toBeCloseTo(tokenHeight('gap-md'), 0)
      expect(gap('header', 'filters')).toBeCloseTo(tokenHeight('section-gap'), 0)
    })

    it('renders no element for a region without content', async () => {
      renderList({ only: ['header', 'data'] })
      await expect.element(page.getByTestId('data')).toBeVisible()
      expect(region('filters')).toBeNull()
      expect(region('pagination')).toBeNull()
    })

    it('adds no space below a header that stands alone', async () => {
      renderList({ only: ['header'] })
      await expect.element(page.getByTestId('header')).toBeVisible()
      expect(region('header')!.parentElement!.children).toHaveLength(1)
    })
  })

  describe('demo search', () => {
    const search = () => page.getByRole('searchbox', { name: 'Search customers' })

    it('shows the matching rows after a search from a later page', async () => {
      await mountDemo('list-filters')
      await page.getByRole('button', { name: 'Page 4' }).click()
      await search().fill('ada')
      await expect.element(page.getByRole('rowheader', { name: 'Ada Lovelace' })).toBeVisible()
    })

    it('shows a no-results state, not an empty table, when nothing matches', async () => {
      await mountDemo('list-filters')
      await search().fill('zzz')
      await expect.element(page.getByRole('button', { name: 'Clear search' })).toBeVisible()
      expect(document.querySelector('table')).toBeNull()
      await page.getByRole('button', { name: 'Clear search' }).click()
      await expect.element(page.getByRole('rowheader', { name: 'Ada Lovelace' })).toBeVisible()
      expect(search().element()).toHaveValue('')
    })
  })

  describe('pagination', () => {
    it('sits on the trailing edge of the data, in either direction', async () => {
      renderList()
      await settle()
      const pager = () => box(page.getByTestId('pagination').element())
      expect(pager().right).toBeCloseTo(box(region('data')!).right, 0)
      document.documentElement.dir = 'rtl'
      await settle()
      expect(pager().left).toBeCloseTo(box(region('data')!).left, 0)
    })
  })

  describe('loading', () => {
    it('marks the data region busy only while loading', async () => {
      renderList({ props: { loading: true } })
      await expect.element(page.getByTestId('data')).toBeVisible()
      expect(region('data')!.getAttribute('aria-busy')).toBe('true')
      for (const app of apps.splice(0)) app.unmount()
      unmountAll()
      renderList()
      await expect.element(page.getByTestId('data')).toBeVisible()
      expect(region('data')!.hasAttribute('aria-busy')).toBe(false)
    })
  })

  describe('responsive', () => {
    it.each(['default', 'empty', 'loading', 'error', 'long'])(
      'never scrolls sideways at 375 px in the %s state',
      async (state) => {
        await page.viewport(375, 800)
        await mountDemo('list-filters', { state })
        await settle()
        expect(document.querySelector('[data-slot="list-filters-data"]')).not.toBeNull()
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)
      },
    )
  })

  describe('axe', () => {
    const states = ['default', 'empty', 'loading', 'error', 'long'] as const

    it.each(['light', 'dark'] as const)(
      'reports no violations in each %s demo state',
      async (mode) => {
        for (const state of states) {
          await mountDemo('list-filters', { mode, state })
          await settle()
          await expectNoAxeViolations()
          unmountAll()
        }
      },
    )

    it.each(states)('reports no violations at 375 px in the %s state', async (state) => {
      await page.viewport(375, 800)
      await mountDemo('list-filters', { state })
      await settle()
      await expectNoAxeViolations()
    })
  })
})
