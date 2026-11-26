import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '.'

afterEach(unmountAll)

const settle = () => new Promise((resolve) => setTimeout(resolve, 300))
const items = [
  ['billing', 'When am I billed?', 'On the first day of each month.'],
  ['export', 'Can I export my data?', 'Yes, as CSV from Settings.'],
  ['delete', 'How do I delete a workspace?', 'From Settings, by its owner.'],
] as const
const trigger = (name: string) =>
  page.getByRole('button', { name, exact: true }).element() as HTMLButtonElement
const regions = () =>
  [...document.querySelectorAll<HTMLElement>('[role="region"]')].filter((region) => !region.hidden)
const openNames = () => regions().map((region) => region.textContent)

function faq(
  root: Record<string, unknown> = {},
  item: Record<string, Record<string, unknown>> = {},
  parts: Record<string, Record<string, unknown>> = {},
) {
  const model = ref<string | string[] | undefined>(root.modelValue as string | undefined)
  const changes: unknown[] = []
  render(() =>
    h(
      Accordion,
      {
        ...root,
        ...('modelValue' in root
          ? {
              modelValue: model.value,
              'onUpdate:modelValue': (next: string | string[] | undefined) => {
                changes.push(next)
                model.value = next
              },
            }
          : {}),
      },
      () =>
        items.map(([value, question, answer]) =>
          h(AccordionItem, { value, ...item[value], ...parts.item }, () => [
            h(AccordionTrigger, parts.trigger ?? null, () => question),
            h(AccordionContent, parts.content ?? null, () => answer),
          ]),
        ),
    ),
  )
  return { model, changes }
}

describe('Accordion', () => {
  describe('single', () => {
    it('opens one item at a time and closes it on a second click', async () => {
      faq()
      await userEvent.click(trigger('When am I billed?'))
      await expect.poll(openNames).toEqual(['On the first day of each month.'])
      await userEvent.click(trigger('Can I export my data?'))
      await expect.poll(openNames).toEqual(['Yes, as CSV from Settings.'])
      await userEvent.click(trigger('Can I export my data?'))
      await expect.poll(openNames).toEqual([])
    })

    it('reports the open item through v-model and opens one the parent sets', async () => {
      const { model, changes } = faq({ modelValue: undefined })
      await userEvent.click(trigger('When am I billed?'))
      await expect.poll(() => model.value).toBe('billing')
      await userEvent.click(trigger('When am I billed?'))
      await expect.poll(() => model.value).toBeUndefined()
      expect(changes).toEqual(['billing', undefined])
      model.value = 'delete'
      await expect.poll(openNames).toEqual(['From Settings, by its owner.'])
    })

    it('opens the defaultValue item at first', async () => {
      faq({ defaultValue: 'export' })
      await expect.poll(openNames).toEqual(['Yes, as CSV from Settings.'])
    })
  })

  describe('options', () => {
    it('keeps the open item open when not collapsible', async () => {
      faq({ collapsible: false })
      await userEvent.click(trigger('When am I billed?'))
      // The open trigger is aria-disabled, and Playwright's click waits for it to be enabled.
      await userEvent.click(trigger('When am I billed?'), { force: true })
      await settle()
      expect(openNames()).toEqual(['On the first day of each month.'])
    })

    it('keeps several items open with type multiple, reported as an array', async () => {
      const { model } = faq({ type: 'multiple', modelValue: [] })
      await userEvent.click(trigger('When am I billed?'))
      await userEvent.click(trigger('How do I delete a workspace?'))
      await expect.poll(() => model.value).toEqual(['billing', 'delete'])
      expect(openNames()).toEqual([
        'On the first day of each month.',
        'From Settings, by its owner.',
      ])
      await userEvent.click(trigger('When am I billed?'))
      await expect.poll(() => model.value).toEqual(['delete'])
    })
  })

  describe('keyboard', () => {
    it('toggles the focused item with Enter and Space', async () => {
      faq()
      trigger('When am I billed?').focus()
      await userEvent.keyboard('{Enter}')
      await expect.poll(openNames).toEqual(['On the first day of each month.'])
      await userEvent.keyboard(' ')
      await expect.poll(openNames).toEqual([])
    })

    it('moves between triggers with the arrow keys, Home and End', async () => {
      faq()
      trigger('When am I billed?').focus()
      await userEvent.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(trigger('Can I export my data?'))
      await userEvent.keyboard('{End}')
      expect(document.activeElement).toBe(trigger('How do I delete a workspace?'))
      await userEvent.keyboard('{ArrowUp}')
      expect(document.activeElement).toBe(trigger('Can I export my data?'))
      await userEvent.keyboard('{Home}')
      expect(document.activeElement).toBe(trigger('When am I billed?'))
    })
  })

  describe('disabled', () => {
    it("doesn't open a disabled item", async () => {
      faq({}, { export: { disabled: true } })
      const button = trigger('Can I export my data?')
      expect(button.disabled).toBe(true)
      await userEvent.click(button, { force: true })
      await settle()
      expect(openNames()).toEqual([])
    })

    it("doesn't open any item of a disabled accordion", async () => {
      faq({ disabled: true })
      for (const [, question] of items) {
        expect(trigger(question).disabled).toBe(true)
        await userEvent.click(trigger(question), { force: true })
      }
      await settle()
      expect(openNames()).toEqual([])
    })
  })

  describe('roles', () => {
    it('puts each trigger button in an h3 that controls a region it names', async () => {
      faq({ defaultValue: 'billing' })
      const button = trigger('When am I billed?')
      expect(button.parentElement?.tagName).toBe('H3')
      expect(button.getAttribute('aria-expanded')).toBe('true')
      expect(trigger('Can I export my data?').getAttribute('aria-expanded')).toBe('false')
      await expect.poll(() => button.getAttribute('aria-controls')).toBeTruthy()
      const region = document.getElementById(button.getAttribute('aria-controls')!)!
      expect(region.getAttribute('role')).toBe('region')
      await expect
        .element(page.getByRole('region', { name: 'When am I billed?' }))
        .toHaveTextContent('On the first day of each month.')
    })
  })

  describe('styles', () => {
    it('divides items, turns the chevron, rings focus and merges class last', async () => {
      render(() =>
        h(Accordion, { class: 'part-root', defaultValue: 'billing' }, () =>
          h(AccordionItem, { value: 'billing', class: 'border-b-0 part-item' }, () => [
            h(AccordionTrigger, { class: 'py-2 part-trigger' }, () => 'Billing'),
            h(AccordionContent, { class: 'part-content' }, () => 'Monthly.'),
          ]),
        ),
      )
      for (const part of ['root', 'item', 'trigger', 'content']) {
        const element = document.querySelector(`.part-${part}`)!
        expect(element.className.endsWith(`part-${part}`), part).toBe(true)
      }
      expect(document.querySelector('.part-item')!.classList.contains('border-b')).toBe(false)
      expect(document.querySelector('.part-trigger')!.classList.contains('py-4')).toBe(false)
      const button = trigger('Billing')
      expect(button.className).toContain('focus-visible:ring')
      const chevron = button.querySelector('svg')!
      const open = getComputedStyle(chevron).rotate
      await userEvent.click(button)
      await settle()
      expect(getComputedStyle(chevron).rotate).not.toBe(open)
    })

    it('divides the items with the border token', () => {
      faq()
      const item = document.querySelector<HTMLElement>('[data-orientation][data-state]')!
      expect(item.classList.contains('border-b')).toBe(true)
      expect(item.classList.contains('border-border')).toBe(true)
    })

    it('animates the height in a private layer, never a Tailwind one', async () => {
      faq({ defaultValue: 'billing' })
      const region = document.querySelector<HTMLElement>('[role="region"]')!
      const found: { layers: string[]; animation: string }[] = []
      const walk = (rules: CSSRuleList, layers: string[]) => {
        for (const rule of rules) {
          if (rule instanceof CSSLayerBlockRule) walk(rule.cssRules, [...layers, rule.name])
          else if (rule instanceof CSSStyleRule && rule.selectorText.includes('heart-accordion'))
            found.push({ layers, animation: rule.style.animationName || rule.style.animation })
          else if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules, layers)
        }
      }
      for (const sheet of document.styleSheets) walk(sheet.cssRules, [])
      expect(region.classList.contains('heart-accordion-content')).toBe(true)
      expect(found.length).toBeGreaterThan(0)
      expect(found.some(({ animation }) => animation.includes('heart-accordion-'))).toBe(true)
      for (const { layers } of found) {
        expect(layers.length).toBeGreaterThan(0)
        for (const layer of layers)
          expect(['theme', 'base', 'components', 'utilities']).not.toContain(layer)
      }
    })
  })

  describe('attributes and states', () => {
    it('forwards attributes to the trigger button, not its heading', () => {
      faq({}, {}, { trigger: { 'aria-describedby': 'hint', 'data-testid': 'faq-trigger' } })
      const button = trigger('When am I billed?')
      expect(button.getAttribute('aria-describedby')).toBe('hint')
      expect(button.dataset.testid).toBe('faq-trigger')
      expect(button.parentElement!.hasAttribute('aria-describedby')).toBe(false)
    })

    it('clips open content only while it animates, so focus rings inside show', async () => {
      faq()
      await userEvent.click(trigger('When am I billed?'))
      const region = () => document.querySelector<HTMLElement>('[role="region"]')!
      await expect.poll(() => getComputedStyle(region()).overflow).toBe('hidden')
      await settle()
      expect(getComputedStyle(region()).overflow).toBe('visible')
    })

    it('marks the open trigger aria-disabled when it cannot close', async () => {
      faq({ collapsible: false, defaultValue: 'billing' })
      expect(trigger('When am I billed?').getAttribute('aria-disabled')).toBe('true')
      expect(trigger('Can I export my data?').hasAttribute('aria-disabled')).toBe(false)
      await userEvent.click(trigger('Can I export my data?'))
      await expect
        .poll(() => trigger('Can I export my data?').getAttribute('aria-disabled'))
        .toBe('true')
      expect(trigger('When am I billed?').hasAttribute('aria-disabled')).toBe(false)
    })

    it("keeps the region named by a caller's trigger id", async () => {
      faq({ defaultValue: 'billing' }, {}, { trigger: { id: 'faq-question' } })
      expect(document.querySelector('button#faq-question')).not.toBeNull()
      await expect
        .element(page.getByRole('region', { name: 'When am I billed?' }))
        .toBeInTheDocument()
    })

    it("keeps a caller's aria-disabled", () => {
      faq({}, {}, { trigger: { 'aria-disabled': 'true' } })
      expect(trigger('Can I export my data?').getAttribute('aria-disabled')).toBe('true')
    })

    it('keeps aria-disabled on a disabled item', () => {
      faq({}, { export: { disabled: true } })
      expect(trigger('Can I export my data?').getAttribute('aria-disabled')).toBe('true')
    })

    it('dims a disabled item’s chevron with its text', () => {
      faq({}, { export: { disabled: true } })
      const button = trigger('Can I export my data?')
      expect(getComputedStyle(button.querySelector('svg')!).color).toBe(
        getComputedStyle(button).color,
      )
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)(
      'reports no violations in the %s demo, with items closed and open',
      async (mode) => {
        await mountDemo('accordion', { mode })
        await settle()
        await expectNoAxeViolations()
        for (const button of document.querySelectorAll<HTMLButtonElement>(
          'button[aria-expanded]:not([disabled])',
        )) {
          await userEvent.click(button)
          await settle()
          await expectNoAxeViolations()
        }
      },
    )
  })
})
