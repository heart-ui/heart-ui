import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  tab,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '.'

afterEach(unmountAll)

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function archive(content: Record<string, unknown> = {}, delayDuration = 0) {
  const open = ref(false)
  render(() =>
    h(TooltipProvider, { delayDuration }, () =>
      h('div', { class: 'flex justify-center p-24' }, [
        h(
          Tooltip,
          {
            open: open.value,
            'onUpdate:open': (next: boolean | undefined) => (open.value = !!next),
          },
          () => [
            h(TooltipTrigger, { 'aria-label': 'Archive' }, () => 'A'),
            h(TooltipContent, content, () => 'Archive this project'),
          ],
        ),
      ]),
    ),
  )
  const trigger = () => document.querySelector<HTMLElement>('button[aria-label="Archive"]')!
  const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]')
  return { open, trigger, tooltip }
}

describe('Tooltip', () => {
  describe('opening', () => {
    it('opens on hover after the delay and closes on leave', async () => {
      const { open, trigger } = archive({}, 300)
      await userEvent.hover(trigger())
      await wait(100)
      expect(open.value).toBe(false)
      await wait(400)
      expect(open.value).toBe(true)
      await expect.element(page.getByRole('tooltip')).toHaveTextContent('Archive this project')
      await userEvent.unhover(trigger())
      await wait(300)
      expect(open.value).toBe(false)
    })

    it.each([
      ['top', 'bottom'],
      ['bottom', 'top'],
    ] as const)('places the tooltip on side %s', async (side, opposite) => {
      const { trigger } = archive({ side })
      await userEvent.hover(trigger())
      await wait(100)
      const content = document.querySelector<HTMLElement>('[data-side]')!
      expect(content.dataset.side).toBe(side)
      const box = trigger().getBoundingClientRect()
      const tip = content.getBoundingClientRect()
      if (opposite === 'bottom') expect(tip.bottom).toBeLessThanOrEqual(box.top)
      else expect(tip.top).toBeGreaterThanOrEqual(box.bottom)
    })
  })

  describe('keyboard', () => {
    it('opens at once on keyboard focus and closes on Escape, focus staying put', async () => {
      const { open, trigger } = archive({}, 700)
      await tab()
      expect(document.activeElement).toBe(trigger())
      await wait(50)
      expect(open.value).toBe(true)
      await userEvent.keyboard('{Escape}')
      await wait(50)
      expect(open.value).toBe(false)
      expect(document.activeElement).toBe(trigger())
    })
  })

  describe('roles', () => {
    it('describes the trigger while open, and leaves its name alone', async () => {
      const { trigger, tooltip } = archive()
      await userEvent.hover(trigger())
      await wait(100)
      const id = trigger().getAttribute('aria-describedby')
      expect(id).toBeTruthy()
      expect(document.getElementById(id!)?.textContent).toContain('Archive this project')
      expect(tooltip()).not.toBeNull()
      await expect
        .element(page.getByRole('button', { name: 'Archive', exact: true }))
        .toHaveAccessibleDescription('Archive this project')
    })
  })

  describe('styles', () => {
    it('inverts the page colours and merges class last', async () => {
      const { trigger } = archive({ class: 'max-w-sm part-content' })
      await userEvent.hover(trigger())
      await wait(300)
      const content = document.querySelector<HTMLElement>('.part-content')!
      expect(content.className.endsWith('part-content')).toBe(true)
      expect(content.classList.contains('max-w-xs')).toBe(false)
      const page$ = getComputedStyle(document.body)
      expect(getComputedStyle(content).backgroundColor).toBe(page$.color)
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)(
      'reports no violations in the %s demo, closed and with a tooltip open',
      async (mode) => {
        await mountDemo('tooltip', { mode })
        await wait(100)
        await expectNoAxeViolations()
        await userEvent.hover(page.getByRole('button', { name: 'Search' }))
        await expect.element(page.getByRole('tooltip')).toBeInTheDocument()
        await wait(300)
        // The whole page, trigger included; `region` is off because the tooltip is portalled
        // outside the page's landmarks, as every overlay is.
        await expectNoAxeViolations(document.body, { skip: ['region'] })
      },
    )
  })

  describe('opening', () => {
    it.each(['left', 'right'] as const)('places the tooltip on side %s', async (side) => {
      const { trigger } = archive({ side })
      await userEvent.hover(trigger())
      await wait(100)
      const tip = document.querySelector('[data-side]')!.getBoundingClientRect()
      const box = trigger().getBoundingClientRect()
      if (side === 'left') expect(tip.right).toBeLessThanOrEqual(box.left)
      else expect(tip.left).toBeGreaterThanOrEqual(box.right)
    })

    it('opens when the parent sets v-model:open', async () => {
      const { open } = archive()
      open.value = true
      await expect.element(page.getByRole('tooltip')).toBeInTheDocument()
      open.value = false
      await expect.poll(() => document.querySelector('[role="tooltip"]')).toBeNull()
    })

    it('waits for a Tooltip’s own delay over the provider’s', async () => {
      render(() =>
        h(TooltipProvider, { delayDuration: 0 }, () =>
          h(Tooltip, { delayDuration: 500 }, () => [
            h(TooltipTrigger, { 'aria-label': 'Slow' }, () => 'S'),
            h(TooltipContent, null, () => 'Slow hint'),
          ]),
        ),
      )
      await userEvent.hover(page.getByRole('button', { name: 'Slow' }))
      await wait(400)
      expect(document.querySelector('[role="tooltip"]')).toBeNull()
      await expect.element(page.getByRole('tooltip')).toBeInTheDocument()
    })
  })

  describe('keyboard', () => {
    it('stays closed when a click elsewhere hands focus to the trigger by script', async () => {
      const { open, trigger } = archive()
      // As when a menu item chosen by mouse closes the menu and focus returns to its trigger.
      const elsewhere = document.createElement('button')
      elsewhere.textContent = 'Close menu'
      elsewhere.addEventListener('click', () => trigger().focus())
      document.body.append(elsewhere)
      await userEvent.click(elsewhere)
      await wait(100)
      expect(document.activeElement).toBe(trigger())
      expect(open.value).toBe(false)
    })
  })

  describe('roles', () => {
    it('drops aria-describedby once closed', async () => {
      const { open, trigger } = archive()
      await userEvent.hover(trigger())
      await wait(100)
      expect(trigger().hasAttribute('aria-describedby')).toBe(true)
      await userEvent.unhover(trigger())
      await expect.poll(() => open.value).toBe(false)
      await expect.poll(() => trigger().hasAttribute('aria-describedby')).toBe(false)
    })

    it("doesn't submit a form when clicked", async () => {
      let submitted = false
      render(() =>
        h(TooltipProvider, null, () =>
          h(
            'form',
            {
              onSubmit: (event: Event) => {
                event.preventDefault()
                submitted = true
              },
            },
            [
              h(Tooltip, null, () => [
                h(TooltipTrigger, { 'aria-label': 'Help' }, () => '?'),
                h(TooltipContent, null, () => 'What this field is for'),
              ]),
            ],
          ),
        ),
      )
      await userEvent.click(page.getByRole('button', { name: 'Help' }))
      expect(submitted).toBe(false)
    })
  })
})
