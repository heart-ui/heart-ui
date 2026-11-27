import { afterEach, describe, expect, it } from 'vitest'
import { page as screen } from 'vitest/browser'
import { h, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  tab,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '.'

afterEach(unmountAll)

const rows = [
  ['1042', 'Northwind Traders', '€1,200.00'],
  ['1043', 'Contoso Pharmaceuticals', '€380.50'],
  ['1044', 'Fabrikam Residences', '€9,410.00'],
]

/** Renders the invoices table; `width` sets its container's width class. */
function invoices(
  table: Record<string, unknown> = {},
  {
    caption = {},
    width = ref('w-full'),
  }: { caption?: Record<string, unknown>; width?: { value: string } } = {},
) {
  render(() =>
    h('div', { class: width.value }, [
      h(Table, { class: 'part-table', ...table }, () => [
        h(TableCaption, { class: 'part-caption', ...caption }, () => 'Open invoices'),
        h(TableHeader, { class: 'part-header' }, () =>
          h(TableRow, { class: 'part-row' }, () => [
            h(TableHead, { class: 'part-head' }, () => 'Invoice'),
            h(TableHead, null, () => 'Customer'),
            h(TableHead, null, () => 'Amount'),
          ]),
        ),
        h(TableBody, { class: 'part-body' }, () =>
          rows.map(([id, customer, amount]) =>
            h(TableRow, { key: id }, () => [
              h(TableHead, { scope: 'row' }, () => id),
              h(TableCell, { class: 'whitespace-nowrap part-cell' }, () => customer),
              h(TableCell, { class: 'whitespace-nowrap' }, () => amount),
            ]),
          ),
        ),
      ]),
    ]),
  )
  return document.querySelector<HTMLElement>('.part-table')!
}

/** The computed value of a property on a probe element with the given class. */
function probe(className: string, property: keyof CSSStyleDeclaration) {
  const element = document.createElement('div')
  element.className = className
  document.body.append(element)
  const value = getComputedStyle(element)[property] as string
  element.remove()
  return value
}

const height = (element: Element) => element.getBoundingClientRect().height

/** Waits until the container's ResizeObserver has measured the latest layout. */
const measured = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

describe('Table', () => {
  describe('structure', () => {
    it('renders a div holding a table, with each part as its element', () => {
      const container = invoices()
      expect(container.tagName).toBe('DIV')
      const table = container.querySelector(':scope > table')!
      expect(table).not.toBeNull()
      expect(table.querySelector(':scope > caption')!.className).toContain('part-caption')
      expect(table.querySelector(':scope > thead > tr > th')!.className).toContain('part-head')
      expect(table.querySelectorAll(':scope > tbody > tr')).toHaveLength(3)
      expect(table.querySelector(':scope > tbody > tr > td')!.className).toContain('part-cell')
    })

    it('is named by its caption, with column and row headers', async () => {
      invoices()
      await expect.element(screen.getByRole('table', { name: 'Open invoices' })).toBeVisible()
      for (const name of ['Invoice', 'Customer', 'Amount'])
        await expect.element(screen.getByRole('columnheader', { name })).toBeVisible()
      for (const name of ['1042', '1043', '1044'])
        await expect.element(screen.getByRole('rowheader', { name })).toBeVisible()
      await expect.element(screen.getByRole('cell', { name: 'Northwind Traders' })).toBeVisible()
    })
  })

  describe('size', () => {
    it('makes cells as tall as the control height and padded by its padding, md by default', () => {
      for (const size of [undefined, 'sm', 'md', 'lg'] as const) {
        invoices(size ? { size } : {})
        const token = size ?? 'md'
        for (const cell of [
          document.querySelector('.part-head')!,
          document.querySelector('.part-cell')!,
        ]) {
          // Within the row's 1 px collapsed border.
          expect(
            Math.abs(height(cell) - parseFloat(probe(`h-control-${token}`, 'height'))),
            `${token} ${cell.tagName}`,
          ).toBeLessThanOrEqual(1)
          expect(getComputedStyle(cell).paddingInlineStart, `${token} ${cell.tagName}`).toBe(
            probe(`px-control-px-${token}`, 'paddingLeft'),
          )
        }
        unmountAll()
      }
    })

    it('makes sm rows shorter than md, and md shorter than lg', () => {
      const heights = (['sm', 'md', 'lg'] as const).map((size) => {
        invoices({ size })
        const value = height(document.querySelector('.part-cell')!)
        unmountAll()
        return value
      })
      expect(heights[0]).toBeLessThan(heights[1]!)
      expect(heights[1]).toBeLessThan(heights[2]!)
    })
  })

  describe('overflow', () => {
    it('scrolls a wide table inside its container, which becomes a focusable region named by the caption', async () => {
      await screen.viewport(375, 800)
      try {
        const container = invoices({}, { width: { value: 'w-40' } })
        await expect.poll(() => container.getAttribute('tabindex')).toBe('0')
        expect(container.scrollWidth).toBeGreaterThan(container.clientWidth)
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(375)
        await expect.element(screen.getByRole('region', { name: 'Open invoices' })).toBeVisible()
      } finally {
        await screen.viewport(1024, 800)
      }
    })

    it('names the region by a caption id the caller sets', async () => {
      const container = invoices(
        {},
        { caption: { id: 'invoices-caption' }, width: { value: 'w-40' } },
      )
      await expect.poll(() => container.getAttribute('aria-labelledby')).toBe('invoices-caption')
      expect(document.querySelector('caption')!.id).toBe('invoices-caption')
    })

    it('leaves a table that fits unfocusable, and drops focusability when its container grows', async () => {
      const width = ref('w-40')
      const container = invoices({}, { width })
      await expect.poll(() => container.getAttribute('tabindex')).toBe('0')
      width.value = 'w-full'
      await expect.poll(() => container.hasAttribute('tabindex')).toBe(false)
      expect(container.hasAttribute('role')).toBe(false)
      expect(container.hasAttribute('aria-labelledby')).toBe(false)
    })

    it('leaves a table that fits unfocusable when its rows have fractional heights', async () => {
      for (const factor of [1.07, 1.11, 1.13, 1.17, 1.29])
        for (const count of [1, 2, 3, 7]) {
          render(() =>
            h('div', { style: { '--h-control-md': `calc(var(--h-control-sm) * ${factor})` } }, [
              h(Table, { class: 'part-table' }, () => [
                h(TableCaption, null, () => 'Open invoices'),
                h(TableBody, null, () =>
                  rows
                    .concat(rows, rows)
                    .slice(0, count)
                    .map(([id], index) =>
                      h(TableRow, { key: index }, () => h(TableCell, null, () => id)),
                    ),
                ),
              ]),
            ]),
          )
          await measured()
          const container = document.querySelector('.part-table')!
          expect(container.hasAttribute('tabindex'), `${factor} × ${count}`).toBe(false)
          expect(container.hasAttribute('role'), `${factor} × ${count}`).toBe(false)
          unmountAll()
        }
    })

    it.each([
      ['aria-label', { 'aria-label': 'Invoices' }],
      ['ariaLabel', { ariaLabel: 'Invoices' }],
    ])(
      'is a region named by a %s on a table that fits, with no axe violations',
      async (_, label) => {
        render(() =>
          h(Table, { class: 'part-table', ...label }, () =>
            h(TableBody, null, () => h(TableRow, null, () => h(TableCell, null, () => '1042'))),
          ),
        )
        await measured()
        await expect.element(screen.getByRole('region', { name: 'Invoices' })).toBeVisible()
        expect(document.querySelector('.part-table')!.hasAttribute('tabindex')).toBe(false)
        await expectNoAxeViolations()
      },
    )

    it('is named by the caller’s aria-label over its caption', async () => {
      const container = invoices({ 'aria-label': 'Invoices' }, { width: { value: 'w-40' } })
      await expect.poll(() => container.getAttribute('tabindex')).toBe('0')
      await expect.element(screen.getByRole('region', { name: 'Invoices' })).toBeVisible()
    })

    it('is a region named by the caller when there is no caption', async () => {
      render(() =>
        h('div', { class: 'w-40' }, [
          h(Table, { class: 'part-table', 'aria-label': 'Invoices' }, () =>
            h(TableBody, null, () =>
              h(TableRow, null, () =>
                rows[0]!.map((value) => h(TableCell, { class: 'whitespace-nowrap' }, () => value)),
              ),
            ),
          ),
        ]),
      )
      await expect.element(screen.getByRole('region', { name: 'Invoices' })).toBeVisible()
    })
  })

  describe('keyboard', () => {
    function between(width: string) {
      render(() =>
        h('div', [
          h('button', { class: 'before' }, 'Before'),
          h('div', { class: width }, [
            h(Table, { class: 'part-table' }, () => [
              h(TableCaption, null, () => 'Open invoices'),
              h(TableBody, null, () =>
                h(TableRow, null, () =>
                  rows[0]!.map((value) =>
                    h(TableCell, { class: 'whitespace-nowrap' }, () => value),
                  ),
                ),
              ),
            ]),
          ]),
          h('button', { class: 'after' }, 'After'),
        ]),
      )
      document.querySelector<HTMLElement>('.before')!.focus()
      return document.querySelector<HTMLElement>('.part-table')!
    }

    it('stops on an overflowing container, with a focus ring', async () => {
      const container = between('w-40')
      await expect.poll(() => container.getAttribute('tabindex')).toBe('0')
      await tab()
      expect(document.activeElement).toBe(container)
      expect(getComputedStyle(container).boxShadow).not.toBe('none')
      await tab()
      expect(document.activeElement!.className).toBe('after')
    })

    it('skips a table that fits', async () => {
      const container = between('w-full')
      await measured()
      expect(container.hasAttribute('tabindex')).toBe(false)
      await tab()
      expect(document.activeElement!.className).toBe('after')
    })

    it('keeps focus on a focused container that stops overflowing, until it loses focus', async () => {
      const width = ref('w-40')
      render(() =>
        h('div', [
          h('div', { class: width.value }, [
            h(Table, { class: 'part-table' }, () => [
              h(TableCaption, null, () => 'Open invoices'),
              h(TableBody, null, () =>
                h(TableRow, null, () =>
                  rows[0]!.map((value) =>
                    h(TableCell, { class: 'whitespace-nowrap' }, () => value),
                  ),
                ),
              ),
            ]),
          ]),
          h('button', { class: 'after' }, 'After'),
        ]),
      )
      const container = document.querySelector<HTMLElement>('.part-table')!
      await expect.poll(() => container.getAttribute('tabindex')).toBe('0')
      container.focus()
      width.value = 'w-full'
      await measured()
      await measured()
      expect(document.activeElement).toBe(container)
      // The window losing focus blurs the container but leaves it the active element.
      container.dispatchEvent(new FocusEvent('blur'))
      await measured()
      expect(container.getAttribute('tabindex')).toBe('0')
      await tab()
      expect(document.activeElement!.className).toBe('after')
      await expect.poll(() => container.hasAttribute('tabindex')).toBe(false)
    })
  })

  describe('styles', () => {
    it('puts the header on surface-sunken with a border under it', () => {
      invoices()
      const header = getComputedStyle(document.querySelector('.part-header')!)
      expect(header.backgroundColor).toBe(probe('bg-surface-sunken', 'backgroundColor'))
      expect(parseFloat(header.borderBottomWidth)).toBeGreaterThan(0)
      expect(header.borderBottomColor).toBe(probe('border border-border', 'borderBottomColor'))
    })

    it('starts header text in muted-foreground at medium weight', () => {
      invoices()
      const head = getComputedStyle(document.querySelector('.part-head')!)
      expect(head.textAlign).toBe('start')
      expect(head.color).toBe(probe('text-muted-foreground', 'color'))
      expect(head.fontWeight).toBe('500')
    })

    it('wraps row headers, and keeps column headers on one line', () => {
      invoices()
      expect(getComputedStyle(document.querySelector('.part-head')!).whiteSpace).toBe('nowrap')
      const rowHeader = document.querySelector('.part-body th')!
      expect(rowHeader.getAttribute('scope')).toBe('row')
      expect(getComputedStyle(rowHeader).whiteSpace).toBe('normal')
    })

    it('gives a table nested in a header cell no column scope on its row heads', () => {
      render(() =>
        h(Table, null, () =>
          h(TableHeader, null, () =>
            h(TableRow, null, () =>
              h(TableHead, null, () =>
                h(Table, null, () =>
                  h(TableBody, null, () =>
                    h(TableRow, null, () => h(TableHead, { class: 'nested' }, () => 'Row A')),
                  ),
                ),
              ),
            ),
          ),
        ),
      )
      expect(document.querySelector('.nested')!.hasAttribute('scope')).toBe(false)
    })

    it('divides body rows by a border, with none under the last', () => {
      invoices()
      const [first, , last] = [...document.querySelectorAll('.part-body > tr')].map((row) =>
        parseFloat(getComputedStyle(row).borderBottomWidth),
      )
      expect(first).toBeGreaterThan(0)
      expect(last).toBe(0)
    })

    it('merges class last on every part', () => {
      invoices()
      for (const part of ['table', 'caption', 'header', 'row', 'head', 'body', 'cell'])
        expect(
          document.querySelector(`.part-${part}`)!.className.endsWith(`part-${part}`),
          part,
        ).toBe(true)
    })

    it('puts Table’s class and attributes on the container', () => {
      const container = invoices({
        id: 'invoices',
        'data-testid': 'invoices',
        class: 'part-table max-h-40',
      })
      expect(container.id).toBe('invoices')
      expect(container.dataset.testid).toBe('invoices')
      expect(container.classList.contains('max-h-40')).toBe(true)
      expect(container.querySelector('table')!.hasAttribute('id')).toBe(false)
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('table', { mode })
      await expectNoAxeViolations()
    })

    it('reports no violations at 375 px', async () => {
      await screen.viewport(375, 800)
      try {
        await mountDemo('table')
        await expect
          .poll(() =>
            document.querySelector('[data-slot="table-container"]')!.hasAttribute('tabindex'),
          )
          .toBe(true)
        await expectNoAxeViolations()
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(375)
      } finally {
        await screen.viewport(1024, 800)
      }
    })
  })
})
