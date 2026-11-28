import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h, ref, type VNode } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
} from '.'

afterEach(unmountAll)

const settle = () => new Promise((resolve) => setTimeout(resolve, 80))

const field = () => document.querySelector<HTMLInputElement>('input[role="combobox"]')!
const box = () => document.querySelector<HTMLElement>('[data-slot="combobox-input"]')!
const toggle = () => page.getByRole('button', { name: 'Show options' })
const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]')
const visibleOptions = () =>
  [...document.querySelectorAll<HTMLElement>('[role="option"]')]
    .filter((option) => option.offsetParent !== null)
    .map((option) => option.textContent?.trim())

function countries(
  root: Record<string, unknown> = {},
  input: Record<string, unknown> = {},
  wrap?: (node: VNode) => VNode,
) {
  const value = ref<string | undefined>(root.modelValue as string | undefined)
  const open = ref(false)
  const combobox = () =>
    h(
      Combobox,
      {
        ...root,
        modelValue: value.value,
        'onUpdate:modelValue': (next: string | undefined) => (value.value = next),
        open: open.value,
        'onUpdate:open': (next: boolean | undefined) => (open.value = next ?? false),
      },
      () => [
        h(ComboboxInput, { 'aria-label': 'Country', placeholder: 'Search countries', ...input }),
        h(ComboboxContent, null, () => [
          h(ComboboxGroup, { heading: 'Europe' }, () => [
            h(ComboboxItem, { value: 'de' }, () => 'Germany'),
            h(ComboboxItem, { value: 'fr', disabled: true }, () => 'France'),
            h(ComboboxItem, { value: 'it' }, () => 'Italy'),
          ]),
          h(ComboboxGroup, { heading: 'Africa' }, () => [
            h(ComboboxItem, { value: 'ci' }, () => 'Côte d’Ivoire'),
          ]),
          h(ComboboxGroup, { heading: 'Asia' }, () => [
            h(ComboboxItem, { value: 'jp' }, () => 'Japan'),
          ]),
          h(ComboboxEmpty, null, () => 'No country matches.'),
        ]),
      ],
    )
  render(() => (wrap ? wrap(combobox()) : combobox()))
  return { value, open }
}

async function type(text: string) {
  field().focus()
  await userEvent.keyboard(text)
  await settle()
}

describe('Combobox', () => {
  describe('choosing', () => {
    it('opens from the toggle, chooses an option by pointer, closes and shows its text', async () => {
      const { value, open } = countries()
      await userEvent.click(toggle())
      await settle()
      expect(open.value).toBe(true)
      await expect.element(page.getByRole('listbox')).toBeVisible()
      await userEvent.click(page.getByRole('option', { name: 'Italy' }))
      await settle()
      expect(value.value).toBe('it')
      expect(open.value).toBe(false)
      expect(field().value).toBe('Italy')
    })

    it('shows the text of a value chosen before the list ever opened', async () => {
      countries({ modelValue: 'de' })
      await settle()
      expect(field().value).toBe('Germany')
    })

    it('shows the new text when the value changes in code', async () => {
      const { value } = countries({ modelValue: 'de' })
      await settle()
      value.value = 'jp'
      await settle()
      expect(field().value).toBe('Japan')
    })
  })

  describe('filtering', () => {
    it('opens on typing and shows only items whose text contains it, ignoring case', async () => {
      const { open } = countries()
      await type('GER')
      expect(open.value).toBe(true)
      expect(visibleOptions()).toEqual(['Germany'])
    })

    it('matches across accents and hides groups with no match', async () => {
      countries()
      await type('cote')
      expect(visibleOptions()).toEqual(['Côte d’Ivoire'])
      expect(page.getByRole('group', { name: 'Africa' }).query()).not.toBeNull()
      expect(page.getByRole('group', { name: 'Europe' }).query()).toBeNull()
      expect(page.getByRole('group', { name: 'Asia' }).query()).toBeNull()
    })

    it('shows the empty message when nothing matches, and not while something does', async () => {
      countries()
      await type('ita')
      expect(page.getByText('No country matches.').query()).toBeNull()
      await type('xyz')
      expect(visibleOptions()).toEqual([])
      await expect.element(page.getByText('No country matches.')).toBeVisible()
    })

    it('puts the chosen text back when focus leaves without a choice', async () => {
      const { value, open } = countries({ modelValue: 'de' })
      await settle()
      field().select()
      await type('ita')
      await userEvent.keyboard('{Tab}')
      await settle()
      expect(open.value).toBe(false)
      expect(value.value).toBe('de')
      expect(field().value).toBe('Germany')
    })

    it('shows no text of its own when the empty part has no content', async () => {
      render(() =>
        h(Combobox, null, () => [
          h(ComboboxInput, { 'aria-label': 'Country' }),
          h(ComboboxContent, null, () => [
            h(ComboboxItem, { value: 'de' }, () => 'Germany'),
            h(ComboboxEmpty),
          ]),
        ]),
      )
      await type('zz')
      expect(listbox()!.innerText.trim()).toBe('')
    })
  })

  describe('filter off', () => {
    function people(initial: string[]) {
      const names = ref(initial)
      const query = ref('')
      render(() =>
        h(Combobox, { filter: false }, () => [
          h(ComboboxInput, {
            'aria-label': 'Assignee',
            modelValue: query.value,
            'onUpdate:modelValue': (next: string) => (query.value = next),
          }),
          h(ComboboxContent, null, () => [
            ...names.value.map((name) => h(ComboboxItem, { key: name, value: name }, () => name)),
            h(ComboboxEmpty, null, () => 'No one matches.'),
          ]),
        ]),
      )
      return { names, query }
    }

    it('keeps every item while typing and reports the typed text', async () => {
      const { query } = people(['Ana', 'Bao', 'Chi'])
      await type('zz')
      expect(query.value).toBe('zz')
      expect(visibleOptions()).toEqual(['Ana', 'Bao', 'Chi'])
      expect(page.getByText('No one matches.').query()).toBeNull()
    })

    it('shows the empty message only when the caller gives no items', async () => {
      const { names } = people(['Ana'])
      await type('q')
      expect(page.getByText('No one matches.').query()).toBeNull()
      names.value = []
      await settle()
      await expect.element(page.getByText('No one matches.')).toBeVisible()
    })

    it('highlights the first new result when the caller replaces the list while open', async () => {
      const { names } = people(['Ana', 'Bao'])
      await type('b')
      names.value = ['Bella', 'Binh']
      await settle()
      const active = field().getAttribute('aria-activedescendant')
      expect(active).toBe(page.getByRole('option', { name: 'Bella' }).element().id)
    })

    it('names no option when the caller empties the list while open', async () => {
      const { names } = people(['Ana', 'Bao'])
      await type('a')
      expect(field().hasAttribute('aria-activedescendant')).toBe(true)
      names.value = []
      await settle()
      expect(field().hasAttribute('aria-activedescendant')).toBe(false)
    })
  })

  describe('keyboard', () => {
    it('opens on ArrowDown, moves past disabled items, chooses with Enter', async () => {
      const { value, open } = countries()
      field().focus()
      await userEvent.keyboard('{ArrowDown}')
      await settle()
      expect(open.value).toBe(true)
      const highlighted = () =>
        document.getElementById(field().getAttribute('aria-activedescendant') ?? '')?.textContent
      expect(highlighted()).toContain('Germany')
      await userEvent.keyboard('{ArrowDown}')
      await settle()
      // France is disabled, so Italy follows Germany.
      expect(highlighted()).toContain('Italy')
      await userEvent.keyboard('{Enter}')
      await settle()
      expect(value.value).toBe('it')
      expect(open.value).toBe(false)
      expect(field().value).toBe('Italy')
    })

    it('highlights the last and first items with End and Home', async () => {
      countries()
      field().focus()
      await userEvent.keyboard('{ArrowDown}')
      await settle()
      const highlighted = () =>
        document.getElementById(field().getAttribute('aria-activedescendant') ?? '')?.textContent
      await userEvent.keyboard('{End}')
      await settle()
      expect(highlighted()).toContain('Japan')
      await userEvent.keyboard('{Home}')
      await settle()
      expect(highlighted()).toContain('Germany')
    })

    it('closes on Escape without choosing, with focus still in the field', async () => {
      const { value, open } = countries({ modelValue: 'de' })
      field().focus()
      await userEvent.keyboard('{ArrowDown}')
      await settle()
      await userEvent.keyboard('{ArrowDown}')
      await userEvent.keyboard('{Escape}')
      await settle()
      expect(open.value).toBe(false)
      expect(value.value).toBe('de')
      expect(document.activeElement).toBe(field())
    })

    it('closes when Tab leaves the field', async () => {
      const { open } = countries({}, {}, (node) => h('div', [node, h('button', 'Next')]))
      field().focus()
      await userEvent.keyboard('{ArrowDown}')
      await settle()
      expect(open.value).toBe(true)
      await userEvent.keyboard('{Tab}')
      await settle()
      expect(open.value).toBe(false)
      expect(document.activeElement?.textContent).toBe('Next')
    })

    it('leaves Enter to the form while the list is closed', async () => {
      let submitted = 0
      const { value } = countries({ name: 'country', modelValue: 'it' }, {}, (node) =>
        h(
          'form',
          {
            onSubmit: (event: Event) => {
              event.preventDefault()
              submitted++
            },
          },
          [node, h('button', { type: 'submit' }, 'Save')],
        ),
      )
      await settle()
      field().focus()
      await userEvent.keyboard('{Enter}')
      await settle()
      expect(value.value).toBe('it')
      expect(submitted).toBe(1)
    })

    it('has no active option while closed, after mount, Home or a choice', async () => {
      const { value } = countries({ modelValue: 'de' })
      await settle()
      expect(field().hasAttribute('aria-activedescendant')).toBe(false)
      field().focus()
      await userEvent.keyboard('{Home}')
      await userEvent.keyboard('{Enter}')
      await settle()
      expect(field().hasAttribute('aria-activedescendant')).toBe(false)
      await userEvent.keyboard('{ArrowDown}')
      await settle()
      await userEvent.keyboard('{End}')
      await userEvent.keyboard('{Enter}')
      await settle()
      expect(value.value).toBe('jp')
      expect(field().hasAttribute('aria-activedescendant')).toBe(false)
    })

    it('has no active option and keeps Enter from the form while nothing matches', async () => {
      let submitted = 0
      const { value, open } = countries({ name: 'country', modelValue: 'it' }, {}, (node) =>
        h(
          'form',
          {
            onSubmit: (event: Event) => {
              event.preventDefault()
              submitted++
            },
          },
          [node, h('button', { type: 'submit' }, 'Save')],
        ),
      )
      await settle()
      field().select()
      await type('g')
      expect(field().getAttribute('aria-activedescendant')).toBe(
        page.getByRole('option', { name: 'Germany' }).element().id,
      )
      await userEvent.keyboard('zz')
      await settle()
      expect(field().hasAttribute('aria-activedescendant')).toBe(false)
      await userEvent.keyboard('{Enter}')
      await settle()
      expect(submitted).toBe(0)
      expect(open.value).toBe(true)
      expect(value.value).toBe('it')
    })

    it('lets Ctrl+Enter reach the form while the list is open', async () => {
      const prevented: boolean[] = []
      countries({}, {}, (node) =>
        h('form', { onKeydown: (event: KeyboardEvent) => prevented.push(event.defaultPrevented) }, [
          node,
        ]),
      )
      field().focus()
      await userEvent.keyboard('{ArrowDown}')
      await settle()
      prevented.length = 0
      await userEvent.keyboard('{Control>}{Enter}{/Control}')
      await settle()
      expect(prevented.at(-1)).toBe(false)
    })
  })

  describe('roles', () => {
    it('exposes a combobox controlling a listbox of options, the chosen one marked', async () => {
      countries({ modelValue: 'it' })
      expect(field().getAttribute('aria-autocomplete')).toBe('list')
      expect(field().getAttribute('aria-expanded')).toBe('false')
      await userEvent.click(toggle())
      await settle()
      expect(field().getAttribute('aria-expanded')).toBe('true')
      expect(field().getAttribute('aria-controls')).toBe(listbox()!.id)
      const italy = page.getByRole('option', { name: 'Italy' }).element()
      expect(italy.getAttribute('aria-selected')).toBe('true')
      expect(italy.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
      const germany = page.getByRole('option', { name: 'Germany' }).element()
      expect(germany.getAttribute('aria-selected')).toBe('false')
      expect(germany.querySelector('svg')).toBeNull()
    })

    it('names each group by its heading', async () => {
      countries()
      await userEvent.click(toggle())
      await settle()
      const europe = page.getByRole('group', { name: 'Europe' }).element()
      expect(europe.textContent).toContain('Germany')
    })

    it('is named by a label pointing at its id', async () => {
      countries({}, { 'aria-label': undefined, id: 'country' }, (node) =>
        h('div', [h('label', { for: 'country' }, 'Country'), node]),
      )
      await expect.element(page.getByRole('combobox', { name: 'Country' })).toBeInTheDocument()
    })

    it('names the toggle by toggleLabel and keeps it out of the Tab order', async () => {
      countries({}, { toggleLabel: 'Show countries' })
      const button = page.getByRole('button', { name: 'Show countries' }).element()
      expect(button.getAttribute('tabindex')).toBe('-1')
      expect(page.getByRole('button', { name: 'Show options' }).query()).toBeNull()
    })
  })

  describe('input props', () => {
    it.each(['sm', 'md', 'lg'] as const)('matches the %s control height', async (size) => {
      countries({}, { size })
      const probe = document.createElement('div')
      probe.className = `h-control-${size}`
      document.body.append(probe)
      expect(box().getBoundingClientRect().height).toBe(probe.getBoundingClientRect().height)
    })

    it('marks an invalid field with aria-invalid and the danger border', () => {
      countries({}, { invalid: true })
      expect(field().getAttribute('aria-invalid')).toBe('true')
      const probe = document.createElement('div')
      probe.className = 'border border-danger'
      document.body.append(probe)
      expect(getComputedStyle(box()).borderTopColor).toBe(getComputedStyle(probe).borderTopColor)
    })

    it('disables the field and the toggle, and stays closed', async () => {
      const { open } = countries({ disabled: true })
      expect(field().disabled).toBe(true)
      const button = toggle().element() as HTMLButtonElement
      expect(button.disabled).toBe(true)
      expect(box().hasAttribute('data-disabled')).toBe(true)
      await userEvent.click(button, { force: true })
      await settle()
      expect(open.value).toBe(false)
    })

    it('shows the placeholder while empty and merges class last on the box', () => {
      countries({}, { size: 'sm', class: 'h-control-lg' })
      expect(field().placeholder).toBe('Search countries')
      expect(box().classList.contains('h-control-lg')).toBe(true)
      expect(box().classList.contains('h-control-sm')).toBe(false)
    })

    it('shows displayValue for the chosen value', async () => {
      countries({ modelValue: 'de' }, { displayValue: (value: string) => `Code ${value}` })
      await settle()
      expect(field().value).toBe('Code de')
    })

    it('merges class last on every other part', async () => {
      render(() =>
        h(Combobox, { class: 'gap-gap-lg' }, () => [
          h(ComboboxInput, { 'aria-label': 'Country' }),
          h(ComboboxContent, { class: 'p-4' }, () => [
            h(ComboboxGroup, { heading: 'Europe', class: 'mt-2' }, () => [
              h(ComboboxItem, { value: 'de', class: 'py-3' }, () => 'Germany'),
            ]),
            h(ComboboxEmpty, { class: 'py-2' }, () => 'None'),
          ]),
        ]),
      )
      await userEvent.click(toggle())
      await settle()
      expect(box().parentElement!.classList.contains('gap-gap-lg')).toBe(true)
      expect(listbox()!.classList.contains('p-4')).toBe(true)
      expect(page.getByRole('group').element().classList.contains('mt-2')).toBe(true)
      expect(page.getByRole('option').element().classList.contains('py-3')).toBe(true)
    })
  })

  describe('forms', () => {
    it('submits the chosen value under its name, not the shown text', async () => {
      const { value } = countries({ modelValue: 'de', name: 'country' }, {}, (node) =>
        h('form', [node]),
      )
      const form = document.querySelector('form')!
      await settle()
      expect([...new FormData(form).entries()]).toEqual([['country', 'de']])
      await userEvent.click(toggle())
      await settle()
      await userEvent.click(page.getByRole('option', { name: 'Japan' }))
      await settle()
      expect(value.value).toBe('jp')
      expect([...new FormData(form).entries()]).toEqual([['country', 'jp']])
    })
  })

  describe('long list', () => {
    function many() {
      render(() =>
        h('div', { style: { paddingInline: 'var(--h-gap-lg)' } }, [
          h(Combobox, null, () => [
            h(ComboboxInput, { 'aria-label': 'Item' }),
            h(ComboboxContent, null, () =>
              Array.from({ length: 60 }, (_, index) =>
                h(ComboboxItem, { value: `item-${index}` }, () => `Item ${index}`),
              ),
            ),
          ]),
        ]),
      )
    }

    it('is as wide as the field and scrolls inside the window', async () => {
      await page.viewport(1024, 600)
      many()
      await userEvent.click(toggle())
      await settle()
      const list = listbox()!
      expect(
        Math.abs(list.getBoundingClientRect().width - box().getBoundingClientRect().width),
      ).toBeLessThan(1)
      expect(list.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight)
      const viewport = list.querySelector<HTMLElement>('[data-reka-combobox-viewport]')!
      expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight)
    })

    it('stays within the window at 375 px', async () => {
      await page.viewport(375, 640)
      many()
      await userEvent.click(toggle())
      await settle()
      const rect = listbox()!.getBoundingClientRect()
      expect(rect.left).toBeGreaterThanOrEqual(0)
      expect(rect.right).toBeLessThanOrEqual(375)
      expect(rect.bottom).toBeLessThanOrEqual(640)
    })
  })

  describe('axe', () => {
    // An open list hides the page from assistive tech, so the page is checked closed and the list on
    // its own; after the fade, at full opacity.
    const fade = () => new Promise((resolve) => setTimeout(resolve, 400))
    it.each([
      ['light', 1024],
      ['dark', 1024],
      ['light', 375],
    ] as const)(
      'reports no violations in the %s demo at %d px, closed and open',
      async (mode, width) => {
        await page.viewport(width, 800)
        await mountDemo('combobox', { mode })
        await fade()
        expect(listbox()).toBeNull()
        await expectNoAxeViolations()
        await userEvent.click(page.getByRole('combobox', { name: 'Country' }))
        await userEvent.keyboard('{ArrowDown}')
        await fade()
        await expectNoAxeViolations(listbox()!)
      },
    )
  })
})
