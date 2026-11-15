import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h, nextTick, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from '.'

afterEach(unmountAll)

const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

function countries(
  root: Record<string, unknown> = {},
  trigger: Record<string, unknown> = {},
  wrap?: (node: ReturnType<typeof h>) => ReturnType<typeof h>,
) {
  const value = ref<string | undefined>(root.modelValue as string | undefined)
  const open = ref(false)
  const select = () =>
    h(
      Select,
      {
        ...root,
        modelValue: value.value,
        'onUpdate:modelValue': (next: string | undefined) => (value.value = next),
        open: open.value,
        'onUpdate:open': (next: boolean | undefined) => (open.value = next ?? false),
      },
      () => [
        h(SelectTrigger, { 'aria-label': 'Country', placeholder: 'Choose a country', ...trigger }),
        h(SelectContent, null, () => [
          h(SelectGroup, null, () => [
            h(SelectLabel, null, () => 'Europe'),
            h(SelectItem, { value: 'de' }, () => 'Germany'),
            h(SelectItem, { value: 'fr', disabled: true }, () => 'France'),
            h(SelectItem, { value: 'it' }, () => 'Italy'),
          ]),
          h(SelectSeparator),
          h(SelectGroup, null, () => [
            h(SelectLabel, null, () => 'Asia'),
            h(SelectItem, { value: 'jp' }, () => 'Japan'),
          ]),
        ]),
      ],
    )
  const root$ = render(() => (wrap ? wrap(select()) : select()))
  const triggerEl = () => document.querySelector<HTMLElement>('[role="combobox"]')!
  return { value, open, root: root$, trigger: triggerEl }
}

describe('Select', () => {
  describe('choosing', () => {
    it('opens on click, chooses an item, closes and shows its text', async () => {
      const { value, open, trigger } = countries()
      expect(trigger().textContent).toContain('Choose a country')
      await userEvent.click(trigger())
      await settle()
      expect(open.value).toBe(true)
      await expect.element(page.getByRole('listbox')).toBeVisible()
      await userEvent.click(page.getByRole('option', { name: 'Italy' }))
      await settle()
      expect(value.value).toBe('it')
      expect(open.value).toBe(false)
      expect(trigger().textContent).toContain('Italy')
      expect(trigger().textContent).not.toContain('Choose a country')
    })
  })

  describe('keyboard', () => {
    it('opens with Enter, moves with arrows past disabled items, chooses with Enter', async () => {
      const { value, trigger } = countries({ modelValue: 'de' })
      trigger().focus()
      await userEvent.keyboard('{Enter}')
      await settle()
      await expect.element(page.getByRole('listbox')).toBeVisible()
      await userEvent.keyboard('{ArrowDown}')
      await userEvent.keyboard('{Enter}')
      await settle()
      // France is disabled, so the next item after Germany is Italy.
      expect(value.value).toBe('it')
    })

    it('jumps by typed letters', async () => {
      const { value, trigger } = countries({ modelValue: 'de' })
      trigger().focus()
      await userEvent.keyboard('{Enter}')
      await settle()
      await userEvent.keyboard('j')
      await userEvent.keyboard('{Enter}')
      await settle()
      expect(value.value).toBe('jp')
    })

    it('closes on Escape without choosing, and focus returns to the trigger', async () => {
      const { value, open, trigger } = countries({ modelValue: 'de' })
      trigger().focus()
      await userEvent.keyboard('{Enter}')
      await settle()
      await userEvent.keyboard('{ArrowDown}')
      await userEvent.keyboard('{Escape}')
      await settle()
      expect(open.value).toBe(false)
      expect(value.value).toBe('de')
      expect(document.activeElement).toBe(trigger())
    })
  })

  describe('trigger', () => {
    it.each([
      ['sm', 'h-control-sm', 'px-control-px-sm'],
      ['md', 'h-control-md', 'px-control-px-md'],
      ['lg', 'h-control-lg', 'px-control-px-lg'],
    ] as const)('renders size %s with input’s height and padding', (size, height, padding) => {
      const { trigger } = countries({}, { size })
      expect(trigger().classList.contains(height)).toBe(true)
      expect(trigger().classList.contains(padding)).toBe(true)
      expect(trigger().classList.contains('rounded-input')).toBe(true)
    })

    it('marks an invalid trigger with aria-invalid and the danger border', () => {
      const { trigger } = countries({}, { invalid: true })
      expect(trigger().getAttribute('aria-invalid')).toBe('true')
      expect(trigger().classList.contains('border-danger')).toBe(true)
    })

    it("doesn't open when disabled", async () => {
      const { open, trigger } = countries({ disabled: true })
      await userEvent.click(trigger(), { force: true })
      await settle()
      expect(open.value).toBe(false)
      expect(trigger().hasAttribute('disabled')).toBe(true)
    })

    it('passes trigger attributes to the button and merges class last', () => {
      const { trigger } = countries(
        {},
        { id: 'country', class: 'w-60', 'aria-describedby': 'help' },
      )
      expect(trigger().id).toBe('country')
      expect(trigger().getAttribute('aria-describedby')).toBe('help')
      expect(trigger().className.endsWith('w-60')).toBe(true)
    })

    it('is named by a label pointing at its id', async () => {
      render(() =>
        h('div', [
          h('label', { for: 'country' }, 'Country'),
          h(Select, null, () => [
            h(SelectTrigger, { id: 'country' }),
            h(SelectContent, null, () => [h(SelectItem, { value: 'de' }, () => 'Germany')]),
          ]),
        ]),
      )
      await expect.element(page.getByRole('combobox', { name: 'Country' })).toBeVisible()
    })
  })

  describe('trigger', () => {
    it('merges class last on every part', async () => {
      render(() =>
        h(Select, { defaultOpen: true }, () => [
          h(SelectTrigger, { 'aria-label': 'Country', class: 'part-trigger' }),
          h(SelectContent, { class: 'part-content' }, () => [
            h(SelectGroup, { class: 'part-group' }, () => [
              h(SelectLabel, { class: 'part-label' }, () => 'Europe'),
              h(SelectItem, { value: 'de', class: 'part-item' }, () => 'Germany'),
            ]),
            h(SelectSeparator, { class: 'part-separator' }),
          ]),
        ]),
      )
      await settle()
      for (const part of ['trigger', 'content', 'group', 'label', 'item', 'separator'])
        expect(document.querySelector(`.part-${part}`), part).not.toBeNull()
      expect(document.querySelector('.part-item')!.className.endsWith('part-item')).toBe(true)
    })
  })

  describe('roles', () => {
    it('shows scroll buttons when the list is taller than the viewport', async () => {
      render(() =>
        h(Select, { defaultOpen: true, modelValue: 'zone-0' }, () => [
          h(SelectTrigger, { 'aria-label': 'Time zone' }),
          h(SelectContent, null, () =>
            Array.from({ length: 80 }, (_, index) =>
              h(SelectItem, { value: `zone-${index}` }, () => `Zone ${index}`),
            ),
          ),
        ]),
      )
      // Reka renders the scroll-down button only while the list can scroll further down.
      await expect
        .poll(() => document.querySelector('[data-slot="select-scroll-down"]'))
        .not.toBeNull()
      expect(document.querySelector('[data-slot="select-scroll-down"] svg')).not.toBeNull()
    })

    it('exposes a combobox, a listbox of options, the chosen one marked, and labelled groups', async () => {
      const { trigger } = countries({ modelValue: 'it' })
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      await userEvent.click(trigger())
      await settle()
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      const italy = page.getByRole('option', { name: 'Italy' })
      await expect.element(italy).toHaveAttribute('aria-selected', 'true')
      expect(italy.element().querySelector('svg')).not.toBeNull()
      expect(
        page.getByRole('option', { name: 'Germany' }).element().querySelector('svg'),
      ).toBeNull()
      await expect.element(page.getByRole('group', { name: 'Europe' })).toBeVisible()
      expect(document.querySelectorAll('[data-slot="select-separator"]')).toHaveLength(1)
    })
  })

  describe('forms', () => {
    const inForm = (node: ReturnType<typeof h>) =>
      h('form', { class: 'flex flex-col gap-4' }, [h('label', 'Country'), node])

    it('fires no form events when the chosen item is picked again', async () => {
      const { root, trigger } = countries({ name: 'country', modelValue: 'it' }, {}, inForm)
      const events: string[] = []
      root.querySelector('form')!.addEventListener('change', () => events.push('change'))
      await userEvent.click(trigger())
      await settle()
      await userEvent.click(page.getByRole('option', { name: 'Italy' }))
      await settle()
      expect(events).toEqual([])
    })

    it('fires no form events when the parent rejects the choice', async () => {
      const root = render(() =>
        h('form', [
          h(Select, { name: 'country', modelValue: 'de', 'onUpdate:modelValue': () => {} }, () => [
            h(SelectTrigger, { 'aria-label': 'Country' }),
            h(SelectContent, null, () => [
              h(SelectItem, { value: 'de' }, () => 'Germany'),
              h(SelectItem, { value: 'it' }, () => 'Italy'),
            ]),
          ]),
        ]),
      )
      const events: string[] = []
      root.querySelector('form')!.addEventListener('change', () => events.push('change'))
      await userEvent.click(document.querySelector<HTMLElement>('[role="combobox"]')!)
      await settle()
      await userEvent.click(page.getByRole('option', { name: 'Italy' }))
      await settle()
      expect(events).toEqual([])
    })

    it('keeps the form in step with the shown choice after a form reset', async () => {
      const { root } = countries({ name: 'country', required: true, modelValue: 'it' }, {}, inForm)
      const form = root.querySelector('form')!
      form.reset()
      await settle()
      expect(new FormData(form).get('country')).toBe('it')
      expect(form.checkValidity()).toBe(true)
    })

    it.each([
      ['a column', inForm],
      [
        'a table cell',
        (node: ReturnType<typeof h>) =>
          h('form', [
            h('table', [h('tr', [h('td', 'Country'), h('td', { class: 'p-8' }, [node])])]),
          ]),
      ],
    ] as const)(
      'lays the form select over the trigger in %s, so a bubble points at it',
      (_, wrap) => {
        const { root, trigger } = countries({ name: 'country', required: true }, {}, wrap)
        const hidden = root.querySelector('select')!.getBoundingClientRect()
        const box = trigger().getBoundingClientRect()
        expect(Math.abs(hidden.top - box.top)).toBeLessThan(1)
        expect(Math.abs(hidden.left - box.left)).toBeLessThan(1)
      },
    )

    it('shows and submits nothing when the parent rejects the first choice', async () => {
      const root = render(() =>
        h('form', [
          h(
            Select,
            { name: 'country', modelValue: undefined, 'onUpdate:modelValue': () => {} },
            () => [
              h(SelectTrigger, { 'aria-label': 'Country', placeholder: 'Choose a country' }),
              h(SelectContent, null, () => [
                h(SelectItem, { value: 'de' }, () => 'Germany'),
                h(SelectItem, { value: 'it' }, () => 'Italy'),
              ]),
            ],
          ),
        ]),
      )
      const trigger = document.querySelector<HTMLElement>('[role="combobox"]')!
      await userEvent.click(trigger)
      await settle()
      await userEvent.click(page.getByRole('option', { name: 'Italy' }))
      await settle()
      expect(trigger.textContent).toContain('Choose a country')
      expect(new FormData(root.querySelector('form')!).get('country') ?? '').toBe('')
    })

    it('lists every option in the form select, so browser autofill can choose one', async () => {
      const { value, root } = countries({ name: 'country', autocomplete: 'country' }, {}, inForm)
      await settle()
      const select = root.querySelector('select')!
      const options = [...select.options].map((option) => option.value)
      expect(options).toEqual(expect.arrayContaining(['de', 'fr', 'it', 'jp']))
      // Autofill sets the native value and fires input.
      select.value = 'jp'
      select.dispatchEvent(new Event('input', { bubbles: true }))
      await settle()
      expect(value.value).toBe('jp')
    })

    it('passes autocomplete to the form select', () => {
      const { root } = countries({ name: 'country', autocomplete: 'country' }, {}, inForm)
      expect(root.querySelector('select')!.getAttribute('autocomplete')).toBe('country')
    })

    it('leaves a disabled trigger’s value out of the form and of validation', () => {
      const { root } = countries({ name: 'country', required: true }, { disabled: true }, inForm)
      const form = root.querySelector('form')!
      expect(form.checkValidity()).toBe(true)
      expect(root.querySelector('select')!.disabled).toBe(true)
    })

    it('submits the chosen value, and required blocks submit until one is chosen', async () => {
      const { value, root } = countries({ name: 'country', required: true }, {}, (node) =>
        h('form', [node]),
      )
      const form = root.querySelector('form')!
      expect(form.checkValidity()).toBe(false)
      value.value = 'jp'
      await nextTick()
      await settle()
      expect(form.checkValidity()).toBe(true)
      expect(new FormData(form).get('country')).toBe('jp')
    })

    it('fires input and change when the user chooses, and not when code sets the value', async () => {
      const { value, root, trigger } = countries({ name: 'country' }, {}, (node) =>
        h('form', [node]),
      )
      const form = root.querySelector('form')!
      const events: string[] = []
      form.addEventListener('input', () => events.push('input'))
      form.addEventListener('change', () => events.push('change'))
      value.value = 'de'
      await nextTick()
      await settle()
      expect(events).toEqual([])
      await userEvent.click(trigger())
      await settle()
      await userEvent.click(page.getByRole('option', { name: 'Italy' }))
      await settle()
      expect(events).toEqual(['input', 'change'])
      expect(new FormData(form).get('country')).toBe('it')
    })

    it('leaves focus on the trigger when form validation fails', async () => {
      const { root, trigger } = countries({ name: 'country', required: true }, {}, (node) =>
        h('form', [node]),
      )
      root.querySelector('form')!.reportValidity()
      await settle()
      expect(document.activeElement).toBe(trigger())
    })
  })

  describe('axe', () => {
    // An open list hides the page from assistive tech (the modal listbox pattern), so the page is
    // checked with the list closed and the list on its own; after the fade, at full opacity.
    const fade = () => new Promise((resolve) => setTimeout(resolve, 400))
    it.each(['light', 'dark'] as const)(
      'reports no violations in the %s demo, closed and open',
      async (mode) => {
        await mountDemo('select', { mode })
        await fade()
        expect(document.querySelector('[role="listbox"]')).toBeNull()
        await expectNoAxeViolations()
        await userEvent.click(page.getByRole('combobox', { name: 'Role' }))
        await fade()
        await expectNoAxeViolations(document.querySelector('[role="listbox"]')!)
      },
    )
  })
})
