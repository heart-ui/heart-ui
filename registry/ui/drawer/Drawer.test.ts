import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h, nextTick, ref, type VNodeChild } from 'vue'
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '.'

// Wider than every side drawer size, so the overlay shows beside the panel.
beforeEach(() => page.viewport(1024, 800))

afterEach(() => {
  unmountAll()
  document.documentElement.removeAttribute('dir')
})

type Options = {
  modal?: boolean
  content?: Record<string, unknown>
  description?: boolean
  body?: () => VNodeChild
}

// The usage example from drawer.md, with the open state exposed to the test.
function renderDrawer({ modal, content = {}, description = true, body }: Options = {}) {
  const open = ref(false)
  const root = render(() =>
    h(
      Drawer,
      {
        open: open.value,
        'onUpdate:open': (value: boolean) => (open.value = value),
        ...(modal === undefined ? {} : { modal }),
      },
      () => [
        h(DrawerTrigger, { asChild: true }, () => h(Button, null, () => 'Edit')),
        h(DrawerContent, content, () => [
          h(DrawerHeader, null, () => [
            h(DrawerTitle, null, () => 'Edit invoice'),
            description
              ? h(DrawerDescription, null, () => 'Changes save when you press Save.')
              : null,
          ]),
          body ? body() : h('input', { 'aria-label': 'Customer' }),
          h(DrawerFooter, null, () => [
            h(DrawerClose, { asChild: true }, () =>
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

async function openDrawer(options: Options = {}) {
  const result = renderDrawer(options)
  result.open.value = true
  await opened()
  return result
}

const panel = () => document.querySelector<HTMLElement>('[role="dialog"]')
const overlay = () => document.querySelector<HTMLElement>('[data-slot="drawer-overlay"]')
const button = (name: string) =>
  [...panel()!.querySelectorAll('button')].find(
    (element) => element.getAttribute('aria-label') === name || element.textContent === name,
  )
const lines = (count: number) => () =>
  Array.from({ length: count }, (_, line) => h('p', null, `Line ${line + 1} of the history.`))
const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize)

// Waits for the enter animation so styles and positions are final. Only the drawer's own: a
// button's hover transition, started by a pointer an earlier test left behind, can be cancelled.
async function opened() {
  await vi.waitFor(() => expect(panel()).not.toBeNull())
  const animations = [panel()!, overlay()].flatMap((element) => element?.getAnimations() ?? [])
  await Promise.all(animations.map((animation) => animation.finished))
}

const closed = () => vi.waitFor(() => expect(panel()).toBeNull())

// Longer than --h-duration-normal, so any late animation or event has run.
const settle = () => new Promise((resolve) => setTimeout(resolve, 400))

async function clickOutside(side: 'start' | 'end' | 'bottom' = 'end') {
  // The corner away from the panel: top left for end and bottom in left-to-right text.
  const x = side === 'start' ? window.innerWidth - 4 : 4
  await userEvent.click(overlay()!, { position: { x, y: 4 } })
}

describe('Drawer', () => {
  describe('open and close', () => {
    it('opens from the trigger and closes from DrawerClose, updating v-model', async () => {
      const { open, trigger } = renderDrawer()
      expect(panel()).toBeNull()
      await userEvent.click(trigger)
      await opened()
      expect(open.value).toBe(true)
      await userEvent.click(button('Cancel')!)
      expect(open.value).toBe(false)
      await closed()
    })

    it('follows v-model:open set from outside', async () => {
      const { open } = await openDrawer()
      open.value = false
      await closed()
    })

    it('closes on Escape and on a click on the overlay', async () => {
      const first = await openDrawer()
      await press('Escape')
      expect(first.open.value).toBe(false)
      await closed()
      first.open.value = true
      await opened()
      await clickOutside()
      expect(first.open.value).toBe(false)
      await closed()
    })

    it('emits close once, after the panel is gone', async () => {
      const present: boolean[] = []
      const { open } = await openDrawer({
        content: { onClose: () => present.push(panel() !== null) },
      })
      expect(present).toEqual([])
      open.value = false
      await closed()
      await vi.waitFor(() => expect(present).toEqual([false]))
      await settle()
      expect(present).toEqual([false])
    })

    it('does not emit close when the drawer is torn down while open', async () => {
      const onClose = vi.fn()
      const shown = ref(true)
      render(() =>
        shown.value
          ? h(Drawer, { open: true }, () =>
              h(DrawerContent, { onClose }, () => h(DrawerTitle, null, () => 'Edit invoice')),
            )
          : h('p', null, 'Gone'),
      )
      await opened()
      shown.value = false
      await settle()
      expect(onClose).not.toHaveBeenCalled()
    })

    it('is named by its title and described by its description', async () => {
      const warn = vi.spyOn(console, 'warn')
      await openDrawer()
      const labelledBy = panel()!.getAttribute('aria-labelledby')!
      const describedBy = panel()!.getAttribute('aria-describedby')!
      expect(document.getElementById(labelledBy)?.textContent).toBe('Edit invoice')
      expect(document.getElementById(describedBy)?.textContent).toBe(
        'Changes save when you press Save.',
      )
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })

    it('has no aria-describedby and logs no warning without a description', async () => {
      const warn = vi.spyOn(console, 'warn')
      await openDrawer({ description: false })
      expect(panel()!.hasAttribute('aria-describedby')).toBe(false)
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })

    it('fails without a title: no accessible name, a warning, and an axe violation', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      render(() =>
        h(Drawer, { open: true }, () =>
          h(DrawerContent, null, () => h('p', null, 'Changes save when you press Save.')),
        ),
      )
      await opened()
      const labelledBy = panel()!.getAttribute('aria-labelledby')
      expect(labelledBy && document.getElementById(labelledBy)).toBeFalsy()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('requires a `DialogTitle`'))
      await expect(expectNoAxeViolations()).rejects.toThrow('aria-dialog-name')
      warn.mockRestore()
    })
  })

  describe('dismiss and close button', () => {
    it('stays open on Escape and a click outside when not dismissible', async () => {
      const { open } = await openDrawer({ content: { dismissible: false } })
      await press('Escape')
      await clickOutside()
      await nextTick()
      expect(open.value).toBe(true)
      expect(panel()).not.toBeNull()
    })

    it('has a close button named Close by default that closes the drawer', async () => {
      const { open } = await openDrawer()
      await userEvent.click(button('Close')!)
      expect(open.value).toBe(false)
      await closed()
    })

    it('takes the close button name from closeLabel', async () => {
      await openDrawer({ content: { closeLabel: 'Dismiss' } })
      expect(button('Dismiss')).toBeDefined()
      expect(button('Close')).toBeUndefined()
    })

    it('removes the close button with showClose false, and the header no longer makes room', async () => {
      const header = () => panel()!.querySelector<HTMLElement>('[data-slot="drawer-header"]')!
      const padding = () => parseFloat(getComputedStyle(header()).paddingInlineEnd)
      await openDrawer()
      expect(padding()).toBeGreaterThan(0)
      unmountAll()
      await openDrawer({ content: { showClose: false } })
      expect(button('Close')).toBeUndefined()
      expect(padding()).toBe(0)
    })
  })

  describe('focus and modal', () => {
    it('moves focus in on open, cycles with Tab and Shift+Tab, and returns it on close', async () => {
      const { trigger } = renderDrawer()
      await tab()
      expect(document.activeElement).toBe(trigger)
      await press('Enter')
      await opened()
      const focusables = [...panel()!.querySelectorAll<HTMLElement>('input, button')]
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

    it('hides the page from assistive tech and locks its scroll while open', async () => {
      const { open, root } = await openDrawer()
      expect(root.getAttribute('aria-hidden')).toBe('true')
      expect(getComputedStyle(document.body).overflow).toBe('hidden')
      open.value = false
      await closed()
      expect(root.hasAttribute('aria-hidden')).toBe(false)
    })

    it('leaves the page alone when modal is false', async () => {
      const { root } = await openDrawer({ modal: false })
      expect(root.hasAttribute('aria-hidden')).toBe(false)
      expect(getComputedStyle(document.body).overflow).not.toBe('hidden')
    })
  })

  describe('sides', () => {
    it('defaults to the end edge, full height', async () => {
      await openDrawer()
      const box = panel()!.getBoundingClientRect()
      expect(box.right).toBeCloseTo(window.innerWidth, 0)
      expect(box.top).toBeCloseTo(0, 0)
      expect(box.bottom).toBeCloseTo(window.innerHeight, 0)
      expect(box.width).toBeLessThan(window.innerWidth)
    })

    it('puts start against the start edge, full height', async () => {
      await openDrawer({ content: { side: 'start' } })
      const box = panel()!.getBoundingClientRect()
      expect(box.left).toBeCloseTo(0, 0)
      expect(box.top).toBeCloseTo(0, 0)
      expect(box.bottom).toBeCloseTo(window.innerHeight, 0)
    })

    it('puts bottom against the bottom edge, full width', async () => {
      await openDrawer({ content: { side: 'bottom' } })
      const box = panel()!.getBoundingClientRect()
      expect(box.left).toBeCloseTo(0, 0)
      expect(box.right).toBeCloseTo(window.innerWidth, 0)
      expect(box.bottom).toBeCloseTo(window.innerHeight, 0)
      expect(box.top).toBeGreaterThan(0)
    })

    it.each([
      ['start', 'right'],
      ['end', 'left'],
    ] as const)('puts %s against the %s edge in right-to-left text', async (side, edge) => {
      document.documentElement.dir = 'rtl'
      await openDrawer({ content: { side } })
      const box = panel()!.getBoundingClientRect()
      if (edge === 'right') expect(box.right).toBeCloseTo(window.innerWidth, 0)
      else expect(box.left).toBeCloseTo(0, 0)
    })
  })

  describe('slide', () => {
    // Where the panel sits at a point of its current animation, as a fraction of the duration.
    function at(animation: Animation, progress: number) {
      const duration = Number(animation.effect!.getComputedTiming().duration)
      animation.currentTime = duration * progress
      return panel()!.getBoundingClientRect()
    }

    // The panel moves through every point between its edges, rather than jumping at one.
    function expectGlides(boxes: DOMRect[]) {
      const axis = (box: DOMRect) => box.left + box.top
      const positions = boxes.map(axis)
      const ends = [positions[0]!, positions.at(-1)!]
      const [low, high] = [Math.min(...ends), Math.max(...ends)]
      expect(high - low).toBeGreaterThan(1)
      for (const position of positions.slice(1, -1)) {
        expect(position).toBeGreaterThan(low + 1)
        expect(position).toBeLessThan(high - 1)
      }
    }

    // The panel's own enter animation, paused at its first frame, a quarter, three quarters, and
    // its end.
    async function firstFrame(content: Record<string, unknown>) {
      renderDrawer({ content }).open.value = true
      await vi.waitFor(() => expect(panel()?.getAnimations().length).toBeGreaterThan(0))
      const [animation] = panel()!.getAnimations()
      animation!.pause()
      const boxes = [0, 0.25, 0.75, 1].map((progress) => at(animation!, progress))
      expectGlides(boxes)
      return { start: boxes[0]!, end: boxes.at(-1)! }
    }

    it.each(['start', 'end', 'bottom'] as const)(
      'slides a %s panel out through every point to beyond its edge',
      async (side) => {
        const { open } = await openDrawer({ content: { side } })
        open.value = false
        await vi.waitFor(() => expect(panel()?.dataset.state).toBe('closed'))
        const [animation] = panel()!.getAnimations()
        animation!.pause()
        expectGlides([0, 0.25, 0.75, 1].map((progress) => at(animation!, progress)))
        animation!.play()
        await closed()
      },
    )

    it('slides end in from beyond the right edge in left-to-right text', async () => {
      const { start, end } = await firstFrame({ side: 'end' })
      expect(start.left).toBeGreaterThanOrEqual(window.innerWidth - 1)
      expect(end.right).toBeCloseTo(window.innerWidth, 0)
    })

    it('slides start in from beyond the left edge in left-to-right text', async () => {
      const { start, end } = await firstFrame({ side: 'start' })
      expect(start.right).toBeLessThanOrEqual(1)
      expect(end.left).toBeCloseTo(0, 0)
    })

    it.each([
      ['start', 'right'],
      ['end', 'left'],
    ] as const)(
      'slides %s in from beyond the %s edge in right-to-left text',
      async (side, edge) => {
        document.documentElement.dir = 'rtl'
        const { start, end } = await firstFrame({ side })
        if (edge === 'right') {
          expect(start.left).toBeGreaterThanOrEqual(window.innerWidth - 1)
          expect(end.right).toBeCloseTo(window.innerWidth, 0)
        } else {
          expect(start.right).toBeLessThanOrEqual(1)
          expect(end.left).toBeCloseTo(0, 0)
        }
      },
    )

    it('slides bottom in from below the window', async () => {
      const { start, end } = await firstFrame({ side: 'bottom' })
      expect(start.top).toBeGreaterThanOrEqual(window.innerHeight - 1)
      expect(end.bottom).toBeCloseTo(window.innerHeight, 0)
    })
  })

  describe('sizes', () => {
    it.each([
      ['sm', 24],
      ['md', 32],
      ['lg', 48],
    ] as const)('sets the %s side max width to %d rem', async (size, width) => {
      await openDrawer({ content: { size } })
      expect(parseFloat(getComputedStyle(panel()!).maxWidth)).toBe(width * rem())
      expect(panel()!.getBoundingClientRect().width).toBeCloseTo(width * rem(), 0)
    })

    it.each([
      ['sm', 'a third', 1 / 3],
      ['md', 'a half', 1 / 2],
      ['lg', 'three quarters', 3 / 4],
    ] as const)('caps the %s bottom drawer at %s of the window height', async (size, _, share) => {
      await openDrawer({ content: { side: 'bottom', size }, body: lines(80) })
      expect(panel()!.getBoundingClientRect().height).toBeCloseTo(window.innerHeight * share, 0)
    })

    it('defaults to md and merges class last', async () => {
      await openDrawer({ content: { class: 'max-w-md' } })
      expect(panel()!.className).toContain('bg-surface-raised')
      expect(panel()!.className).not.toContain('max-w-lg')
      expect(panel()!.className.endsWith('max-w-md')).toBe(true)
    })

    it('takes a fixed width from class, such as the sidebar width', async () => {
      render(() => h('div', { 'data-probe': '', class: 'w-sidebar-width' }))
      const probe = document.querySelector<HTMLElement>('[data-probe]')!.offsetWidth
      expect(probe).toBeGreaterThan(0)
      await openDrawer({ content: { side: 'start', class: 'w-sidebar-width' } })
      expect(panel()!.getBoundingClientRect().width).toBeCloseTo(probe, 0)
    })

    // A classic scrollbar makes 100vw wider than the page beside it. The test browser hides
    // scrollbars, so a panel declared wider than the window stands in for one.
    it.each(['end', 'start'] as const)(
      'keeps a %s panel wider than the page within the page at 375 px',
      async (side) => {
        await page.viewport(375, 800)
        try {
          await openDrawer({
            modal: false,
            content: { side, style: { width: 'calc(100vw + var(--h-gap-md))' } },
          })
          const box = panel()!.getBoundingClientRect()
          expect(box.left).toBeGreaterThanOrEqual(-0.5)
          expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth + 0.5)
        } finally {
          await page.viewport(1024, 800)
        }
      },
    )

    it('fills the window width at 375 px', async () => {
      await page.viewport(375, 800)
      try {
        await openDrawer()
        const box = panel()!.getBoundingClientRect()
        expect(box.left).toBeCloseTo(0, 0)
        expect(box.width).toBeCloseTo(375, 0)
      } finally {
        await page.viewport(1024, 800)
      }
    })
  })

  describe('long content', () => {
    it.each(['end', 'bottom'] as const)(
      'scrolls inside the %s panel, which stays within the window, with the close button in its corner',
      async (side) => {
        await openDrawer({ content: { side }, body: lines(80) })
        const content = panel()!
        const box = content.getBoundingClientRect()
        expect(box.top).toBeGreaterThanOrEqual(0)
        expect(box.bottom).toBeLessThanOrEqual(window.innerHeight + 0.5)
        const body = content.querySelector<HTMLElement>('[data-slot="drawer-body"]')!
        expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
        body.scrollTop = body.scrollHeight
        expect(body.scrollTop).toBeGreaterThan(0)
        const close = button('Close')!.getBoundingClientRect()
        // An earlier test's click can leave the pointer on the button, showing its hover colour.
        await userEvent.hover(body)
        expect(close.top).toBeGreaterThanOrEqual(box.top)
        expect(close.bottom).toBeLessThanOrEqual(box.top + box.height / 4)
        await vi.waitFor(() =>
          expect(getComputedStyle(button('Close')!).backgroundColor).toBe(
            getComputedStyle(content).backgroundColor,
          ),
        )
        const gutter = body.offsetWidth - body.clientWidth
        expect(box.right - close.right).toBeGreaterThanOrEqual(gutter)
      },
    )

    it('keeps the footer at the bottom of a short side drawer', async () => {
      await openDrawer()
      const body = panel()!.querySelector<HTMLElement>('[data-slot="drawer-body"]')!
      const footer = panel()!.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!
      const inset = parseFloat(getComputedStyle(body).paddingBottom)
      expect(footer.getBoundingClientRect().bottom).toBeCloseTo(
        panel()!.getBoundingClientRect().bottom - inset,
        0,
      )
    })

    it('focuses the panel itself, at the top of its content, when opened by keyboard', async () => {
      renderDrawer({ body: lines(80) })
      await tab()
      await press('Enter')
      await opened()
      expect(document.activeElement).toBe(panel())
      const body = panel()!.querySelector<HTMLElement>('[data-slot="drawer-body"]')!
      expect(body.scrollTop).toBe(0)
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)(
      'reports no violations in any %s demo state',
      async (mode) => {
        const root = await mountDemo('drawer', { mode })
        await opened()
        const triggers = [...root.querySelectorAll<HTMLElement>('button[aria-haspopup="dialog"]')]
        expect(triggers.length).toBe(8)
        for (const trigger of triggers) {
          if (!panel()) {
            await userEvent.click(trigger)
            await opened()
          }
          await expectNoAxeViolations()
          // The first footer button is a DrawerClose in every demo drawer, dismissible or not.
          await userEvent.click(panel()!.querySelector('[data-slot="drawer-footer"] button')!)
          await closed()
        }
        // The closed state: only the trigger row.
        await expectNoAxeViolations()
      },
    )

    it.each([
      ['bottom sm', { side: 'bottom', size: 'sm' }, {}],
      ['bottom lg', { side: 'bottom', size: 'lg' }, {}],
      ['start, right to left', { side: 'start' }, { rtl: true }],
      ['non-modal', {}, { modal: false }],
    ] as const)('reports no violations for %s', async (_, content, extra) => {
      if ('rtl' in extra) document.documentElement.dir = 'rtl'
      await openDrawer({
        content: { ...content },
        ...('modal' in extra ? { modal: extra.modal } : {}),
      })
      await expectNoAxeViolations()
    })

    it('reports no violations at 375 px', async () => {
      await page.viewport(375, 800)
      try {
        await mountDemo('drawer')
        await opened()
        await expectNoAxeViolations()
      } finally {
        await page.viewport(1024, 800)
      }
    })
  })
})
