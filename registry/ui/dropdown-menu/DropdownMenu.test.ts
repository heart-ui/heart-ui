import { ConfigProvider } from 'reka-ui'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { fluent } from '../../lib/icon'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '.'

afterEach(unmountAll)

const settle = () => new Promise((resolve) => setTimeout(resolve, 50))
const fade = () => new Promise((resolve) => setTimeout(resolve, 400))
// The menu's own trigger, not a sub trigger (which also has aria-haspopup).
const trigger = () =>
  document.querySelector<HTMLElement>('[aria-haspopup="menu"]:not([role="menuitem"])')!
const draws = (element: Element | null, name: keyof typeof fluent) =>
  element?.querySelector('svg path')?.getAttribute('d') ===
  /d="([^"]+)"/.exec(fluent[name].body)![1]

function actions(handlers: Record<string, (event: Event) => void> = {}, rootProps = {}) {
  const open = ref(false)
  render(() =>
    h(
      DropdownMenu,
      {
        ...rootProps,
        open: open.value,
        'onUpdate:open': (next: boolean | undefined) => (open.value = !!next),
      },
      () => [
        h(DropdownMenuTrigger, null, () => 'Actions'),
        h(DropdownMenuContent, { class: 'part-content' }, () => [
          h(DropdownMenuLabel, { class: 'part-label' }, () => 'Project'),
          h(
            DropdownMenuItem,
            { onSelect: handlers.rename, class: 'part-item' },
            { default: () => 'Rename', leading: () => h('span', 'R'), trailing: () => '⌘R' },
          ),
          h(DropdownMenuItem, { disabled: true }, () => 'Archive'),
          h(DropdownMenuItem, { onSelect: handlers.duplicate }, () => 'Duplicate'),
          h(DropdownMenuSeparator, { class: 'part-separator' }),
          h(DropdownMenuItem, { variant: 'danger', onSelect: handlers.remove }, () => 'Delete'),
        ]),
      ],
    ),
  )
  return { open }
}

describe('DropdownMenu', () => {
  describe('opening and choosing', () => {
    it('opens on click, emits select on a chosen item and closes', async () => {
      const rename = vi.fn()
      const { open } = actions({ rename })
      await userEvent.click(trigger())
      await settle()
      expect(open.value).toBe(true)
      await expect.element(page.getByRole('menu')).toBeVisible()
      await userEvent.click(page.getByRole('menuitem', { name: /Rename/ }))
      await settle()
      expect(rename).toHaveBeenCalledTimes(1)
      expect(open.value).toBe(false)
    })

    it('stays open when select is prevented', async () => {
      const { open } = actions({ rename: (event) => event.preventDefault() })
      await userEvent.click(trigger())
      await settle()
      await userEvent.click(page.getByRole('menuitem', { name: /Rename/ }))
      await settle()
      expect(open.value).toBe(true)
    })
  })

  describe('keyboard', () => {
    it('opens on Enter, skips disabled items, jumps by letters, closes on Escape', async () => {
      const duplicate = vi.fn()
      const { open } = actions({ duplicate })
      trigger().focus()
      await userEvent.keyboard('{Enter}')
      await settle()
      expect(document.activeElement?.textContent).toContain('Rename')
      await userEvent.keyboard('{ArrowDown}')
      expect(document.activeElement?.textContent).toContain('Duplicate')
      await userEvent.keyboard('d')
      expect(document.activeElement?.textContent).toContain('Delete')
      await userEvent.keyboard('{ArrowUp}{Enter}')
      await settle()
      expect(duplicate).toHaveBeenCalledTimes(1)
      trigger().focus()
      await userEvent.keyboard('{Enter}')
      await settle()
      await userEvent.keyboard('{Escape}')
      await settle()
      expect(open.value).toBe(false)
      expect(document.activeElement).toBe(trigger())
    })
  })

  describe('items', () => {
    it('gives a danger item the danger subtle colours', async () => {
      actions()
      await userEvent.click(trigger())
      await fade()
      const remove = page.getByRole('menuitem', { name: 'Delete' }).element()
      const rename = page.getByRole('menuitem', { name: /Rename/ }).element()
      expect(getComputedStyle(remove).color).not.toBe(getComputedStyle(rename).color)
      expect(remove.classList.contains('text-danger-subtle-foreground')).toBe(true)
    })

    it('renders leading and trailing slots around the name, the leading one hidden', async () => {
      actions()
      await userEvent.click(trigger())
      await settle()
      const item = page.getByRole('menuitem', { name: /Rename/ }).element()
      const leading = item.querySelector('[data-slot="leading"]')!
      expect(leading.getAttribute('aria-hidden')).toBe('true')
      expect(item.textContent).toBe('RRename⌘R')
      expect(item.querySelector('[data-slot="trailing"]')!.textContent).toBe('⌘R')
    })

    it("can't choose a disabled item", async () => {
      const { open } = actions()
      await userEvent.click(trigger())
      await settle()
      const archive = page.getByRole('menuitem', { name: 'Archive' }).element()
      expect(archive.getAttribute('aria-disabled')).toBe('true')
      await userEvent.click(archive, { force: true })
      await settle()
      expect(open.value).toBe(true)
    })

    it('merges class last on each part', async () => {
      actions()
      await userEvent.click(trigger())
      await settle()
      for (const part of ['content', 'label', 'item', 'separator'])
        expect(document.querySelector(`.part-${part}`), part).not.toBeNull()
      expect(document.querySelector('.part-item')!.className.endsWith('part-item')).toBe(true)
    })
  })

  describe('checkbox and radio', () => {
    it('toggles a checkbox item and chooses a radio item', async () => {
      const grid = ref(true)
      const sort = ref('name')
      render(() =>
        h(DropdownMenu, null, () => [
          h(DropdownMenuTrigger, null, () => 'View'),
          h(DropdownMenuContent, null, () => [
            h(
              DropdownMenuCheckboxItem,
              {
                modelValue: grid.value,
                'onUpdate:modelValue': (next: boolean) => (grid.value = next),
              },
              () => 'Show grid',
            ),
            h(
              DropdownMenuRadioGroup,
              {
                modelValue: sort.value,
                'onUpdate:modelValue': (next: string | undefined) =>
                  (sort.value = next ?? sort.value),
              },
              () => [
                h(DropdownMenuRadioItem, { value: 'name' }, () => 'Name'),
                h(DropdownMenuRadioItem, { value: 'date' }, () => 'Date'),
              ],
            ),
          ]),
        ]),
      )
      await userEvent.click(trigger())
      await settle()
      const box = page.getByRole('menuitemcheckbox', { name: 'Show grid' }).element()
      expect(box.getAttribute('aria-checked')).toBe('true')
      expect(draws(box, 'check')).toBe(true)
      await userEvent.click(box)
      expect(grid.value).toBe(false)
      await userEvent.click(trigger())
      await settle()
      await userEvent.click(page.getByRole('menuitemradio', { name: 'Date' }))
      expect(sort.value).toBe('date')
      await userEvent.click(trigger())
      await settle()
      await expect
        .element(page.getByRole('menuitemradio', { name: 'Date' }))
        .toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('submenu', () => {
    function withSub(dir: 'ltr' | 'rtl') {
      render(() =>
        h(ConfigProvider, { dir }, () =>
          h(DropdownMenu, null, () => [
            h(DropdownMenuTrigger, null, () => 'Actions'),
            h(DropdownMenuContent, null, () => [
              h(DropdownMenuItem, null, () => 'Rename'),
              h(DropdownMenuSub, null, () => [
                h(DropdownMenuSubTrigger, null, () => 'Move to'),
                h(DropdownMenuSubContent, null, () => [
                  h(DropdownMenuItem, null, () => 'Archive'),
                  h(DropdownMenuItem, null, () => 'Trash'),
                ]),
              ]),
            ]),
          ]),
        ),
      )
    }

    it('opens with ArrowRight and closes with ArrowLeft', async () => {
      withSub('ltr')
      trigger().focus()
      await userEvent.keyboard('{Enter}')
      await settle()
      await userEvent.keyboard('{ArrowDown}{ArrowRight}')
      await settle()
      expect(document.activeElement?.textContent).toBe('Archive')
      await userEvent.keyboard('{ArrowLeft}')
      await settle()
      expect(document.activeElement?.textContent).toContain('Move to')
      await expect.poll(() => page.getByRole('menuitem', { name: 'Archive' }).query()).toBeNull()
    })

    it.each([
      ['ltr', 'chevron-right'],
      ['rtl', 'chevron-left'],
    ] as const)(
      'points the sub trigger’s chevron where the submenu opens (%s)',
      async (dir, icon) => {
        withSub(dir)
        await userEvent.click(trigger())
        await settle()
        expect(draws(page.getByRole('menuitem', { name: 'Move to' }).element(), icon)).toBe(true)
      },
    )
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)(
      'reports no violations in the %s demo, closed and with the menu open',
      async (mode) => {
        await mountDemo('dropdown-menu', { mode })
        await fade()
        await expectNoAxeViolations()
        await userEvent.click(page.getByRole('button', { name: 'Project actions' }))
        await fade()
        page.getByRole('menuitem', { name: 'Move to' }).element().focus()
        await userEvent.keyboard('{ArrowRight}')
        await fade()
        for (const menu of document.querySelectorAll('[role="menu"]'))
          await expectNoAxeViolations(menu)
        await userEvent.keyboard('{Escape}{Escape}')
        await fade()
        await userEvent.click(page.getByRole('button', { name: 'View' }))
        await fade()
        await expectNoAxeViolations(document.querySelector('[role="menu"]')!)
      },
    )
  })

  describe('checkbox and radio', () => {
    function view(label: 'inside' | 'outside' | 'aria') {
      const items = () => [
        h(DropdownMenuRadioItem, { value: 'name' }, () => 'Name'),
        h(DropdownMenuRadioItem, { value: 'date', disabled: true }, () => 'Date'),
      ]
      render(() =>
        h(DropdownMenu, { defaultOpen: true }, () => [
          h(DropdownMenuTrigger, null, () => 'View'),
          h(DropdownMenuContent, null, () => [
            h(DropdownMenuCheckboxItem, { disabled: true }, () => 'Show grid'),
            label === 'outside' ? h(DropdownMenuLabel, null, () => 'Sort by') : null,
            h(
              DropdownMenuRadioGroup,
              {
                modelValue: 'name',
                class: 'part-radio-group',
                ...(label === 'aria' ? { 'aria-label': 'Sort by' } : {}),
              },
              () => [
                label === 'inside' ? h(DropdownMenuLabel, null, () => 'Sort by') : null,
                ...items(),
              ],
            ),
          ]),
        ]),
      )
    }

    it('names a radio group by a label inside it, or by aria-label', async () => {
      view('inside')
      await settle()
      await expect.element(page.getByRole('group', { name: 'Sort by' })).toBeVisible()
      unmountAll()
      view('aria')
      await settle()
      await expect.element(page.getByRole('group', { name: 'Sort by' })).toBeVisible()
    })

    it('drops the dangling aria-labelledby when the label sits outside the group', async () => {
      view('outside')
      await settle()
      expect(document.querySelector('.part-radio-group')!.hasAttribute('aria-labelledby')).toBe(
        false,
      )
    })

    it('keeps a caller’s aria-labelledby when no label sits inside', async () => {
      render(() =>
        h(DropdownMenu, { defaultOpen: true }, () => [
          h(DropdownMenuTrigger, null, () => 'View'),
          h(DropdownMenuContent, null, () => [
            h('div', { id: 'sort-heading' }, 'Sort by'),
            h(DropdownMenuRadioGroup, { 'aria-labelledby': 'sort-heading' }, () => [
              h(DropdownMenuRadioItem, { value: 'name' }, () => 'Name'),
            ]),
          ]),
        ]),
      )
      await settle()
      await expect.element(page.getByRole('group', { name: 'Sort by' })).toBeVisible()
    })

    it('lets a caller’s style set a lower max height', async () => {
      render(() =>
        h(DropdownMenu, { defaultOpen: true }, () => [
          h(DropdownMenuTrigger, null, () => 'View'),
          h(DropdownMenuContent, { style: { maxHeight: 'var(--h-control-lg)' } }, () =>
            Array.from({ length: 20 }, (_, index) =>
              h(DropdownMenuItem, null, () => `Item ${index}`),
            ),
          ),
        ]),
      )
      await settle()
      // One control tall, far below the room beside the trigger.
      expect(document.querySelector('[role="menu"]')!.getBoundingClientRect().height).toBeLessThan(
        60,
      )
    })

    it('marks indicators aria-hidden and skips disabled checkbox and radio items', async () => {
      view('inside')
      await settle()
      await expect
        .element(page.getByRole('menuitemcheckbox', { name: 'Show grid' }))
        .toHaveAttribute('aria-disabled', 'true')
      await expect
        .element(page.getByRole('menuitemradio', { name: 'Date' }))
        .toHaveAttribute('aria-disabled', 'true')
      const radio = page.getByRole('menuitemradio', { name: 'Name' }).element()
      expect(radio.querySelector('[aria-hidden="true"]')).not.toBeNull()
    })
  })

  describe('keyboard', () => {
    it.each(['{Enter}', ' ', '{ArrowDown}'])('opens on %s from the trigger', async (key) => {
      const { open } = actions()
      trigger().focus()
      await userEvent.keyboard(key)
      await settle()
      expect(open.value).toBe(true)
    })
  })

  describe('submenu', () => {
    it('opens with ArrowLeft and closes with ArrowRight in RTL', async () => {
      render(() =>
        h(ConfigProvider, { dir: 'rtl' }, () =>
          h(DropdownMenu, { defaultOpen: true }, () => [
            h(DropdownMenuTrigger, null, () => 'Actions'),
            h(DropdownMenuContent, null, () => [
              h(DropdownMenuSub, null, () => [
                h(DropdownMenuSubTrigger, { class: 'part-sub-trigger' }, () => 'Move to'),
                h(DropdownMenuSubContent, { class: 'part-sub-content' }, () => [
                  h(DropdownMenuItem, null, () => 'Archive'),
                ]),
              ]),
            ]),
          ]),
        ),
      )
      await settle()
      page.getByRole('menuitem', { name: 'Move to' }).element().focus()
      await userEvent.keyboard('{ArrowLeft}')
      await settle()
      expect(document.activeElement?.textContent).toBe('Archive')
      expect(document.querySelector('.part-sub-content')).not.toBeNull()
      expect(document.querySelector('.part-sub-trigger')).not.toBeNull()
      await userEvent.keyboard('{ArrowRight}')
      await settle()
      expect(document.activeElement?.textContent).toContain('Move to')
    })
  })

  describe('items', () => {
    it('caps the menu at the space beside the trigger and scrolls it', async () => {
      render(() =>
        h(DropdownMenu, { defaultOpen: true }, () => [
          h(DropdownMenuTrigger, null, () => 'Actions'),
          h(DropdownMenuContent, null, () =>
            Array.from({ length: 80 }, (_, index) =>
              h(DropdownMenuItem, null, () => `Action ${index}`),
            ),
          ),
        ]),
      )
      await settle()
      const menu = document.querySelector<HTMLElement>('[role="menu"]')!
      expect(menu.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight)
      expect(menu.scrollHeight).toBeGreaterThan(menu.clientHeight)
      expect(getComputedStyle(menu).overflowY).toBe('auto')
    })

    it('mutes the trailing hint with a disabled row', async () => {
      render(() =>
        h(DropdownMenu, { defaultOpen: true }, () => [
          h(DropdownMenuTrigger, null, () => 'Actions'),
          h(DropdownMenuContent, null, () => [
            h(DropdownMenuItem, null, { default: () => 'Rename', trailing: () => 'R' }),
            h(
              DropdownMenuItem,
              { disabled: true },
              { default: () => 'Export', trailing: () => 'E' },
            ),
          ]),
        ]),
      )
      await settle()
      const [enabled, disabled] = [...document.querySelectorAll('[data-slot="trailing"]')]
      expect(getComputedStyle(disabled!).color).not.toBe(getComputedStyle(enabled!).color)
      expect(getComputedStyle(disabled!).color).toBe(
        getComputedStyle(disabled!.closest('[role="menuitem"]')!).color,
      )
    })

    it('lets a caller’s side-offset win over the default', async () => {
      render(() =>
        h(DropdownMenu, { defaultOpen: true }, () => [
          h(DropdownMenuTrigger, null, () => 'Actions'),
          h(DropdownMenuContent, { sideOffset: 40 }, () => [h(DropdownMenuItem, null, () => 'A')]),
        ]),
      )
      await settle()
      const gap =
        document.querySelector('[role="menu"]')!.getBoundingClientRect().top -
        trigger().getBoundingClientRect().bottom
      expect(gap).toBeGreaterThan(30)
    })
  })
})
