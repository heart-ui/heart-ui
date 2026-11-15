import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h, nextTick, ref, withDirectives, type VNodeChild } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  press,
  render,
  shiftTab,
  tab,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '.'

afterEach(unmountAll)

type Options = {
  modal?: boolean
  content?: Record<string, unknown>
  description?: boolean
  body?: () => VNodeChild
}

// The usage example from dialog.md, with the open state exposed to the test.
function renderDialog({ modal, content = {}, description = true, body }: Options = {}) {
  const open = ref(false)
  const root = render(() =>
    h(
      Dialog,
      {
        open: open.value,
        'onUpdate:open': (value: boolean) => (open.value = value),
        ...(modal === undefined ? {} : { modal }),
      },
      () => [
        h(DialogTrigger, { asChild: true }, () => h(Button, null, () => 'Rename')),
        h(DialogContent, content, () => [
          h(DialogHeader, null, () => [
            h(DialogTitle, null, () => 'Rename project'),
            description ? h(DialogDescription, null, () => 'The URL does not change.') : null,
          ]),
          body ? body() : h('input', { 'aria-label': 'Name' }),
          h(DialogFooter, null, () => [
            h(DialogClose, { asChild: true }, () =>
              h(Button, { variant: 'ghost' }, () => 'Cancel'),
            ),
            h(Button, { variant: 'primary' }, () => 'Save'),
          ]),
        ]),
      ],
    ),
  )
  const trigger = root.querySelector('button')!
  return { open, root, trigger }
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')
const overlay = () => document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')
const button = (name: string) =>
  [...dialog()!.querySelectorAll('button')].find(
    (element) => element.getAttribute('aria-label') === name || element.textContent === name,
  )

// Waits for the enter animation so styles and positions are final.
async function opened() {
  await vi.waitFor(() => expect(dialog()).not.toBeNull())
  await Promise.all(document.getAnimations().map((animation) => animation.finished))
}

const closed = () => vi.waitFor(() => expect(dialog()).toBeNull())

// Longer than --h-duration-normal, so any late animation or event has run.
const settle = () => new Promise((resolve) => setTimeout(resolve, 400))

async function clickOutside() {
  await userEvent.click(overlay()!, { position: { x: 4, y: 4 } })
}

describe('Dialog', () => {
  describe('open and close', () => {
    it('opens from the trigger and closes from DialogClose, updating v-model', async () => {
      const { open, trigger } = renderDialog()
      expect(dialog()).toBeNull()
      await userEvent.click(trigger)
      await opened()
      expect(open.value).toBe(true)
      await userEvent.click(button('Cancel')!)
      expect(open.value).toBe(false)
      await closed()
    })

    it('follows v-model:open set from outside', async () => {
      const { open } = renderDialog()
      open.value = true
      await opened()
      open.value = false
      await closed()
    })

    it('emits close once, after the content is gone', async () => {
      const present: boolean[] = []
      const { open } = renderDialog({ content: { onClose: () => present.push(dialog() !== null) } })
      open.value = true
      await opened()
      expect(present).toEqual([])
      open.value = false
      await closed()
      await vi.waitFor(() => expect(present).toEqual([false]))
      await settle()
      expect(present).toEqual([false])
    })

    it('does not emit close when the dialog is torn down while open', async () => {
      const onClose = vi.fn()
      const shown = ref(true)
      render(() =>
        shown.value
          ? h(Dialog, { open: true }, () =>
              h(DialogContent, { onClose }, () => h(DialogTitle, null, () => 'Rename project')),
            )
          : h('p', null, 'Gone'),
      )
      await opened()
      shown.value = false
      await settle()
      expect(onClose).not.toHaveBeenCalled()
    })

    it('plays the exit animation when a field inside focuses itself on mount', async () => {
      const { open } = renderDialog({
        body: () =>
          withDirectives(h('input', { 'aria-label': 'Name' }), [
            [{ mounted: (el: HTMLInputElement) => el.focus() }],
          ]),
      })
      open.value = true
      await opened()
      open.value = false
      await nextTick()
      expect(dialog()?.dataset.state).toBe('closed')
      await closed()
    })

    it('stays open, without close, when modal changes while open', async () => {
      const onClose = vi.fn()
      const open = ref(true)
      const modal = ref(true)
      render(() =>
        h(
          Dialog,
          {
            open: open.value,
            modal: modal.value,
            'onUpdate:open': (value: boolean) => (open.value = value),
          },
          () => h(DialogContent, { onClose }, () => h(DialogTitle, null, () => 'Rename project')),
        ),
      )
      await opened()
      modal.value = false
      await settle()
      expect(onClose).not.toHaveBeenCalled()
      expect(dialog()).not.toBeNull()
      open.value = false
      await nextTick()
      expect(dialog()?.dataset.state).toBe('closed')
      await closed()
      await settle()
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('forwards attributes added after the first render', async () => {
      const extra = ref<Record<string, string>>({})
      render(() =>
        h(Dialog, { open: true }, () =>
          h(DialogContent, extra.value, () => h(DialogTitle, null, () => 'Rename project')),
        ),
      )
      await opened()
      extra.value = { 'data-step': '2' }
      await nextTick()
      expect(dialog()!.dataset.step).toBe('2')
    })
  })

  describe('dismiss', () => {
    it('closes on Escape', async () => {
      const { open } = renderDialog()
      open.value = true
      await opened()
      await press('Escape')
      expect(open.value).toBe(false)
      await closed()
    })

    it('closes on a click outside', async () => {
      const { open } = renderDialog()
      open.value = true
      await opened()
      await clickOutside()
      expect(open.value).toBe(false)
      await closed()
    })

    it('stays open on Escape and a click outside when not dismissible', async () => {
      const { open } = renderDialog({ content: { dismissible: false } })
      open.value = true
      await opened()
      await press('Escape')
      await clickOutside()
      await nextTick()
      expect(open.value).toBe(true)
      expect(dialog()).not.toBeNull()
    })
  })

  describe('focus', () => {
    it('moves focus in on open, cycles with Tab and Shift+Tab, and returns it on close', async () => {
      const { trigger } = renderDialog()
      await tab()
      expect(document.activeElement).toBe(trigger)
      await press('Enter')
      await opened()
      const inside = dialog()!
      const focusables = [...inside.querySelectorAll<HTMLElement>('input, button')]
      expect(focusables.length).toBe(4)
      expect(document.activeElement).toBe(focusables[0])
      for (let step = 1; step <= focusables.length; step++) {
        await tab()
        expect(document.activeElement).toBe(focusables[step % focusables.length])
      }
      await shiftTab()
      expect(document.activeElement).toBe(focusables.at(-1))
      await press('Escape')
      await closed()
      expect(document.activeElement).toBe(trigger)
    })
  })

  describe('modal', () => {
    it('hides the page from assistive tech and locks its scroll while open', async () => {
      const { open, root } = renderDialog()
      open.value = true
      await opened()
      expect(root.getAttribute('aria-hidden')).toBe('true')
      expect(getComputedStyle(document.body).overflow).toBe('hidden')
      open.value = false
      await closed()
      expect(root.hasAttribute('aria-hidden')).toBe(false)
    })

    it('leaves the page alone when modal is false', async () => {
      const { open, root } = renderDialog({ modal: false })
      open.value = true
      await opened()
      expect(root.hasAttribute('aria-hidden')).toBe(false)
      expect(getComputedStyle(document.body).overflow).not.toBe('hidden')
    })
  })

  describe('sizes', () => {
    it.each([
      ['sm', 24],
      ['md', 32],
      ['lg', 48],
    ] as const)('sets the %s max width to %d rem', async (size, rem) => {
      const { open } = renderDialog({ content: { size } })
      open.value = true
      await opened()
      const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
      expect(parseFloat(getComputedStyle(dialog()!).maxWidth)).toBe(rem * rootSize)
    })

    it('defaults to md and merges class last', async () => {
      const { open } = renderDialog({ content: { class: 'max-w-md' } })
      open.value = true
      await opened()
      expect(dialog()!.className).toContain('rounded-dialog')
      expect(dialog()!.className).not.toContain('max-w-lg')
      expect(dialog()!.className.endsWith('max-w-md')).toBe(true)
    })

    it('fills the width less the page margin at 375 px', async () => {
      await page.viewport(375, 800)
      try {
        const { open } = renderDialog()
        open.value = true
        await opened()
        const margin = parseFloat(getComputedStyle(document.documentElement).fontSize)
        const box = dialog()!.getBoundingClientRect()
        expect(box.left).toBeCloseTo(margin, 0)
        expect(box.width).toBeCloseTo(375 - 2 * margin, 0)
      } finally {
        await page.viewport(1024, 800)
      }
    })
  })

  describe('title and description', () => {
    it('is named by its title and described by its description', async () => {
      const warn = vi.spyOn(console, 'warn')
      const { open } = renderDialog()
      open.value = true
      await opened()
      const labelledBy = dialog()!.getAttribute('aria-labelledby')!
      const describedBy = dialog()!.getAttribute('aria-describedby')!
      expect(document.getElementById(labelledBy)?.textContent).toBe('Rename project')
      expect(document.getElementById(describedBy)?.textContent).toBe('The URL does not change.')
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })

    it('has no aria-describedby and logs no warning without a description', async () => {
      const warn = vi.spyOn(console, 'warn')
      const { open } = renderDialog({ description: false })
      open.value = true
      await opened()
      expect(dialog()!.hasAttribute('aria-describedby')).toBe(false)
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })

    it('fails without a title: no accessible name, a warning, and an axe violation', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      render(() =>
        h(Dialog, { open: true }, () =>
          h(DialogContent, null, () => h('p', null, 'The URL does not change.')),
        ),
      )
      await opened()
      const labelledBy = dialog()!.getAttribute('aria-labelledby')
      expect(labelledBy && document.getElementById(labelledBy)).toBeFalsy()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('requires a `DialogTitle`'))
      await expect(expectNoAxeViolations()).rejects.toThrow('aria-dialog-name')
      warn.mockRestore()
    })
  })

  describe('close button', () => {
    it('is named Close by default and closes the dialog', async () => {
      const { open } = renderDialog()
      open.value = true
      await opened()
      await userEvent.click(button('Close')!)
      expect(open.value).toBe(false)
      await closed()
    })

    it('takes its name from closeLabel', async () => {
      const { open } = renderDialog({ content: { closeLabel: 'Dismiss' } })
      open.value = true
      await opened()
      expect(button('Dismiss')).toBeDefined()
      expect(button('Close')).toBeUndefined()
    })

    it('is removed by showClose false, and the header no longer makes room for it', async () => {
      const header = () => dialog()!.querySelector<HTMLElement>('[data-slot="dialog-header"]')!
      const padding = () => parseFloat(getComputedStyle(header()).paddingInlineEnd)
      const shown = renderDialog()
      shown.open.value = true
      await opened()
      expect(padding()).toBeGreaterThan(0)
      unmountAll()
      const { open } = renderDialog({ content: { showClose: false } })
      open.value = true
      await opened()
      expect(button('Close')).toBeUndefined()
      expect(padding()).toBe(0)
    })
  })

  describe('long content', () => {
    it('scrolls inside the dialog, which stays within the viewport', async () => {
      const { open } = renderDialog({
        body: () =>
          Array.from({ length: 60 }, (_, line) => h('p', null, `Line ${line + 1} of the terms.`)),
      })
      open.value = true
      await opened()
      const content = dialog()!
      const box = content.getBoundingClientRect()
      expect(box.top).toBeGreaterThanOrEqual(0)
      expect(box.bottom).toBeLessThanOrEqual(window.innerHeight)
      const scroller = [content, ...content.querySelectorAll<HTMLElement>('*')].find(
        (element) => element.scrollHeight > element.clientHeight,
      )!
      expect(scroller).toBeDefined()
      scroller.scrollTop = scroller.scrollHeight
      expect(scroller.scrollTop).toBeGreaterThan(0)
      // The close button stays in view while the content scrolls.
      const close = button('Close')!.getBoundingClientRect()
      expect(close.top).toBeGreaterThanOrEqual(box.top)
      expect(close.bottom).toBeLessThanOrEqual(box.top + box.height / 4)
      // Text scrolling under it is hidden, and it leaves the scrollbar free.
      expect(getComputedStyle(button('Close')!).backgroundColor).toBe(
        getComputedStyle(content).backgroundColor,
      )
      const gutter = scroller.offsetWidth - scroller.clientWidth
      expect(box.right - close.right).toBeGreaterThanOrEqual(gutter)
    })

    it('focuses the dialog itself, at the top of its content, when opened by keyboard', async () => {
      renderDialog({
        body: () =>
          Array.from({ length: 60 }, (_, line) => h('p', null, `Line ${line + 1} of the terms.`)),
      })
      await tab()
      await press('Enter')
      await opened()
      expect(document.activeElement).toBe(dialog())
      const body = dialog()!.querySelector<HTMLElement>('[data-slot="dialog-body"]')!
      expect(body.scrollTop).toBe(0)
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)(
      'reports no violations in any %s demo state',
      async (mode) => {
        const root = await mountDemo('dialog', { mode })
        await opened()
        const triggers = [...root.querySelectorAll<HTMLElement>('button[aria-haspopup="dialog"]')]
        expect(triggers.length).toBe(7)
        for (const trigger of triggers) {
          if (!dialog()) {
            await userEvent.click(trigger)
            await opened()
          }
          await expectNoAxeViolations()
          // The first footer button is a DialogClose in every demo dialog, dismissible or not.
          await userEvent.click(dialog()!.querySelector('[data-slot="dialog-footer"] button')!)
          await closed()
        }
        // The closed state: only the trigger row.
        await expectNoAxeViolations()
      },
    )

    it('reports no violations at 375 px', async () => {
      await page.viewport(375, 800)
      try {
        await mountDemo('dialog')
        await opened()
        await expectNoAxeViolations()
      } finally {
        await page.viewport(1024, 800)
      }
    })
  })
})
