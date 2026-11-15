import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h, nextTick, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  tab,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { fluent } from '../../lib/icon'
import { Checkbox } from '.'

afterEach(unmountAll)

type State = boolean | 'indeterminate'

function controlled(initial: State, props: Record<string, unknown> = {}) {
  const value = ref<State>(initial)
  const root = render(() =>
    h(
      Checkbox,
      {
        modelValue: value.value,
        'onUpdate:modelValue': (next: State) => (value.value = next),
        ...props,
      },
      () => 'Email me',
    ),
  )
  return { value, root, box: () => root.querySelector<HTMLElement>('[role="checkbox"]')! }
}

/** Whether the box draws the given icon: compares the path data with the icon set's. */
const draws = (box: HTMLElement, name: 'check-sm' | 'minus-sm') =>
  box.querySelector('svg path')?.getAttribute('d') === /d="([^"]+)"/.exec(fluent[name].body)![1]

describe('Checkbox', () => {
  describe('v-model', () => {
    it('toggles on click and on Space, and not on Enter', async () => {
      const { value, box } = controlled(false)
      expect(box().getAttribute('aria-checked')).toBe('false')
      await userEvent.click(box())
      expect(value.value).toBe(true)
      await nextTick()
      expect(box().getAttribute('aria-checked')).toBe('true')
      box().focus()
      await userEvent.keyboard(' ')
      expect(value.value).toBe(false)
      await userEvent.keyboard('{Enter}')
      expect(value.value).toBe(false)
    })

    it('shows a dash when indeterminate, reports mixed, and checks on click', async () => {
      const { value, box } = controlled('indeterminate')
      expect(box().getAttribute('aria-checked')).toBe('mixed')
      expect(draws(box(), 'minus-sm')).toBe(true)
      await userEvent.click(box())
      expect(value.value).toBe(true)
      await nextTick()
      expect(draws(box(), 'check-sm')).toBe(true)
    })

    it('shows no icon when unchecked', () => {
      const { box } = controlled(false)
      expect(box().querySelector('svg')).toBeNull()
    })
  })

  describe('label and attributes', () => {
    it('is named by its slot, and a click on the text toggles it', async () => {
      const { value } = controlled(false)
      await expect.element(page.getByRole('checkbox', { name: 'Email me' })).toBeVisible()
      await userEvent.click(page.getByText('Email me'))
      expect(value.value).toBe(true)
    })

    it('passes attributes to the control and class to the wrapper', () => {
      const { root, box } = controlled(false, {
        id: 'terms',
        name: 'terms',
        value: 'yes',
        required: true,
        'aria-describedby': 'terms-help',
        'data-test': 'x',
        class: 'text-base',
      })
      const wrapper = root.querySelector<HTMLElement>('[data-slot="checkbox"]')!
      expect(wrapper.tagName).toBe('LABEL')
      expect(box().id).toBe('terms')
      expect(box().getAttribute('aria-required')).toBe('true')
      expect(box().getAttribute('aria-describedby')).toBe('terms-help')
      expect(box().dataset.test).toBe('x')
      expect(wrapper.hasAttribute('id')).toBe(false)
      // cn() lets the caller's text size win over the size's own.
      expect(wrapper.classList.contains('text-base')).toBe(true)
      expect(wrapper.classList.contains('text-sm')).toBe(false)
    })

    it('submits its value in a form while checked', async () => {
      const value = ref<State>(false)
      const root = render(() =>
        h('form', [
          h(Checkbox, {
            name: 'terms',
            value: 'yes',
            modelValue: value.value,
            'onUpdate:modelValue': (next: State) => (value.value = next),
            'aria-label': 'Terms',
          }),
        ]),
      )
      const form = root.querySelector('form')!
      expect(new FormData(form).get('terms')).toBeNull()
      value.value = true
      await nextTick()
      expect(new FormData(form).get('terms')).toBe('yes')
      // Indeterminate is not checked: a "select all" box must not submit as if it were.
      value.value = 'indeterminate'
      await nextTick()
      expect(new FormData(form).get('terms')).toBeNull()
    })

    it('blocks submit while required and not checked, indeterminate included', async () => {
      const value = ref<State>('indeterminate')
      const root = render(() =>
        h('form', [
          h(Checkbox, {
            name: 'terms',
            required: true,
            modelValue: value.value,
            'onUpdate:modelValue': (next: State) => (value.value = next),
            'aria-label': 'Terms',
          }),
        ]),
      )
      const form = root.querySelector('form')!
      expect(form.checkValidity()).toBe(false)
      value.value = false
      await nextTick()
      expect(form.checkValidity()).toBe(false)
      value.value = true
      await nextTick()
      expect(form.checkValidity()).toBe(true)
      expect(new FormData(form).get('terms')).toBe('on')
    })

    it('keeps the form in step with the shown state after a form reset', async () => {
      const root = render(() =>
        h('form', [h(Checkbox, { name: 'terms', modelValue: true, 'aria-label': 'Terms' })]),
      )
      const form = root.querySelector('form')!
      form.reset()
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(new FormData(form).get('terms')).toBe('on')
    })

    it('puts the form input under the box, so a validation bubble points at it', () => {
      // Pushed away from the page corner, where a misplaced input would also land.
      const root = render(() =>
        h('form', { class: 'ps-40 pt-40' }, [
          h(Checkbox, { name: 'terms', required: true }, () => 'I accept the terms'),
        ]),
      )
      const box = root.querySelector('[role="checkbox"]')!.getBoundingClientRect()
      const input = root.querySelector('input[type="checkbox"]')!.getBoundingClientRect()
      expect(Math.abs(input.left - box.left)).toBeLessThan(1)
      expect(Math.abs(input.top - box.top)).toBeLessThan(box.height)
    })

    it('hands focus from the form input to the box, so Space never toggles a hidden input', async () => {
      const value = ref<State>(false)
      const root = render(() =>
        h('form', [
          h(Checkbox, {
            name: 'terms',
            required: true,
            modelValue: value.value,
            'onUpdate:modelValue': (next: State) => (value.value = next),
            'aria-label': 'Terms',
          }),
        ]),
      )
      root.querySelector('form')!.reportValidity()
      expect(document.activeElement).toBe(root.querySelector('[role="checkbox"]'))
      await userEvent.keyboard(' ')
      expect(value.value).toBe(true)
      await nextTick()
      expect(root.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(true)
    })

    it('fires input and change when the user toggles, and not when code sets the value', async () => {
      const value = ref<State>(false)
      const root = render(() =>
        h('form', [
          h(
            Checkbox,
            {
              name: 'terms',
              modelValue: value.value,
              'onUpdate:modelValue': (next: State) => (value.value = next),
            },
            () => 'I accept the terms',
          ),
        ]),
      )
      const form = root.querySelector('form')!
      const events: string[] = []
      form.addEventListener('input', () => events.push('input'))
      form.addEventListener('change', () => events.push('change'))
      value.value = 'indeterminate'
      await nextTick()
      value.value = true
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(events).toEqual([])
      await userEvent.click(page.getByText('I accept the terms'))
      await nextTick()
      expect(events).toEqual(['input', 'change'])
    })

    it('leaves a disabled box out of the form, as a native checkbox would', async () => {
      const root = render(() =>
        h('form', [
          h(Checkbox, { name: 'terms', disabled: true, modelValue: true, 'aria-label': 'Terms' }),
        ]),
      )
      expect(new FormData(root.querySelector('form')!).get('terms')).toBeNull()
    })

    it('takes an aria-label when it has no slot', async () => {
      render(() => h(Checkbox, { 'aria-label': 'Select row' }))
      await expect.element(page.getByRole('checkbox', { name: 'Select row' })).toBeVisible()
    })
  })

  describe('states and sizes', () => {
    it('blocks toggling when disabled; dims the box and mutes the text, still readable', async () => {
      const root = render(() =>
        h('div', [
          h(Checkbox, { modelValue: false }, () => 'Enabled'),
          h(Checkbox, { modelValue: false, disabled: true }, () => 'Email me'),
        ]),
      )
      const [enabled, disabled] = [...root.querySelectorAll<HTMLElement>('[data-slot="checkbox"]')]
      const box = disabled!.querySelector<HTMLElement>('[role="checkbox"]')!
      await userEvent.click(box, { force: true })
      await userEvent.click(page.getByText('Email me'), { force: true })
      expect(box.getAttribute('aria-checked')).toBe('false')
      expect(Number(getComputedStyle(box).opacity)).toBeLessThan(1)
      // Muted, not translucent: the text keeps AA contrast.
      expect(getComputedStyle(disabled!).opacity).toBe('1')
      expect(getComputedStyle(disabled!).color).not.toBe(getComputedStyle(enabled!).color)
    })

    it.each([
      ['sm', 'size-3.5', 'text-sm'],
      ['md', 'size-4', 'text-sm'],
      ['lg', 'size-5', 'text-base'],
    ] as const)('renders size %s with its box and text classes', (size, box, text) => {
      const { root } = controlled(false, { size })
      expect(root.querySelector('[role="checkbox"]')!.classList.contains(box)).toBe(true)
      expect(root.querySelector('[data-slot="checkbox"]')!.classList.contains(text)).toBe(true)
    })

    it('fills the box with primary when checked or indeterminate', () => {
      const root = render(() =>
        h('div', [
          h(Checkbox, { 'aria-label': 'Off', modelValue: false }),
          h(Checkbox, { 'aria-label': 'On', modelValue: true }),
          h(Checkbox, { 'aria-label': 'Some', modelValue: 'indeterminate' }),
        ]),
      )
      const [off, on, some] = [...root.querySelectorAll('[role="checkbox"]')].map(
        (box) => getComputedStyle(box).backgroundColor,
      )
      expect(on).not.toBe(off)
      expect(some).toBe(on)
    })

    it.each([true, 'indeterminate'] as const)(
      'keeps the border the colour of the fill when a %s box is hovered',
      async (state) => {
        const { box } = controlled(state)
        box().classList.add('transition-none')
        await userEvent.hover(box())
        const style = getComputedStyle(box())
        expect(style.borderColor).toBe(style.backgroundColor)
      },
    )

    it('changes the border of an unchecked box on hover', async () => {
      const { box } = controlled(false)
      box().classList.add('transition-none')
      const before = getComputedStyle(box()).borderColor
      await userEvent.hover(box())
      expect(getComputedStyle(box()).borderColor).not.toBe(before)
    })

    it.each(['sm', 'md', 'lg'] as const)(
      'centres the %s box on the first line of its label',
      (size) => {
        const { root, box } = controlled(false, { size })
        const label = root.querySelector<HTMLElement>('[data-slot="checkbox"]')!
        const line = parseFloat(getComputedStyle(label).lineHeight)
        const boxRect = box().getBoundingClientRect()
        const labelTop = label.getBoundingClientRect().top
        expect(boxRect.top + boxRect.height / 2 - labelTop).toBeCloseTo(line / 2, 0)
      },
    )

    it('shows the focus ring on keyboard focus', async () => {
      const { box } = controlled(false)
      expect(getComputedStyle(box()).boxShadow).toBe('none')
      await tab()
      expect(document.activeElement).toBe(box())
      expect(getComputedStyle(box()).boxShadow).not.toBe('none')
    })
  })

  describe('label and attributes', () => {
    it('keeps its own name when an outside label points at its id', async () => {
      const root = render(() =>
        h('div', [
          h('label', { for: 'terms' }, ['Terms ', h('span', { 'aria-hidden': 'true' }, '*')]),
          h(Checkbox, { id: 'terms' }),
        ]),
      )
      await nextTick()
      const box = root.querySelector<HTMLElement>('[role="checkbox"]')!
      expect(box.id).toBe('terms')
      expect(box.hasAttribute('aria-label')).toBe(false)
    })
  })

  describe('forms', () => {
    it('announces required only when a name lets the form enforce it', () => {
      const root = render(() =>
        h('div', [
          h(Checkbox, { required: true, 'aria-label': 'A' }),
          h('form', [h(Checkbox, { required: true, name: 'b', 'aria-label': 'B' })]),
        ]),
      )
      const [unnamed, named] = [...root.querySelectorAll('[role="checkbox"]')]
      expect(unnamed!.getAttribute('aria-required')).not.toBe('true')
      expect(named!.getAttribute('aria-required')).toBe('true')
    })

    it('fires no form events when the parent rejects the change', async () => {
      const root = render(() =>
        h('form', [
          h(Checkbox, {
            name: 'terms',
            modelValue: false,
            'onUpdate:modelValue': () => {},
            'aria-label': 'Terms',
          }),
        ]),
      )
      const events: string[] = []
      root.querySelector('form')!.addEventListener('change', () => events.push('change'))
      await userEvent.click(root.querySelector('[role="checkbox"]')!)
      await nextTick()
      expect(events).toEqual([])
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('checkbox', { mode })
      await expectNoAxeViolations()
    })
  })
})
