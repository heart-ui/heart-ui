import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Toaster, toast, useToast } from '.'

afterEach(() => {
  toast.dismiss()
  unmountAll()
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** The colour a token utility resolves to, read from a probe element. */
function token(className: string, property: 'color' | 'backgroundColor' | 'borderTopColor') {
  const probe = document.createElement('span')
  probe.className = `border ${className}`
  document.body.append(probe)
  const value = getComputedStyle(probe)[property]
  probe.remove()
  return value
}

function toaster(props: Record<string, unknown> = {}) {
  render(() => h(Toaster, props))
}

const toasts = () => [...document.querySelectorAll<HTMLElement>('[data-slot="toast"]')]
const open = () => toasts().filter((element) => element.dataset.state === 'open')

describe('Toast', () => {
  describe('function', () => {
    it('shows a toast with its title and description in the region and returns its id', async () => {
      toaster()
      const id = toast({ title: 'Invoice sent', description: 'Ada will get it by email.' })
      expect(typeof id).toBe('string')
      const region = page.getByRole('region', { name: /Notifications/ })
      await expect.element(region.getByText('Invoice sent')).toBeVisible()
      await expect.element(region.getByText('Ada will get it by email.')).toBeVisible()
      const item = toasts()[0]!
      expect(item.querySelector('[data-slot="toast-title"]')!.textContent).toBe('Invoice sent')
    })

    it('shows a toast added before the Toaster mounts', async () => {
      toast({ title: 'Saved early' })
      toaster()
      await expect.element(page.getByText('Saved early')).toBeVisible()
    })

    it('dismisses one toast by id, or every toast', async () => {
      toaster()
      const first = toast({ title: 'First', duration: 0 })
      toast({ title: 'Second', duration: 0 })
      toast({ title: 'Third', duration: 0 })
      await expect.poll(() => open().length).toBe(3)
      toast.dismiss(first)
      await expect.poll(() => open().map((element) => element.textContent)).not.toContain('First')
      expect(open()).toHaveLength(2)
      toast.dismiss()
      await expect.poll(() => toasts().length).toBe(0)
    })

    it('replaces an open toast added again with its id', async () => {
      toaster()
      toast({ id: 'upload', title: 'Uploading', duration: 0 })
      await expect.element(page.getByText('Uploading')).toBeVisible()
      toast({ id: 'upload', title: 'Uploaded', duration: 0 })
      await expect.element(page.getByText('Uploaded')).toBeVisible()
      expect(open()).toHaveLength(1)
    })

    it('restarts the timer of a toast replaced by id', async () => {
      toaster({ duration: 400 })
      toast({ id: 'upload', title: 'Uploading' })
      await expect.poll(() => open().length).toBe(1)
      await wait(250)
      toast({ id: 'upload', title: 'Uploaded' })
      await wait(250)
      expect(open()).toHaveLength(1)
      await wait(400)
      expect(open()).toHaveLength(0)
    })

    it('useToast returns the same toast and dismiss', () => {
      const api = useToast()
      expect(api.toast).toBe(toast)
      expect(api.dismiss).toBe(toast.dismiss)
    })
  })

  describe('variants', () => {
    it.each([
      ['neutral', 'bg-surface-raised', 'text-foreground', 'border-border'],
      ['success', 'bg-success-subtle', 'text-success-subtle-foreground', 'border-success'],
      ['warning', 'bg-warning-subtle', 'text-warning-subtle-foreground', 'border-warning'],
      ['danger', 'bg-danger-subtle', 'text-danger-subtle-foreground', 'border-danger'],
      ['info', 'bg-info-subtle', 'text-info-subtle-foreground', 'border-info'],
    ] as const)(
      '%s sets its background, text and border',
      async (variant, background, text, border) => {
        toaster()
        toast({ title: variant, variant, duration: 0 })
        await expect.poll(() => toasts().length).toBe(1)
        const style = getComputedStyle(toasts()[0]!)
        expect(style.backgroundColor).toBe(token(background, 'backgroundColor'))
        expect(style.color).toBe(token(text, 'color'))
        expect(style.borderTopColor).toBe(token(border, 'borderTopColor'))
        expect(toasts()[0]!.dataset.variant).toBe(variant)
      },
    )

    it('defaults to neutral', async () => {
      toaster()
      toast({ title: 'Plain', duration: 0 })
      await expect.poll(() => toasts().length).toBe(1)
      expect(toasts()[0]!.dataset.variant).toBe('neutral')
    })

    it('forwards attributes to the toast list', () => {
      toaster({ id: 'toasts', 'data-testid': 'toaster' })
      const list = document.querySelector<HTMLElement>('[data-slot="toaster"]')!
      expect(list.id).toBe('toasts')
      expect(list.dataset.testid).toBe('toaster')
    })

    it('lets clicks through the list around its toasts', async () => {
      toaster()
      toast({ title: 'Saved', duration: 0 })
      await expect.poll(() => toasts().length).toBe(1)
      const list = document.querySelector<HTMLElement>('[data-slot="toaster"]')!
      expect(getComputedStyle(list).pointerEvents).toBe('none')
      expect(getComputedStyle(toasts()[0]!).pointerEvents).toBe('auto')
    })

    it('keeps many toasts on screen, the list scrolling', async () => {
      toaster()
      for (let index = 0; index < 14; index++) {
        toast({ title: `Toast ${index}`, description: 'A sentence more.', duration: 0 })
      }
      await expect.poll(() => open().length).toBe(14)
      const list = document.querySelector<HTMLElement>('[data-slot="toaster"]')!
      expect(list.getBoundingClientRect().top).toBeGreaterThanOrEqual(0)
      expect(list.scrollHeight).toBeGreaterThan(list.clientHeight)
      list.scrollTop = list.scrollHeight
      const bottom = list.scrollTop
      await userEvent.wheel(toasts().at(-1)!, { delta: { y: -200 } })
      await expect.poll(() => list.scrollTop).toBeLessThan(bottom)
      const first = toasts()[0]!
      first.focus()
      const box = first.getBoundingClientRect()
      expect(box.top).toBeGreaterThanOrEqual(0)
      expect(box.bottom).toBeLessThanOrEqual(window.innerHeight)
    })

    it('merges class last on the toast list', () => {
      toaster({ class: 'part-list' })
      const list = document.querySelector('[data-slot="toaster"]')!
      expect(list.className.endsWith('part-list')).toBe(true)
    })
  })

  describe('buttons', () => {
    it('renders one action that runs onClick and closes the toast', async () => {
      toaster()
      let clicks = 0
      toast({
        title: 'Invoice archived',
        duration: 0,
        action: { label: 'Undo', altText: 'Undo from the Archive page', onClick: () => clicks++ },
      })
      const undo = page.getByRole('button', { name: 'Undo' })
      await expect.element(undo).toBeVisible()
      expect(document.querySelectorAll('[data-slot="toast-action"]')).toHaveLength(1)
      await undo.click()
      expect(clicks).toBe(1)
      await expect.poll(() => open().length).toBe(0)
    })

    it('renders no action without one', async () => {
      toaster()
      toast({ title: 'Saved', duration: 0 })
      await expect.poll(() => toasts().length).toBe(1)
      expect(document.querySelector('[data-slot="toast-action"]')).toBeNull()
    })

    it('closes from the close button, named by closeLabel', async () => {
      toaster({ closeLabel: 'Dismiss' })
      toast({ title: 'Saved', duration: 0 })
      const close = page.getByRole('button', { name: 'Dismiss' })
      await expect.element(close).toBeVisible()
      expect(close.element().getAttribute('type')).toBe('button')
      await close.click()
      await expect.poll(() => open().length).toBe(0)
    })
  })

  describe('duration', () => {
    it("closes after the Toaster's duration", async () => {
      toaster({ duration: 200 })
      toast({ title: 'Quick' })
      await expect.poll(() => open().length).toBe(1)
      await wait(500)
      expect(open()).toHaveLength(0)
    })

    it("a toast's own duration wins", async () => {
      toaster({ duration: 60_000 })
      toast({ title: 'Own', duration: 200 })
      await expect.poll(() => open().length).toBe(1)
      await wait(500)
      expect(open()).toHaveLength(0)
    })

    it('stays open with a duration of 0', async () => {
      toaster({ duration: 200 })
      toast({ title: 'Sticky', duration: 0 })
      await expect.poll(() => open().length).toBe(1)
      await wait(500)
      expect(open()).toHaveLength(1)
    })

    it('stays open while focused', async () => {
      toaster({ duration: 300 })
      toast({ title: 'Focus me' })
      await expect.poll(() => open().length).toBe(1)
      open()[0]!.focus()
      await wait(700)
      expect(open()).toHaveLength(1)
    })

    it('keeps a toast added under a resting pointer open', async () => {
      toaster({ duration: 300 })
      toast({ title: 'Hovered', duration: 0 })
      await expect.poll(() => open().length).toBe(1)
      await userEvent.hover(toasts()[0]!)
      toast({ title: 'Added' })
      await expect.poll(() => open().length).toBe(2)
      await wait(800)
      expect(open()).toHaveLength(2)
    })

    it('pauses while the window is in the background', async () => {
      toaster({ duration: 300 })
      window.dispatchEvent(new FocusEvent('blur'))
      toast({ title: 'Export ready' })
      await expect.poll(() => open().length).toBe(1)
      await wait(800)
      expect(open()).toHaveLength(1)
      window.dispatchEvent(new FocusEvent('focus'))
      await expect.poll(() => open().length, { timeout: 1500 }).toBe(0)
    })

    it('times out the other toasts after Enter on a close button, once focus leaves', async () => {
      render(() => h('button', { type: 'button' }, 'Elsewhere'))
      toaster({ duration: 400, closeLabel: 'Dismiss' })
      toast({ title: 'Older' })
      await wait(50)
      toast({ title: 'Newer' })
      await expect.poll(() => open().length).toBe(2)
      open()
        .find((element) => element.textContent?.includes('Newer'))!
        .querySelector<HTMLElement>('[aria-label="Dismiss"]')!
        .focus()
      await userEvent.keyboard('{Enter}')
      await expect.poll(() => open().length).toBe(1)
      document.querySelector<HTMLElement>('button[type="button"]')!.focus()
      await expect.poll(() => open().length, { timeout: 1500 }).toBe(0)
    })

    it('stays open while hovered', async () => {
      toaster({ duration: 300 })
      toast({ title: 'Hover me' })
      await expect.poll(() => open().length).toBe(1)
      await userEvent.hover(toasts()[0]!)
      await wait(700)
      expect(open()).toHaveLength(1)
      await userEvent.unhover(toasts()[0]!)
      await expect.poll(() => open().length, { timeout: 1500 }).toBe(0)
    })
  })

  describe('keyboard and announcements', () => {
    it('closes only the focused toast on Escape, focus moving to the list', async () => {
      toaster()
      toast({ title: 'Older', duration: 0 })
      await expect.poll(() => open().length).toBe(1)
      await wait(50)
      toast({ title: 'Newer', duration: 0 })
      await expect.poll(() => open().length).toBe(2)
      open()
        .find((element) => element.textContent?.includes('Newer'))!
        .focus()
      await userEvent.keyboard('{Escape}')
      await expect
        .poll(() => open().map((element) => element.textContent))
        .toEqual([expect.stringContaining('Older')])
      expect(document.activeElement).toBe(document.querySelector('[data-slot="toaster"]'))
    })

    it('leaves the other toasts open on a second Escape, with focus on the list', async () => {
      toaster()
      toast({ title: 'Older', duration: 0 })
      await wait(50)
      toast({ title: 'Newer', duration: 0 })
      await expect.poll(() => open().length).toBe(2)
      open()
        .find((element) => element.textContent?.includes('Newer'))!
        .focus()
      await userEvent.keyboard('{Escape}')
      await expect.poll(() => open().length).toBe(1)
      let cancelled: boolean | undefined
      const watch = (event: KeyboardEvent) => (cancelled = event.defaultPrevented)
      window.addEventListener('keydown', watch)
      await userEvent.keyboard('{Escape}')
      window.removeEventListener('keydown', watch)
      await wait(100)
      expect(cancelled).toBe(true)
      expect(open()).toHaveLength(1)
    })

    it('times out the other toasts once focus leaves after an Escape', async () => {
      render(() => h('button', { type: 'button' }, 'Elsewhere'))
      toaster({ duration: 400 })
      toast({ title: 'Older' })
      await wait(50)
      toast({ title: 'Newer' })
      await expect.poll(() => open().length).toBe(2)
      open()
        .find((element) => element.textContent?.includes('Newer'))!
        .focus()
      await userEvent.keyboard('{Escape}')
      await expect.poll(() => open().length).toBe(1)
      document.querySelector<HTMLElement>('button[type="button"]')!.focus()
      await expect.poll(() => open().length, { timeout: 1500 }).toBe(0)
    })

    it('keeps a toast added while focus is on the list open', async () => {
      toaster({ duration: 300 })
      toast({ title: 'Older', duration: 0 })
      await wait(50)
      toast({ title: 'Newer', duration: 0 })
      await expect.poll(() => open().length).toBe(2)
      open()
        .find((element) => element.textContent?.includes('Newer'))!
        .focus()
      await userEvent.keyboard('{Escape}')
      await expect.poll(() => open().length).toBe(1)
      toast({ title: 'Added' })
      await expect.poll(() => open().length).toBe(2)
      await wait(800)
      expect(open()).toHaveLength(2)
    })

    it('times out a later toast after the rest close from code with focus on the list', async () => {
      render(() => h('button', { type: 'button' }, 'Elsewhere'))
      toaster({ duration: 300 })
      toast({ title: 'Older', duration: 0 })
      await wait(50)
      toast({ title: 'Newer', duration: 0 })
      await expect.poll(() => open().length).toBe(2)
      open()
        .find((element) => element.textContent?.includes('Newer'))!
        .focus()
      await userEvent.keyboard('{Escape}')
      await expect.poll(() => open().length).toBe(1)
      toast.dismiss()
      await expect.poll(() => toasts().length).toBe(0)
      document.querySelector<HTMLElement>('button[type="button"]')!.focus()
      toast({ title: 'Later' })
      await expect.poll(() => open().length).toBe(1)
      await expect.poll(() => open().length, { timeout: 1500 }).toBe(0)
    })

    it('pauses a toast added while focus is on the empty list, until focus leaves', async () => {
      render(() => h('button', { type: 'button' }, 'Elsewhere'))
      toaster({ duration: 300 })
      toast({ title: 'First', duration: 0 })
      await expect.poll(() => open().length).toBe(1)
      open()[0]!.focus()
      await userEvent.keyboard('{Escape}')
      await expect.poll(() => toasts().length).toBe(0)
      toast({ title: 'Added' })
      await expect.poll(() => open().length).toBe(1)
      await wait(800)
      expect(open()).toHaveLength(1)
      document.querySelector<HTMLElement>('button[type="button"]')!.focus()
      await expect.poll(() => open().length, { timeout: 1500 }).toBe(0)
    })

    it('times out later toasts after Escape closes the last one and focus moves on', async () => {
      render(() => h('button', { type: 'button' }, 'Elsewhere'))
      toaster({ duration: 200 })
      toast({ title: 'First', duration: 0 })
      await expect.poll(() => open().length).toBe(1)
      open()[0]!.focus()
      await userEvent.keyboard('{Escape}')
      await expect.poll(() => toasts().length).toBe(0)
      const list = document.querySelector<HTMLElement>('[data-slot="toaster"]')!
      expect(getComputedStyle(list).boxShadow).toBe('none')
      document.querySelector<HTMLElement>('button[type="button"]')!.focus()
      toast({ title: 'Second' })
      await expect.poll(() => open().length).toBe(1)
      await wait(600)
      expect(open()).toHaveLength(0)
    })

    it('never cancels an Escape pressed outside the toasts', async () => {
      render(() => h('button', { type: 'button' }, 'Elsewhere'))
      toaster()
      toast({ title: 'Saved', duration: 0 })
      await expect.poll(() => open().length).toBe(1)
      let cancelled: boolean | undefined
      const watch = (event: KeyboardEvent) => (cancelled = event.defaultPrevented)
      window.addEventListener('keydown', watch)
      document.querySelector<HTMLElement>('button[type="button"]')!.focus()
      await userEvent.keyboard('{Escape}')
      window.removeEventListener('keydown', watch)
      expect(cancelled).toBe(false)
    })

    it('names the region by regionLabel with its hotkey, and F8 focuses it', async () => {
      toaster({ regionLabel: 'Messages ({hotkey})' })
      toast({ title: 'Saved', duration: 0 })
      const region = page.getByRole('region', { name: 'Messages (F8)' })
      await expect.element(region).toBeInTheDocument()
      await userEvent.keyboard('{F8}')
      const list = document.querySelector<HTMLElement>('[data-slot="toaster"]')!
      expect(document.activeElement).toBe(list)
      expect(getComputedStyle(list).boxShadow).not.toBe('none')
      expect(region.element().contains(list)).toBe(true)
    })

    it('announces the toast text after announceLabel in a live region', async () => {
      toaster({ announceLabel: 'Update' })
      toast({ title: 'Invoice sent', description: 'By email.', duration: 0 })
      await expect
        .poll(() =>
          [...document.querySelectorAll('[aria-live]')].map((element) => element.textContent),
        )
        .toContainEqual(expect.stringMatching(/^Update Invoice sent.*By email\./))
    })

    it.each([
      ['neutral', 'polite'],
      ['success', 'polite'],
      ['info', 'polite'],
      ['warning', 'assertive'],
      ['danger', 'assertive'],
    ] as const)('announces a %s toast %sly', async (variant, live) => {
      toaster()
      toast({ title: `${variant} news`, variant, duration: 0 })
      await expect
        .poll(() =>
          [...document.querySelectorAll('[aria-live]')]
            .filter((element) => element.textContent?.includes(`${variant} news`))
            .map((element) => element.getAttribute('aria-live')),
        )
        .toEqual([live])
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)(
      'reports no violations with each variant open in %s',
      async (mode) => {
        await mountDemo('toast', { mode })
        for (const variant of ['neutral', 'success', 'warning', 'danger', 'info'] as const) {
          toast({
            title: `${variant} title`,
            description: 'A sentence more.',
            variant,
            duration: 0,
            action: { label: 'Undo', altText: 'Undo from the Archive page', onClick: () => {} },
          })
        }
        await expect.poll(() => open().length).toBe(5)
        await wait(400)
        await expectNoAxeViolations()
      },
    )
  })
})
