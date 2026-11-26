import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  tab,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '.'

afterEach(unmountAll)

const fade = () => new Promise((resolve) => setTimeout(resolve, 300))
const trigger = () => document.querySelector<HTMLElement>('[aria-haspopup="dialog"]')!
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')
const closed = () => expect.poll(() => dialog()).toBeNull()

function filters(content: Record<string, unknown> = {}, root: Record<string, unknown> = {}) {
  const open = ref(false)
  const changes: boolean[] = []
  render(() =>
    h('div', { class: 'flex justify-center p-24' }, [
      h(
        Popover,
        {
          ...root,
          open: open.value,
          'onUpdate:open': (next: boolean | undefined) => {
            changes.push(!!next)
            open.value = !!next
          },
        },
        () => [
          h(PopoverTrigger, null, () => 'Filters'),
          h(PopoverContent, content, () => [
            h('label', null, ['Owner ', h('input', { name: 'owner' })]),
            h('button', { type: 'button' }, 'Reset'),
            h(PopoverClose, null, () => 'Done'),
          ]),
        ],
      ),
      h('button', { type: 'button', id: 'outside' }, 'Outside'),
    ]),
  )
  return { open, changes }
}

describe('Popover', () => {
  describe('opening', () => {
    it('opens on a click of the trigger and closes on a second click', async () => {
      const { open, changes } = filters()
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(trigger().dataset.state).toBe('closed')
      expect(trigger().hasAttribute('aria-controls')).toBe(false)
      await userEvent.click(trigger())
      await expect.element(page.getByRole('dialog')).toBeInTheDocument()
      expect(open.value).toBe(true)
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(trigger().dataset.state).toBe('open')
      expect(trigger().getAttribute('aria-controls')).toBe(dialog()!.id)
      await userEvent.click(trigger())
      await closed()
      expect(open.value).toBe(false)
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(changes).toEqual([true, false])
    })

    it('opens and closes when the parent sets v-model:open', async () => {
      const { open } = filters()
      open.value = true
      await expect.element(page.getByRole('dialog')).toBeInTheDocument()
      open.value = false
      await closed()
    })

    it('opens from the keyboard', async () => {
      filters()
      trigger().focus()
      await userEvent.keyboard('{Enter}')
      await expect.element(page.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('dismissing', () => {
    it('closes on Escape and returns focus to the trigger', async () => {
      const { open } = filters()
      await userEvent.click(trigger())
      await expect.element(page.getByRole('dialog')).toBeInTheDocument()
      await userEvent.keyboard('{Escape}')
      await closed()
      expect(open.value).toBe(false)
      expect(document.activeElement).toBe(trigger())
    })

    it('closes on a click outside', async () => {
      const { open } = filters()
      await userEvent.click(trigger())
      await expect.element(page.getByRole('dialog')).toBeInTheDocument()
      await userEvent.click(document.getElementById('outside')!)
      await closed()
      expect(open.value).toBe(false)
    })

    it('closes from PopoverClose', async () => {
      const { open } = filters()
      await userEvent.click(trigger())
      await userEvent.click(page.getByRole('button', { name: 'Done' }))
      await closed()
      expect(open.value).toBe(false)
    })

    it("doesn't submit a form from the trigger or the close button", async () => {
      let submitted = 0
      render(() =>
        h(
          'form',
          {
            onSubmit: (event: Event) => {
              event.preventDefault()
              submitted++
            },
          },
          [
            h(Popover, null, () => [
              h(PopoverTrigger, null, () => 'Due date'),
              h(PopoverContent, null, () => h(PopoverClose, null, () => 'Done')),
            ]),
          ],
        ),
      )
      await userEvent.click(page.getByRole('button', { name: 'Due date' }))
      await userEvent.click(page.getByRole('button', { name: 'Done' }))
      await closed()
      expect(submitted).toBe(0)
    })
  })

  describe('focus', () => {
    it('moves focus to the first control in the content on open', async () => {
      filters()
      await userEvent.click(trigger())
      await expect.poll(() => document.activeElement?.getAttribute('name')).toBe('owner')
    })

    it('wraps Tab inside a modal popover and hides the page from screen readers', async () => {
      filters({}, { modal: true })
      await userEvent.click(trigger())
      await expect.poll(() => document.activeElement?.getAttribute('name')).toBe('owner')
      await tab()
      await tab()
      expect(document.activeElement?.textContent).toBe('Done')
      await tab()
      expect(document.activeElement?.getAttribute('name')).toBe('owner')
      expect(document.getElementById('outside')!.closest('[aria-hidden="true"]')).not.toBeNull()
      await fade()
      await expectNoAxeViolations(document.body, { skip: ['region'] })
    })

    it('stops the page scrolling and keeps an outside click from the page when modal', async () => {
      let clicked = 0
      filters({}, { modal: true })
      document.getElementById('outside')!.addEventListener('click', () => clicked++)
      await userEvent.click(trigger())
      await expect.element(page.getByRole('dialog')).toBeInTheDocument()
      expect(getComputedStyle(document.body).overflow).toBe('hidden')
      await userEvent.click(document.getElementById('outside')!, { force: true })
      await closed()
      expect(clicked).toBe(0)
      await expect.poll(() => getComputedStyle(document.body).overflow).not.toBe('hidden')
    })

    it('leaves the page to screen readers when not modal', async () => {
      filters()
      await userEvent.click(trigger())
      await expect.element(page.getByRole('dialog')).toBeInTheDocument()
      expect(document.getElementById('outside')!.closest('[aria-hidden="true"]')).toBeNull()
    })
  })

  describe('placement', () => {
    // The default frame is too narrow for a 288 px panel beside the trigger, so Reka would flip it.
    beforeEach(() => page.viewport(1024, 800))

    it.each([
      [undefined, 'bottom'],
      ['top', 'top'],
      ['right', 'right'],
      ['bottom', 'bottom'],
      ['left', 'left'],
    ] as const)('opens on side %s', async (side, expected) => {
      filters(side ? { side } : {})
      await userEvent.click(trigger())
      await expect.element(page.getByRole('dialog')).toBeInTheDocument()
      const content = dialog()!
      expect(content.dataset.side).toBe(expected)
      const box = trigger().getBoundingClientRect()
      const panel = content.getBoundingClientRect()
      if (expected === 'bottom') expect(panel.top).toBeGreaterThanOrEqual(box.bottom)
      if (expected === 'top') expect(panel.bottom).toBeLessThanOrEqual(box.top)
      if (expected === 'left') expect(panel.right).toBeLessThanOrEqual(box.left)
      if (expected === 'right') expect(panel.left).toBeGreaterThanOrEqual(box.right)
    })

    it.each([
      [undefined, 'center'],
      ['start', 'start'],
      ['center', 'center'],
      ['end', 'end'],
    ] as const)('lines up %s with the trigger', async (align, expected) => {
      filters(align ? { align } : {})
      await userEvent.click(trigger())
      await expect.element(page.getByRole('dialog')).toBeInTheDocument()
      await fade()
      const content = dialog()!
      expect(content.dataset.align).toBe(expected)
      const box = trigger().getBoundingClientRect()
      const panel = content.getBoundingClientRect()
      if (expected === 'start') expect(panel.left).toBeCloseTo(box.left, 0)
      if (expected === 'end') expect(panel.right).toBeCloseTo(box.right, 0)
      if (expected === 'center')
        expect(panel.left + panel.width / 2).toBeCloseTo(box.left + box.width / 2, 0)
    })
  })

  describe('roles', () => {
    it('announces a dialog that its trigger names', async () => {
      filters()
      expect(trigger().getAttribute('aria-haspopup')).toBe('dialog')
      await userEvent.click(trigger())
      await expect.element(page.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument()
    })
  })

  describe('styles', () => {
    it('sits on the raised surface above the page and merges class last', async () => {
      filters({ class: 'p-2 part-content' })
      await userEvent.click(trigger())
      await expect.element(page.getByRole('dialog')).toBeInTheDocument()
      const content = dialog()!
      expect(content.className.endsWith('part-content')).toBe(true)
      expect(content.classList.contains('p-4')).toBe(false)
      expect(content.classList.contains('bg-surface-raised')).toBe(true)
      expect(content.classList.contains('z-popover')).toBe(true)
      expect(getComputedStyle(content).zIndex).toBe('60')
    })

    it('stays inside the viewport at 375 px when a caller makes it wider', async () => {
      await page.viewport(375, 800)
      try {
        filters({ class: 'w-screen' })
        await userEvent.click(trigger())
        await expect.element(page.getByRole('dialog')).toBeInTheDocument()
        await fade()
        const panel = dialog()!.getBoundingClientRect()
        expect(panel.left).toBeGreaterThanOrEqual(0)
        expect(panel.right).toBeLessThanOrEqual(375)
      } finally {
        await page.viewport(1024, 800)
      }
    })

    it('scrolls content taller than the room beside the trigger', async () => {
      render(() =>
        h(Popover, { open: true }, () => [
          h(PopoverTrigger, null, () => 'Open'),
          h(PopoverContent, null, () =>
            Array.from({ length: 80 }, (_, index) => h('p', null, `Line ${index + 1}`)),
          ),
        ]),
      )
      await expect.element(page.getByRole('dialog')).toBeInTheDocument()
      await fade()
      const content = dialog()!
      expect(content.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight)
      expect(content.scrollHeight).toBeGreaterThan(content.clientHeight)
      expect(getComputedStyle(content).overflowY).toBe('auto')
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)(
      'reports no violations in the %s demo, closed and with each popover open',
      async (mode) => {
        await mountDemo('popover', { mode })
        await fade()
        await expectNoAxeViolations()
        const triggers = [...document.querySelectorAll<HTMLElement>('[aria-haspopup="dialog"]')]
        expect(triggers.length).toBeGreaterThan(1)
        for (const button of triggers) {
          await userEvent.click(button)
          await expect.element(page.getByRole('dialog')).toBeInTheDocument()
          await fade()
          // `region` is off because the content is portalled outside the page's landmarks.
          await expectNoAxeViolations(document.body, { skip: ['region'] })
          await userEvent.keyboard('{Escape}')
          await closed()
        }
      },
    )
  })
})
