import { ConfigProvider } from 'reka-ui'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { defineComponent, h, type VNodeChild } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  tab,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { fluent } from '../../lib/icon'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '.'

afterEach(unmountAll)

const draws = (element: Element | null, name: keyof typeof fluent) =>
  element?.querySelector('svg path')?.getAttribute('d') ===
  /d="([^"]+)"/.exec(fluent[name].body)![1]

function trail(
  root: Record<string, unknown> = {},
  parts: Record<string, Record<string, unknown>> = {},
  separator?: () => unknown,
) {
  const sep = () =>
    h(BreadcrumbSeparator, parts.separator ?? null, separator ? () => separator() : undefined)
  render(() =>
    h(Breadcrumb, root, () => [
      h(BreadcrumbItem, parts.item ?? null, () =>
        h(BreadcrumbLink, { href: '#home', ...parts.link }, () => 'Home'),
      ),
      sep(),
      h(BreadcrumbItem, null, () => h(BreadcrumbLink, { href: '#projects' }, () => 'Projects')),
      sep(),
      h(BreadcrumbItem, null, () =>
        h(BreadcrumbPage, parts.page ?? null, () => 'Website redesign'),
      ),
    ]),
  )
}

describe('Breadcrumb', () => {
  describe('structure', () => {
    it('is a nav named Breadcrumb holding an ordered list', async () => {
      trail()
      const nav = page.getByRole('navigation', { name: 'Breadcrumb' })
      await expect.element(nav).toBeInTheDocument()
      const list = nav.element().firstElementChild!
      expect(list.tagName).toBe('OL')
      expect([...list.children].every((child) => child.tagName === 'LI')).toBe(true)
    })

    it('takes its name from navLabel', async () => {
      trail({ navLabel: 'Fil d’Ariane' })
      await expect
        .element(page.getByRole('navigation', { name: 'Fil d’Ariane' }))
        .toBeInTheDocument()
    })

    it('marks the current page, which is not a link', () => {
      trail()
      const current = document.querySelector('[aria-current="page"]')!
      expect(current.textContent).toBe('Website redesign')
      expect(current.closest('a')).toBeNull()
      expect(page.getByRole('link', { name: 'Website redesign' }).query()).toBeNull()
    })
  })

  describe('links', () => {
    it("renders a link with the caller's href", async () => {
      trail()
      await expect
        .element(page.getByRole('link', { name: 'Projects' }))
        .toHaveAttribute('href', '#projects')
    })

    it('merges onto its child with asChild', () => {
      render(() =>
        h(Breadcrumb, null, () =>
          h(BreadcrumbItem, null, () =>
            h(BreadcrumbLink, { asChild: true, class: 'part-link' }, () =>
              h('a', { href: '#settings', 'data-router': '' }, 'Settings'),
            ),
          ),
        ),
      )
      const link = page.getByRole('link', { name: 'Settings' }).element()
      expect(link.hasAttribute('data-router')).toBe(true)
      expect(link.classList.contains('part-link')).toBe(true)
      expect(link.classList.contains('text-muted-foreground')).toBe(true)
      expect(link.parentElement!.tagName).toBe('LI')
    })
  })

  describe('router links', () => {
    // Like RouterLink and NuxtLink: a component that computes its own href.
    const RouterLinkStub = defineComponent({
      setup(_, { slots }) {
        return () => h('a', { href: '/settings' }, slots.default?.())
      },
    })

    it.each([
      ['asChild', { asChild: true }, (): VNodeChild => h(RouterLinkStub, null, () => 'Settings')],
      ['as', { as: RouterLinkStub }, (): VNodeChild => 'Settings'],
    ] as const)('keeps the href a router link computes (%s)', async (_, props, child) => {
      render(() =>
        h(Breadcrumb, null, () => h(BreadcrumbItem, null, () => h(BreadcrumbLink, props, child))),
      )
      await expect
        .element(page.getByRole('link', { name: 'Settings' }))
        .toHaveAttribute('href', '/settings')
      await tab()
      expect(document.activeElement?.textContent).toBe('Settings')
    })
  })

  describe('separators', () => {
    it('with asChild, leaves the href to the child', async () => {
      render(() =>
        h(Breadcrumb, null, () =>
          h(BreadcrumbItem, null, () =>
            h(BreadcrumbLink, { asChild: true, href: '/old' }, () =>
              h('a', { href: '/settings' }, 'Settings'),
            ),
          ),
        ),
      )
      await expect
        .element(page.getByRole('link', { name: 'Settings' }))
        .toHaveAttribute('href', '/settings')
    })

    it('hides separators from screen readers as presentational list items', () => {
      trail()
      const separators = document.querySelectorAll('li[aria-hidden="true"]')
      expect(separators).toHaveLength(2)
      for (const separator of separators)
        expect(separator.getAttribute('role')).toBe('presentation')
    })

    it.each([
      ['ltr', 'chevron-right'],
      ['rtl', 'chevron-left'],
    ] as const)('points the chevron the reading way (%s)', (dir, icon) => {
      render(() =>
        h(ConfigProvider, { dir }, () =>
          h(Breadcrumb, null, () => [
            h(BreadcrumbItem, null, () => h(BreadcrumbLink, { href: '#a' }, () => 'A')),
            h(BreadcrumbSeparator),
            h(BreadcrumbItem, null, () => h(BreadcrumbPage, null, () => 'B')),
          ]),
        ),
      )
      expect(draws(document.querySelector('li[aria-hidden="true"]'), icon)).toBe(true)
    })

    it('takes a custom separator from its slot', () => {
      trail({}, {}, () => '/')
      const separator = document.querySelector('li[aria-hidden="true"]')!
      expect(separator.textContent).toBe('/')
      expect(separator.querySelector('svg')).toBeNull()
    })
  })

  describe('keyboard', () => {
    it('tabs through the links only', async () => {
      trail()
      await tab()
      expect(document.activeElement?.textContent).toBe('Home')
      await tab()
      expect(document.activeElement?.textContent).toBe('Projects')
      await tab()
      expect(document.activeElement).toBe(document.body)
    })
  })

  describe('styles', () => {
    it('styles the trail, links and page from tokens and merges class last', () => {
      trail(
        { class: 'text-xs part-root' },
        {
          item: { class: 'part-item' },
          link: { class: 'part-link' },
          page: { class: 'part-page' },
          separator: { class: 'part-separator' },
        },
      )
      const nav = document.querySelector('nav')!
      expect(nav.classList.contains('text-muted-foreground')).toBe(true)
      // The root's class reaches the trail: text-xs replaces text-sm.
      expect(nav.classList.contains('text-sm')).toBe(false)
      expect(getComputedStyle(document.querySelector('ol')!).fontSize).toBe(
        getComputedStyle(nav).fontSize,
      )
      for (const part of ['root', 'item', 'link', 'page', 'separator']) {
        const element = document.querySelector(`.part-${part}`)!
        expect(element.className.endsWith(`part-${part}`), part).toBe(true)
      }
      const link = document.querySelector('.part-link')!
      expect(link.className).toContain('focus-visible:ring')
      expect(link.className).toContain('hover:text-foreground')
      expect(document.querySelector('.part-page')!.classList.contains('text-foreground')).toBe(true)
    })

    it('breaks a label with no spaces inside 375 px', async () => {
      await page.viewport(375, 800)
      try {
        render(() =>
          h(Breadcrumb, null, () => [
            h(BreadcrumbItem, null, () =>
              h(BreadcrumbLink, { href: '#files' }, () => 'Shared_drive_2026_finance_archive'),
            ),
            h(BreadcrumbSeparator),
            h(BreadcrumbItem, null, () =>
              h(BreadcrumbPage, null, () => 'Q3_2026_financial_projections_final_revision_v2.xlsx'),
            ),
          ]),
        )
        const list = document.querySelector('ol')!
        expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth)
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(375)
        for (const label of list.querySelectorAll('a, [aria-current]'))
          expect(label.getBoundingClientRect().right).toBeLessThanOrEqual(375)
      } finally {
        await page.viewport(1024, 800)
      }
    })

    it('wraps a long trail inside 375 px', async () => {
      await page.viewport(375, 800)
      try {
        render(() =>
          h(Breadcrumb, null, () =>
            ['Workspace', 'Projects', 'Website redesign', 'Design', 'Components'].flatMap(
              (name, index, all) =>
                index === all.length - 1
                  ? [h(BreadcrumbItem, null, () => h(BreadcrumbPage, null, () => name))]
                  : [
                      h(BreadcrumbItem, null, () =>
                        h(BreadcrumbLink, { href: `#${index}` }, () => name),
                      ),
                      h(BreadcrumbSeparator),
                    ],
            ),
          ),
        )
        const list = document.querySelector('ol')!
        expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth)
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(375)
        const tops = new Set(
          [...list.children].map((child) => Math.round(child.getBoundingClientRect().top)),
        )
        expect(tops.size).toBeGreaterThan(1)
      } finally {
        await page.viewport(1024, 800)
      }
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('breadcrumb', { mode })
      await expectNoAxeViolations()
    })

    it('reports no violations at 375 px', async () => {
      await page.viewport(375, 800)
      try {
        await mountDemo('breadcrumb')
        await expectNoAxeViolations()
      } finally {
        await page.viewport(1024, 800)
      }
    })
  })
})
