import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createApp, h, nextTick, ref, type App, type VNode } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  press,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import {
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppShell } from '.'

// The shell renders the page's main, so it mounts into a div, not the harness's main.
const apps: App[] = []
function mount(view: () => VNode) {
  const root = document.createElement('div')
  document.body.append(root)
  const app = createApp({ render: view })
  app.mount(root)
  apps.push(app)
}

beforeEach(() => page.viewport(1280, 800))

afterEach(() => {
  for (const app of apps.splice(0)) app.unmount()
  unmountAll()
  window.scrollTo(0, 0)
})

type Options = { collapsed?: boolean; props?: Record<string, unknown>; rows?: number }

// The usage example from app-shell.md, with the collapsed model exposed to the test.
function renderShell({ collapsed: c = false, props = {}, rows = 3 }: Options = {}) {
  const collapsed = ref(c)
  const emitted: boolean[] = []
  mount(() =>
    h(
      AppShell,
      {
        collapsed: collapsed.value,
        'onUpdate:collapsed': (value: boolean) => {
          emitted.push(value)
          collapsed.value = value
        },
        ...props,
      },
      {
        sidebar: () => [
          h(SidebarHeader, null, () => [h('span', 'Acme'), h(SidebarTrigger)]),
          h(SidebarContent, null, () =>
            h(SidebarGroup, { heading: 'Sales' }, () => [
              h(SidebarItem, { href: '#invoices', active: true }, () => 'Invoices'),
              h(SidebarItem, { href: '#customers' }, () => 'Customers'),
            ]),
          ),
        ],
        topbar: () => h('span', { 'data-testid': 'topbar-title' }, 'Invoices'),
        default: () => [
          h('h1', 'Invoices'),
          ...Array.from({ length: rows }, (_, index) =>
            h('p', { class: 'h-control-lg' }, `Row ${index + 1}`),
          ),
        ],
      },
    ),
  )
  return { collapsed, emitted }
}

const main = () => document.querySelector<HTMLElement>('main')!
const nav = () => document.querySelector<HTMLElement>('[data-slot="sidebar"]')!
const header = () => document.querySelector<HTMLElement>('header')!
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')
const content = () => document.querySelector<HTMLElement>('[data-slot="app-shell-content"]')!
const menu = () => document.querySelector<HTMLElement>('[data-slot="app-shell-menu"]')!
const box = (element: Element) => element.getBoundingClientRect()

// The length a token resolves to at the current window size, measured.
function tokenWidth(token: string) {
  const probe = document.createElement('div')
  probe.style.width = `var(--h-${token})`
  document.body.append(probe)
  const value = box(probe).width
  probe.remove()
  return value
}

async function settle() {
  await nextTick()
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  await Promise.all(document.getAnimations().map((animation) => animation.finished))
}

async function opened() {
  await expect.poll(() => dialog()?.getAttribute('data-state')).toBe('open')
  await settle()
}

async function closed() {
  await expect.poll(() => dialog()).toBeNull()
}

describe('AppShell', () => {
  describe('regions', () => {
    it('puts each slot in its landmark, with the page in the only main', async () => {
      renderShell()
      await expect.element(page.getByRole('navigation', { name: 'Navigation' })).toBeVisible()
      expect(document.querySelectorAll('main').length).toBe(1)
      await expect
        .element(page.getByRole('main').getByRole('heading', { name: 'Invoices' }))
        .toBeVisible()
      await expect.element(page.getByRole('banner').getByTestId('topbar-title')).toBeVisible()
      await expect
        .element(page.getByRole('navigation').getByRole('link', { name: 'Invoices' }))
        .toHaveAttribute('aria-current', 'page')
    })

    it('names the navigation by navLabel', async () => {
      renderShell({ props: { navLabel: 'Main' } })
      await expect.element(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
    })

    it('caps the page at content-max, centred in a main padded by page-px', async () => {
      await page.viewport(1920, 800)
      renderShell()
      await settle()
      expect(box(content()).width).toBeCloseTo(tokenWidth('content-max'), 0)
      const inner = box(main())
      const style = getComputedStyle(main())
      const left = box(content()).left - (inner.left + parseFloat(style.paddingLeft))
      const right = inner.right - parseFloat(style.paddingRight) - box(content()).right
      expect(Math.abs(left - right)).toBeLessThan(1)
      expect(parseFloat(style.paddingInlineStart)).toBeCloseTo(tokenWidth('page-px'), 0)
    })
  })

  describe('collapse', () => {
    it('collapses the sidebar from its trigger, and main starts at the rail', async () => {
      const { emitted } = renderShell()
      await userEvent.click(page.getByRole('button', { name: 'Toggle sidebar' }))
      expect(emitted).toEqual([true])
      await expect.poll(() => nav().dataset.state).toBe('closed')
      await settle()
      expect(box(nav()).width).toBeCloseTo(tokenWidth('sidebar-width-collapsed'), 0)
      expect(box(main()).left).toBeCloseTo(box(nav()).right, 0)
    })

    it('renders collapsed when collapsed is true', async () => {
      renderShell({ collapsed: true })
      await settle()
      expect(nav().dataset.state).toBe('closed')
    })
  })

  describe('below 768 px', () => {
    beforeEach(() => page.viewport(375, 800))

    it('makes the menu button a control-md touch target that says it opens a dialog', async () => {
      renderShell()
      await settle()
      expect(box(menu()).height).toBeGreaterThanOrEqual(tokenWidth('control-md') - 0.5)
      expect(menu().getAttribute('aria-haspopup')).toBe('dialog')
      expect(menu().getAttribute('aria-expanded')).toBe('false')
      await userEvent.click(menu())
      await opened()
      expect(menu().getAttribute('aria-expanded')).toBe('true')
    })

    it('returns focus to the menu button when the click never focused it', async () => {
      renderShell()
      await settle()
      // Safari leaves focus on the page when a button is clicked.
      menu().addEventListener('click', () => menu().blur(), { capture: true })
      await userEvent.click(menu())
      await opened()
      await press('Escape')
      await closed()
      await expect.poll(() => document.activeElement).toBe(menu())
    })

    it('hides the sidebar and opens it as a drawer from the menu button', async () => {
      renderShell()
      await settle()
      expect(getComputedStyle(nav()).display).toBe('none')
      const button = page.getByRole('banner').getByRole('button', { name: 'Menu' })
      await expect.element(button).toBeVisible()
      // The menu button leads the topbar, before its slot.
      expect(header().firstElementChild).toBe(menu())
      await userEvent.click(button)
      await opened()
      const drawer = page.getByRole('dialog', { name: 'Navigation' })
      await expect.element(drawer.getByRole('link', { name: 'Customers' })).toBeVisible()
      await userEvent.click(drawer.getByRole('link', { name: 'Customers' }))
      await closed()
    })

    it('names the menu button by menuLabel and the close button by closeLabel', async () => {
      renderShell({ props: { menuLabel: 'Navigate', closeLabel: 'Close menu' } })
      await userEvent.click(page.getByRole('button', { name: 'Navigate' }))
      await opened()
      await userEvent.click(page.getByRole('button', { name: 'Close menu' }))
      await closed()
    })

    it('returns focus to the menu button when Escape closes the drawer', async () => {
      renderShell()
      await userEvent.click(page.getByRole('button', { name: 'Menu' }))
      await opened()
      await press('Escape')
      await closed()
      await expect.poll(() => document.activeElement).toBe(menu())
    })

    it('shows no menu button from 768 px', async () => {
      await page.viewport(768, 800)
      renderShell()
      await settle()
      expect(getComputedStyle(menu()).display).toBe('none')
      expect(getComputedStyle(nav()).display).not.toBe('none')
    })
  })

  describe('long content', () => {
    it('keeps the sidebar and topbar at the top while the page scrolls', async () => {
      await page.viewport(1280, 600)
      renderShell({ rows: 60 })
      await settle()
      window.scrollTo(0, document.documentElement.scrollHeight)
      await settle()
      expect(window.scrollY).toBeGreaterThan(0)
      expect(box(nav()).top).toBeCloseTo(0, 0)
      expect(box(nav()).height).toBeCloseTo(window.innerHeight, 0)
      expect(box(header()).top).toBeCloseTo(0, 0)
      expect(box(header()).height).toBeCloseTo(tokenWidth('topbar-height'), 0)
    })

    it('never hides a link target or a focused element under the topbar', async () => {
      await page.viewport(1280, 600)
      renderShell({ rows: 60 })
      await settle()
      window.scrollTo(0, document.documentElement.scrollHeight)
      await settle()
      // An in-page link (#row-21) aligns its target to the top of the scroller.
      const target = [...main().querySelectorAll('p')][20]!
      target.scrollIntoView({ block: 'start' })
      await settle()
      expect(box(target).top).toBeGreaterThanOrEqual(box(header()).bottom - 0.5)
    })

    it('never scrolls sideways at 375 px', async () => {
      await page.viewport(375, 800)
      renderShell({ rows: 60 })
      await settle()
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)
    })
  })

  describe('axe', () => {
    const states = ['default', 'long'] as const

    it.each(['light', 'dark'] as const)(
      'reports no violations in each %s demo state, with one main',
      async (mode) => {
        for (const state of states) {
          await mountDemo('app-shell', { mode, state })
          await settle()
          expect(document.querySelectorAll('main').length).toBe(1)
          await expectNoAxeViolations()
          unmountAll()
        }
      },
    )

    it('reports no violations at 375 px with the drawer open', async () => {
      await page.viewport(375, 800)
      await mountDemo('app-shell')
      await settle()
      await expectNoAxeViolations()
      await userEvent.click(page.getByRole('button', { name: 'Menu' }))
      await opened()
      await expectNoAxeViolations()
    })
  })
})
