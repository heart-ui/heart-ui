import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h, nextTick, ref, type VNodeChild } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  press,
  render,
  tab,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { CollapsibleRoot } from 'reka-ui'
import { Icon } from '@/lib/icon'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarTrigger,
} from '.'

beforeEach(() => page.viewport(1024, 800))

afterEach(() => {
  unmountAll()
  document.documentElement.removeAttribute('dir')
})

type Options = {
  collapsed?: boolean
  open?: boolean
  props?: Record<string, unknown>
  trigger?: Record<string, unknown>
  items?: () => VNodeChild
}

const item = (label: string, props: Record<string, unknown> = {}) =>
  h(
    SidebarItem,
    { href: `#${label.toLowerCase()}`, ...props },
    { leading: () => h(Icon, { name: 'info', class: 'size-4' }), default: () => label },
  )

// The usage example from sidebar.md, with both models exposed to the test.
function renderSidebar({
  collapsed: c = false,
  open: o = false,
  props = {},
  trigger = {},
  items,
}: Options = {}) {
  const collapsed = ref(c)
  const open = ref(o)
  const emitted = { collapsed: [] as boolean[], open: [] as boolean[] }
  render(() =>
    h(
      Sidebar,
      {
        collapsed: collapsed.value,
        'onUpdate:collapsed': (value: boolean) => {
          emitted.collapsed.push(value)
          collapsed.value = value
        },
        open: open.value,
        'onUpdate:open': (value: boolean) => {
          emitted.open.push(value)
          open.value = value
        },
        ...props,
      },
      () => [
        h(SidebarHeader, null, () => [h('span', 'Acme'), h(SidebarTrigger, trigger)]),
        h(SidebarContent, null, () =>
          items
            ? items()
            : [
                h(SidebarGroup, { heading: 'Sales' }, () => [
                  item('Invoices', { active: true }),
                  item('Customers'),
                ]),
                h(SidebarGroup, null, () => [item('Settings')]),
              ],
        ),
        h(SidebarFooter, null, () => 'Signed in as Ada'),
      ],
    ),
  )
  return { collapsed, open, emitted }
}

const nav = () => document.querySelector<HTMLElement>('[data-slot="sidebar"]')!
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')
const trigger = () => nav().querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')!
const width = (element: Element) => element.getBoundingClientRect().width

// The width a token resolves to, measured, so no length is written here.
function tokenWidth(token: string) {
  const probe = document.createElement('div')
  probe.style.width = `var(--h-${token})`
  document.body.append(probe)
  const value = width(probe)
  probe.remove()
  return value
}

async function settle() {
  await nextTick()
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
}

async function opened() {
  await expect.poll(() => dialog()?.getAttribute('data-state')).toBe('open')
  // The panel slides in from its edge; measure it where it ends.
  await Promise.all(
    dialog()!
      .getAnimations()
      .map((animation) => animation.finished),
  )
  await settle()
}

async function closed() {
  await expect.poll(() => dialog()).toBeNull()
}

describe('Sidebar', () => {
  describe('structure', () => {
    it('is a navigation landmark named Navigation by default, or by navLabel', async () => {
      renderSidebar()
      await expect.element(page.getByRole('navigation', { name: 'Navigation' })).toBeVisible()
      unmountAll()
      renderSidebar({ props: { navLabel: 'Main' } })
      await expect.element(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
    })

    it('names a group by its heading, and lists its items', async () => {
      renderSidebar()
      const group = page.getByRole('group', { name: 'Sales' })
      await expect.element(group).toBeVisible()
      expect(group.element().querySelectorAll('li').length).toBe(2)
      expect(group.element().querySelector('ul, [role="list"]')).not.toBeNull()
    })

    it('links each item to its href, marking only the active one as the current page', async () => {
      renderSidebar()
      const invoices = page.getByRole('link', { name: 'Invoices' })
      await expect.element(invoices).toHaveAttribute('href', '#invoices')
      await expect.element(invoices).toHaveAttribute('aria-current', 'page')
      await expect
        .element(page.getByRole('link', { name: 'Customers' }))
        .not.toHaveAttribute('aria-current')
    })

    it('keeps an asChild child’s own href, and renders a button for as="button"', async () => {
      renderSidebar({
        items: () =>
          h(SidebarGroup, null, () => [
            h(SidebarItem, { asChild: true }, () => h('a', { href: '#reports' }, 'Reports')),
            h(SidebarItem, { as: 'button', type: 'button' }, () => 'New invoice'),
          ]),
      })
      const reports = page.getByRole('link', { name: 'Reports' })
      await expect.element(reports).toHaveAttribute('href', '#reports')
      expect(reports.element().parentElement!.tagName).toBe('LI')
      await expect.element(page.getByRole('button', { name: 'New invoice' })).toBeVisible()
    })

    it('renders a button for an item with neither href nor as', async () => {
      renderSidebar({
        items: () => h(SidebarGroup, null, () => [h(SidebarItem, null, () => 'Log out')]),
      })
      await expect
        .element(page.getByRole('button', { name: 'Log out' }))
        .toHaveAttribute('type', 'button')
    })

    it('keeps the trigger controlling the nav when the caller changes its id', async () => {
      const id = ref('nav-a')
      render(() =>
        h(Sidebar, { id: id.value }, () => h(SidebarHeader, null, () => h(SidebarTrigger))),
      )
      await expect
        .element(page.getByRole('button', { name: 'Toggle sidebar' }))
        .toHaveAttribute('aria-controls', 'nav-a')
      expect(nav().id).toBe('nav-a')
      id.value = 'nav-b'
      await expect.poll(() => trigger().getAttribute('aria-controls')).toBe('nav-b')
      expect(nav().id).toBe('nav-b')
    })

    it('puts an item’s attributes on its link, button or asChild child, not its list item', async () => {
      renderSidebar({
        items: () =>
          h(SidebarGroup, null, () => [
            h(
              SidebarItem,
              { href: '#docs', target: '_blank', 'data-testid': 'docs' },
              () => 'Docs',
            ),
            h(SidebarItem, { 'aria-describedby': 'hint' }, () => 'Log out'),
            h(SidebarItem, { asChild: true, rel: 'next' }, () => h('a', { href: '#next' }, 'Next')),
          ]),
      })
      const docs = page.getByRole('link', { name: 'Docs' })
      await expect.element(docs).toHaveAttribute('target', '_blank')
      await expect.element(docs).toHaveAttribute('data-testid', 'docs')
      await expect
        .element(page.getByRole('button', { name: 'Log out' }))
        .toHaveAttribute('aria-describedby', 'hint')
      await expect.element(page.getByRole('link', { name: 'Next' })).toHaveAttribute('rel', 'next')
      for (const li of nav().querySelectorAll('li')) {
        expect(li.getAttributeNames().sort()).toEqual(['class'])
      }
    })

    it('toggles the sidebar from a trigger inside a nested collapsible', async () => {
      const { emitted } = renderSidebar({
        items: () => h(CollapsibleRoot, { defaultOpen: true }, () => h(SidebarTrigger)),
      })
      await userEvent.click(page.getByRole('button', { name: 'Toggle sidebar' }).nth(1))
      expect(emitted.collapsed).toEqual([true])
      await expect.poll(() => nav().dataset.state).toBe('closed')
    })

    it('keeps the trigger controlling the nav after an id change with compiled slots', async () => {
      const id = ref('nav-a')
      // `_: 1` marks the slots stable, as a compiled template does, so Vue doesn't force the
      // children to update when only the Sidebar's attributes change.
      const header = { default: () => [h(SidebarTrigger)], _: 1 }
      const slots = { default: () => [h(SidebarHeader, null, header)], _: 1 }
      render(() => h(Sidebar, { id: id.value }, slots as never))
      await expect
        .element(page.getByRole('button', { name: 'Toggle sidebar' }))
        .toHaveAttribute('aria-controls', 'nav-a')
      id.value = 'nav-b'
      await expect.poll(() => nav().id).toBe('nav-b')
      await expect.poll(() => trigger().getAttribute('aria-controls')).toBe('nav-b')
    })

    it('keeps aria-controls on the nav’s id when the caller passes an empty id', async () => {
      renderSidebar({ props: { id: '' } })
      await expect.element(page.getByRole('navigation')).toBeVisible()
      expect(nav().id).not.toBe('')
      expect(trigger().getAttribute('aria-controls')).toBe(nav().id)
    })

    it('merges class last, so a display class applies from 768 px', async () => {
      renderSidebar({ props: { class: 'md:grid' } })
      await expect.element(page.getByRole('navigation')).toBeVisible()
      expect(getComputedStyle(nav()).display).toBe('grid')
    })

    it('never puts an href on an item rendered as a button', async () => {
      renderSidebar({
        items: () =>
          h(SidebarGroup, null, () => [
            h(SidebarItem, { as: 'button', href: '#x' }, () => 'Export'),
          ]),
      })
      await expect.element(page.getByRole('button', { name: 'Export' })).not.toHaveAttribute('href')
    })

    it('puts class and attributes on the nav', async () => {
      renderSidebar({ props: { class: 'shadow-lg', 'data-testid': 'main-nav' } })
      await expect.element(page.getByRole('navigation')).toBeVisible()
      expect(nav().classList).toContain('shadow-lg')
      expect(nav().dataset.testid).toBe('main-nav')
    })
  })

  describe('collapse', () => {
    it('is sidebar-width wide, with a trigger that is expanded and controls the nav', async () => {
      renderSidebar()
      await expect.element(page.getByRole('navigation')).toBeVisible()
      expect(width(nav())).toBeCloseTo(tokenWidth('sidebar-width'), 0)
      const button = page.getByRole('button', { name: 'Toggle sidebar' })
      await expect.element(button).toHaveAttribute('aria-expanded', 'true')
      expect(nav().id).not.toBe('')
      await expect.element(button).toHaveAttribute('aria-controls', nav().id)
    })

    it('collapses on a click, narrowing the nav and emitting update:collapsed', async () => {
      const { emitted } = renderSidebar()
      await userEvent.click(page.getByRole('button', { name: 'Toggle sidebar' }))
      expect(emitted.collapsed).toEqual([true])
      await expect.poll(() => nav().dataset.state).toBe('closed')
      await settle()
      await expect.poll(() => width(nav())).toBeCloseTo(tokenWidth('sidebar-width-collapsed'), 0)
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
    })

    it('toggles from the keyboard with Enter and Space', async () => {
      const { emitted } = renderSidebar()
      await expect.element(page.getByRole('navigation')).toBeVisible()
      trigger().focus()
      await press('Enter')
      await press(' ')
      expect(emitted.collapsed).toEqual([true, false])
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
    })

    it('renders collapsed when collapsed is true, and names the trigger by toggleLabel', async () => {
      renderSidebar({ collapsed: true, trigger: { toggleLabel: 'Collapse menu' } })
      const button = page.getByRole('button', { name: 'Collapse menu' })
      await expect.element(button).toHaveAttribute('aria-expanded', 'false')
      await settle()
      expect(width(nav())).toBeCloseTo(tokenWidth('sidebar-width-collapsed'), 0)
    })
  })

  describe('collapsed state', () => {
    it('hides item text and headings visually, keeping names and icons', async () => {
      renderSidebar({ collapsed: true })
      await settle()
      const invoices = page.getByRole('link', { name: 'Invoices' })
      await expect.element(invoices).toBeInTheDocument()
      await expect.element(page.getByRole('group', { name: 'Sales' })).toBeInTheDocument()
      const text = invoices.element().querySelector<HTMLElement>('[data-slot="sidebar-item-text"]')!
      expect(width(text)).toBeLessThanOrEqual(1)
      const heading = nav().querySelector<HTMLElement>('[data-slot="sidebar-group-heading"]')!
      expect(width(heading)).toBeLessThanOrEqual(1)
      const icon = invoices.element().querySelector('svg')!.getBoundingClientRect()
      const box = nav().getBoundingClientRect()
      expect(icon.width).toBeGreaterThan(0)
      expect(icon.left).toBeGreaterThanOrEqual(box.left)
      expect(icon.right).toBeLessThanOrEqual(box.right)
    })
  })

  describe('collapsed rail', () => {
    it('keeps the footer one line tall', async () => {
      const { collapsed } = renderSidebar()
      await expect.element(page.getByRole('navigation')).toBeVisible()
      const footer = () => nav().querySelector('[data-slot="sidebar-footer"]')!
      const expanded = footer().getBoundingClientRect().height
      collapsed.value = true
      await settle()
      await expect.poll(() => nav().dataset.state).toBe('closed')
      // The width eases to the rail; measure where it ends.
      await Promise.all(
        nav()
          .getAnimations()
          .map((animation) => animation.finished),
      )
      expect(footer().getBoundingClientRect().height).toBeCloseTo(expanded, 0)
    })

    it('centres each item icon in the rail', async () => {
      renderSidebar({ collapsed: true })
      await settle()
      const box = nav().getBoundingClientRect()
      const centre = box.left + nav().clientLeft + nav().clientWidth / 2
      const icons = [...nav().querySelectorAll('[data-slot="sidebar-item"] svg')]
      expect(icons.length).toBe(3)
      for (const icon of icons) {
        const rect = icon.getBoundingClientRect()
        expect(Math.abs(rect.left + rect.width / 2 - centre)).toBeLessThan(0.5)
      }
    })
  })

  describe('drawer below 768 px', () => {
    beforeEach(() => page.viewport(375, 800))

    it('hides the nav, and shows a modal dialog at the start edge when open', async () => {
      const { open } = renderSidebar({ collapsed: true })
      await settle()
      expect(getComputedStyle(nav()).display).toBe('none')
      expect(dialog()).toBeNull()
      open.value = true
      await opened()
      const panel = page.getByRole('dialog', { name: 'Navigation' })
      await expect.element(panel).toBeVisible()
      const box = dialog()!.getBoundingClientRect()
      expect(box.left).toBeCloseTo(0, 0)
      expect(box.width).toBeCloseTo(tokenWidth('sidebar-width'), 0)
      // Labelled even though collapsed, and no trigger in the drawer.
      const invoices = panel.getByRole('link', { name: 'Invoices' })
      const text = invoices.element().querySelector('[data-slot="sidebar-item-text"]')!
      expect(width(text)).toBeGreaterThan(1)
      expect(dialog()!.querySelector('[data-slot="sidebar-trigger"]')).toBeNull()
      expect(
        document.querySelector('main')!.closest('[aria-hidden="true"], [inert]'),
      ).not.toBeNull()
    })

    it('sits against the right edge in right-to-left text', async () => {
      document.documentElement.dir = 'rtl'
      renderSidebar({ open: true })
      await opened()
      expect(dialog()!.getBoundingClientRect().right).toBeCloseTo(window.innerWidth, 0)
    })

    it('closes from its close button, named Close or by closeLabel', async () => {
      const { emitted } = renderSidebar({ open: true, props: { closeLabel: 'Close menu' } })
      await opened()
      await userEvent.click(page.getByRole('button', { name: 'Close menu' }))
      await closed()
      expect(emitted.open).toEqual([false])
    })

    it('closes on a click a router link prevented, and keeps a router link’s own aria-current', async () => {
      const { emitted } = renderSidebar({
        open: true,
        items: () =>
          h(SidebarGroup, null, () => [
            h(SidebarItem, { asChild: true }, () =>
              h('a', { href: '#reports', 'aria-current': 'page' }, 'Reports'),
            ),
          ]),
      })
      await opened()
      const link = dialog()!.querySelector<HTMLElement>('[data-slot="sidebar-item"]')!
      expect(link.getAttribute('aria-current')).toBe('page')
      // A RouterLink cancels the click to navigate itself before the item hears it.
      link.parentElement!.addEventListener('click', (event) => event.preventDefault(), true)
      await userEvent.click(link)
      await closed()
      expect(emitted.open).toEqual([false])
    })

    it('stays open on a modified or middle click on an item', async () => {
      renderSidebar({ open: true })
      await opened()
      const link = dialog()!.querySelector<HTMLElement>('[data-slot="sidebar-item"]')!
      // Runs after the item's own listener; it only stops the browser opening a tab.
      link.addEventListener('click', (event) => event.preventDefault())
      for (const init of [
        { ctrlKey: true },
        { metaKey: true },
        { shiftKey: true },
        { altKey: true },
        { button: 1 },
      ]) {
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init }))
      }
      await settle()
      expect(dialog()?.getAttribute('data-state')).toBe('open')
    })

    it('closes on Escape and on a click on an item', async () => {
      const { open, emitted } = renderSidebar({ open: true })
      await opened()
      await press('Escape')
      await closed()
      open.value = true
      await opened()
      await userEvent.click(page.getByRole('dialog').getByRole('link', { name: 'Customers' }))
      await closed()
      expect(emitted.open).toEqual([false, false])
    })
  })

  describe('resize', () => {
    it('closes a drawer opened at 375 px when the window grows to 1024 px', async () => {
      await page.viewport(375, 800)
      const { emitted } = renderSidebar({ open: true })
      await opened()
      await page.viewport(1024, 800)
      await closed()
      expect(emitted.open).toEqual([false])
      await expect.element(page.getByRole('navigation')).toBeVisible()
    })

    it('closes before the first frame when open at mount on a wide window', async () => {
      const { emitted } = renderSidebar({ open: true })
      await nextTick()
      expect(emitted.open).toEqual([false])
      await closed()
    })

    it('closes at mount when open on a wide window', async () => {
      const { emitted } = renderSidebar({ open: true })
      await expect.poll(() => emitted.open).toEqual([false])
      await closed()
    })

    it('keeps the nav hidden below 768 px when the caller sets a display class', async () => {
      await page.viewport(375, 800)
      const { open } = renderSidebar({ props: { class: 'flex' } })
      await settle()
      expect(getComputedStyle(nav()).display).toBe('none')
      open.value = true
      await opened()
      await settle()
      expect(dialog()?.getAttribute('data-state')).toBe('open')
    })

    it('moves focus into the nav after a resize close when the opener never took focus', async () => {
      await page.viewport(375, 800)
      const open = ref(false)
      render(() =>
        h('div', [
          // Safari leaves focus on the page when a button is clicked.
          h(
            'button',
            {
              class: 'md:hidden',
              onClick: (event: MouseEvent) => {
                ;(event.currentTarget as HTMLElement).blur()
                open.value = true
              },
            },
            'Menu',
          ),
          h(
            Sidebar,
            { open: open.value, 'onUpdate:open': (value: boolean) => (open.value = value) },
            () =>
              h(SidebarContent, null, () =>
                h(SidebarGroup, null, () => [item('Invoices', { active: true })]),
              ),
          ),
        ]),
      )
      await userEvent.click(page.getByRole('button', { name: 'Menu' }))
      await opened()
      await page.viewport(1024, 800)
      await closed()
      await expect.poll(() => nav().contains(document.activeElement)).toBe(true)
      expect(document.activeElement!.textContent).toContain('Invoices')
    })

    it('leaves focus alone when open at mount on a wide window', async () => {
      expect(document.activeElement).toBe(document.body)
      const { emitted } = renderSidebar({ open: true })
      await expect.poll(() => emitted.open).toEqual([false])
      await closed()
      await settle()
      expect(document.activeElement).toBe(document.body)
    })

    it('never shows the drawer or its overlay when opened on a wide window', async () => {
      const { open, emitted } = renderSidebar()
      await expect.element(page.getByRole('navigation')).toBeVisible()
      open.value = true
      await nextTick()
      await settle()
      expect(document.querySelector('[role="dialog"], [data-slot="drawer-overlay"]')).toBeNull()
      expect(emitted.open).toEqual([false])
    })

    it('moves focus to the first item after a resize close when no item is current', async () => {
      await page.viewport(375, 800)
      const open = ref(false)
      render(() =>
        h('div', [
          h('button', { class: 'md:hidden', onClick: () => (open.value = true) }, 'Menu'),
          h(
            Sidebar,
            { open: open.value, 'onUpdate:open': (value: boolean) => (open.value = value) },
            () => [
              h(SidebarHeader, null, () => [h('a', { href: '#home' }, 'Acme'), h(SidebarTrigger)]),
              h(SidebarContent, null, () =>
                h(SidebarGroup, null, () => [item('Customers'), item('Invoices')]),
              ),
            ],
          ),
        ]),
      )
      await userEvent.click(page.getByRole('button', { name: 'Menu' }))
      await opened()
      await page.viewport(1024, 800)
      await closed()
      await expect.poll(() => nav().contains(document.activeElement)).toBe(true)
      expect(document.activeElement!.textContent).toContain('Customers')
    })

    it('closes when opened after mount on a wide window', async () => {
      const { open, emitted } = renderSidebar()
      await expect.element(page.getByRole('navigation')).toBeVisible()
      open.value = true
      await expect.poll(() => emitted.open).toEqual([false])
      await closed()
    })

    it('moves focus into the nav when a wider window closes the drawer', async () => {
      await page.viewport(375, 800)
      const open = ref(false)
      render(() =>
        h('div', [
          h('button', { class: 'md:hidden', onClick: () => (open.value = true) }, 'Menu'),
          h(
            Sidebar,
            { open: open.value, 'onUpdate:open': (value: boolean) => (open.value = value) },
            () => [
              // A header link and the trigger come first in the nav; the current item still wins.
              h(SidebarHeader, null, () => [h('a', { href: '#home' }, 'Acme'), h(SidebarTrigger)]),
              h(SidebarContent, null, () =>
                h(SidebarGroup, null, () => [
                  item('Customers'),
                  item('Invoices', { active: true }),
                ]),
              ),
            ],
          ),
        ]),
      )
      await userEvent.click(page.getByRole('button', { name: 'Menu' }))
      await opened()
      await page.viewport(1024, 800)
      await closed()
      await expect.poll(() => nav().contains(document.activeElement)).toBe(true)
      expect(document.activeElement!.textContent).toContain('Invoices')
    })
  })

  describe('long content', () => {
    it('never makes the page scroll, collapsed with a long list', async () => {
      await page.viewport(1024, 600)
      renderSidebar({
        collapsed: true,
        props: { class: 'h-96' },
        items: () =>
          h(SidebarGroup, { heading: 'Projects' }, () =>
            Array.from({ length: 40 }, (_, index) => item(`Project ${index + 1}`)),
          ),
      })
      await settle()
      await expect.poll(() => nav().dataset.state).toBe('closed')
      expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight)
    })

    const many = () =>
      h(SidebarGroup, { heading: 'Projects' }, () =>
        Array.from({ length: 30 }, (_, index) => item(`Project ${index + 1}`)),
      )

    it.each([false, true])(
      'scrolls only the content, collapsed: %s, keeping focus rings clear of its edges',
      async (collapsed) => {
        await page.viewport(1024, 600)
        renderSidebar({ collapsed, props: { class: 'h-96' }, items: many })
        await settle()
        const content = nav().querySelector<HTMLElement>('[data-slot="sidebar-content"]')!
        expect(content.scrollHeight).toBeGreaterThan(content.clientHeight)
        const box = nav().getBoundingClientRect()
        for (const slot of ['sidebar-header', 'sidebar-footer']) {
          const part = nav().querySelector(`[data-slot="${slot}"]`)!.getBoundingClientRect()
          expect(part.top).toBeGreaterThanOrEqual(box.top)
          expect(part.bottom).toBeLessThanOrEqual(box.bottom)
        }
        trigger().focus()
        for (let step = 0; step < 30; step++) await tab()
        const last = document.activeElement as HTMLElement
        expect(last.textContent).toContain('Project 30')
        expect(content.scrollTop).toBeGreaterThan(0)
        const area = content.getBoundingClientRect()
        const links = [...content.querySelectorAll<HTMLElement>('a')]
        for (const link of [links[0]!, last]) {
          const rect = link.getBoundingClientRect()
          expect(rect.left - area.left).toBeGreaterThanOrEqual(4)
          expect(area.right - rect.right).toBeGreaterThanOrEqual(4)
        }
        content.scrollTop = 0
        await settle()
        expect(links[0]!.getBoundingClientRect().top - area.top).toBeGreaterThanOrEqual(4)
      },
    )
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)(
      'reports no violations in any %s demo state',
      async (mode) => {
        await mountDemo('sidebar', { mode })
        await settle()
        const navs = [...document.querySelectorAll('[data-slot="sidebar"]')]
        expect(navs.map((element) => element.getAttribute('data-state')).sort()).toEqual([
          'closed',
          'open',
        ])
        await expectNoAxeViolations()
      },
    )

    it('reports no violations at 375 px with the drawer open', async () => {
      await page.viewport(375, 800)
      await mountDemo('sidebar')
      await settle()
      await expectNoAxeViolations()
      await userEvent.click(page.getByRole('button', { name: 'Menu' }).first())
      await opened()
      await expectNoAxeViolations()
    })
  })
})
