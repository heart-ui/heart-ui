import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { h } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '.'

afterEach(unmountAll)

function invoice(card: Record<string, unknown> = {}, title: Record<string, unknown> = {}) {
  render(() =>
    h(Card, { class: 'part-card', ...card }, () => [
      h(CardHeader, { class: 'part-header' }, () => [
        h(CardTitle, { id: 'invoice-title', class: 'part-title', ...title }, () => 'Invoice 1042'),
        h(CardDescription, { class: 'part-description' }, () => 'Due 30 November'),
      ]),
      h(CardContent, { class: 'part-content' }, () => '€1,200.00'),
      h(CardFooter, { class: 'part-footer' }, () => h('button', 'Pay')),
    ]),
  )
  return document.querySelector<HTMLElement>('.part-card')!
}

describe('Card', () => {
  describe('surface', () => {
    it('renders a div by default, or the element as names', () => {
      expect(invoice().tagName).toBe('DIV')
      unmountAll()
      expect(invoice({ as: 'section' }).tagName).toBe('SECTION')
    })

    it('default is raised with a shadow; outline has a border only, on no fill', () => {
      const { boxShadow, backgroundColor } = getComputedStyle(invoice())
      expect(boxShadow).not.toBe('none')
      const raisedFill = backgroundColor
      unmountAll()
      const outline = getComputedStyle(invoice({ variant: 'outline' }))
      expect(outline.boxShadow).toBe('none')
      expect(parseFloat(outline.borderTopWidth)).toBeGreaterThan(0)
      // No fill of its own, where the raised card has one.
      const probe = document.createElement('div')
      probe.className = 'bg-transparent'
      document.body.append(probe)
      const transparent = getComputedStyle(probe).backgroundColor
      expect(outline.backgroundColor).toBe(transparent)
      expect(raisedFill).not.toBe(transparent)
    })

    it('renders onto its child with asChild', () => {
      render(() =>
        h(Card, { asChild: true, class: 'part-card' }, () =>
          h('a', { href: '#invoice' }, 'Invoice'),
        ),
      )
      expect(document.querySelector('.part-card')!.tagName).toBe('A')
    })

    it('pads every part, with the density gap between them, and lets a caller’s padding win', () => {
      render(() =>
        h(Card, null, () => [
          h(CardFooter, { class: 'part-footer' }, () => h('button', 'Pay')),
          h(CardContent, { class: 'part-content px-0' }, () => 'Body'),
        ]),
      )
      const card = document.querySelector<HTMLElement>('.part-footer')!.parentElement!
      const footer = document.querySelector<HTMLElement>('.part-footer')!
      expect(footer.getBoundingClientRect().top - card.getBoundingClientRect().top).toBeGreaterThan(
        8,
      )
      const content = document.querySelector<HTMLElement>('.part-content')!
      expect(parseFloat(getComputedStyle(content).paddingInlineStart)).toBe(0)
    })

    it('wraps footer actions in a narrow card', () => {
      render(() =>
        h('div', { class: 'w-40' }, [
          h(Card, null, () =>
            h(CardFooter, { class: 'part-footer' }, () => [
              h('button', { class: 'whitespace-nowrap' }, 'Cancel the plan'),
              h('button', { class: 'whitespace-nowrap' }, 'Add more members'),
            ]),
          ),
        ]),
      )
      const footer = document.querySelector<HTMLElement>('.part-footer')!
      const [first, second] = [...footer.querySelectorAll('button')].map((button) =>
        button.getBoundingClientRect(),
      )
      expect(second!.top).toBeGreaterThan(first!.top)
    })

    it('merges class last on every part', () => {
      invoice()
      for (const part of ['card', 'header', 'title', 'description', 'content', 'footer'])
        expect(
          document.querySelector(`.part-${part}`)!.className.endsWith(`part-${part}`),
          part,
        ).toBe(true)
    })
  })

  describe('title', () => {
    it('is an h3 by default, or the heading as names', async () => {
      invoice()
      await expect
        .element(page.getByRole('heading', { level: 3, name: 'Invoice 1042' }))
        .toBeVisible()
      unmountAll()
      invoice({}, { as: 'h2' })
      await expect
        .element(page.getByRole('heading', { level: 2, name: 'Invoice 1042' }))
        .toBeVisible()
    })

    it('names a section card by its title', async () => {
      invoice({ as: 'section', 'aria-labelledby': 'invoice-title' })
      await expect.element(page.getByRole('region', { name: 'Invoice 1042' })).toBeVisible()
    })
  })

  describe('radius', () => {
    it('follows --h-card-radius, falling back to --h-radius-lg', () => {
      const card = invoice()
      const probe = document.createElement('div')
      probe.className = 'rounded-lg'
      document.body.append(probe)
      expect(getComputedStyle(card).borderTopLeftRadius).toBe(
        getComputedStyle(probe).borderTopLeftRadius,
      )
      card.style.setProperty('--h-card-radius', '0')
      expect(parseFloat(getComputedStyle(card).borderTopLeftRadius)).toBe(0)
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('card', { mode })
      await expectNoAxeViolations()
    })
  })
})
