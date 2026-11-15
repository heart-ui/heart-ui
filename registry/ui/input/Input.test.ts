import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createCommentVNode, Fragment, h, nextTick, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  tab,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Input } from '.'
import { inputVariants } from './input.variants'

afterEach(unmountAll)

describe('Input', () => {
  describe('v-model', () => {
    it('shows the value and emits each change', async () => {
      const value = ref('Ada')
      const root = render(() =>
        h(Input, {
          'aria-label': 'Name',
          modelValue: value.value,
          'onUpdate:modelValue': (next: string) => (value.value = next),
        }),
      )
      const input = root.querySelector('input')!
      expect(input.value).toBe('Ada')
      await userEvent.fill(input, 'Grace')
      expect(value.value).toBe('Grace')
      value.value = 'Lin'
      await nextTick()
      expect(input.value).toBe('Lin')
    })
  })

  describe('attributes', () => {
    it('passes native attributes and listeners to the input and class to the wrapper', async () => {
      const onFocus = vi.fn()
      const onBlur = vi.fn()
      const onKeydown = vi.fn()
      const root = render(() =>
        h(Input, {
          id: 'email',
          type: 'email',
          placeholder: 'name@example.com',
          readonly: true,
          autocomplete: 'email',
          required: true,
          'aria-label': 'Email',
          class: 'w-full',
          onFocus,
          onBlur,
          onKeydown,
        }),
      )
      const input = root.querySelector('input')!
      const wrapper = input.closest('[data-slot="input"]') as HTMLElement
      expect(input.id).toBe('email')
      expect(input.type).toBe('email')
      expect(input.placeholder).toBe('name@example.com')
      expect(input.readOnly).toBe(true)
      expect(input.autocomplete).toBe('email')
      expect(input.required).toBe(true)
      expect(input.classList.contains('w-full')).toBe(false)
      expect(wrapper.className.endsWith('w-full')).toBe(true)
      expect(wrapper.hasAttribute('id')).toBe(false)
      await tab()
      await userEvent.keyboard('{ArrowLeft}')
      input.blur()
      expect(onFocus).toHaveBeenCalledTimes(1)
      expect(onKeydown).toHaveBeenCalled()
      expect(onBlur).toHaveBeenCalledTimes(1)
    })
  })

  describe('invalid and disabled', () => {
    it('marks an invalid input with aria-invalid and the danger border', () => {
      const root = render(() => h(Input, { 'aria-label': 'Email', invalid: true }))
      const input = root.querySelector('input')!
      const wrapper = input.closest('[data-slot="input"]') as HTMLElement
      expect(input.getAttribute('aria-invalid')).toBe('true')
      expect(wrapper.classList.contains('border-danger')).toBe(true)
    })

    it('leaves aria-invalid off a valid input', () => {
      const root = render(() => h(Input, { 'aria-label': 'Email' }))
      expect(root.querySelector('input')!.hasAttribute('aria-invalid')).toBe(false)
    })

    it('disables the input and dims the wrapper', () => {
      const root = render(() => h(Input, { 'aria-label': 'Email', disabled: true }))
      const input = root.querySelector('input')!
      const wrapper = input.closest('[data-slot="input"]') as HTMLElement
      expect(input.disabled).toBe(true)
      expect(Number(getComputedStyle(wrapper).opacity)).toBeLessThan(1)
    })
  })

  describe('focus', () => {
    it('shows the ring on the wrapper while the input has focus', async () => {
      const root = render(() => h(Input, { 'aria-label': 'Email' }))
      const wrapper = root.querySelector('[data-slot="input"]') as HTMLElement
      expect(getComputedStyle(wrapper).boxShadow).toBe('none')
      await tab()
      expect(document.activeElement).toBe(root.querySelector('input'))
      expect(getComputedStyle(wrapper).boxShadow).not.toBe('none')
    })

    it('focuses the input when a non-interactive slot is clicked', async () => {
      const root = render(() =>
        h(
          Input,
          { 'aria-label': 'Search' },
          { leading: () => h('span', { 'data-test': 'icon' }, '@') },
        ),
      )
      await userEvent.click(root.querySelector('[data-test="icon"]')!)
      expect(document.activeElement).toBe(root.querySelector('input'))
    })

    it('lets a button in a slot keep its own click and focus', async () => {
      const onClear = vi.fn()
      const root = render(() =>
        h(
          Input,
          { 'aria-label': 'Search' },
          { trailing: () => h('button', { type: 'button', onClick: onClear }, 'Clear') },
        ),
      )
      const button = root.querySelector('button')!
      await userEvent.click(button)
      expect(onClear).toHaveBeenCalledTimes(1)
      expect(document.activeElement).toBe(button)
    })
  })

  describe('focus inside other components', () => {
    it('focuses the input from a slot when an ancestor has a tabindex', async () => {
      const root = render(() =>
        h('div', { tabindex: -1 }, [
          h(
            Input,
            { 'aria-label': 'Search' },
            { leading: () => h('span', { 'data-test': 'icon' }, '@') },
          ),
        ]),
      )
      await userEvent.click(root.querySelector('[data-test="icon"]')!)
      expect(document.activeElement).toBe(root.querySelector('input'))
    })

    it('leaves the ring off while a slot button has focus', async () => {
      const root = render(() =>
        h(
          Input,
          { 'aria-label': 'Search' },
          { trailing: () => h('button', { type: 'button' }, 'Clear') },
        ),
      )
      root.querySelector('button')!.focus()
      const wrapper = root.querySelector('[data-slot="input"]') as HTMLElement
      expect(getComputedStyle(wrapper).boxShadow).toBe('none')
    })

    it('makes slot controls unusable while disabled', async () => {
      const onClear = vi.fn()
      const root = render(() =>
        h(
          Input,
          { 'aria-label': 'Search', disabled: true },
          { trailing: () => h('button', { type: 'button', onClick: onClear }, 'Clear') },
        ),
      )
      const button = root.querySelector('button')!
      // A user's click; inert doesn't stop a script calling click().
      await userEvent.click(button, { force: true })
      await tab()
      expect(onClear).not.toHaveBeenCalled()
      expect(document.activeElement).not.toBe(button)
    })
  })

  describe('focus edge cases', () => {
    it('does not blur the focused input when its padding or an icon is clicked', async () => {
      const onBlur = vi.fn()
      const root = render(() =>
        h(
          Input,
          { 'aria-label': 'Search', onBlur },
          { leading: () => h('span', { 'data-test': 'icon' }, '@') },
        ),
      )
      await tab()
      await userEvent.click(root.querySelector('[data-test="icon"]')!)
      expect(onBlur).not.toHaveBeenCalled()
      expect(document.activeElement).toBe(root.querySelector('input'))
    })

    it('drops the ring when the focused input becomes disabled', async () => {
      const disabled = ref(false)
      const root = render(() => h(Input, { 'aria-label': 'Email', disabled: disabled.value }))
      await tab()
      disabled.value = true
      await nextTick()
      const wrapper = root.querySelector('[data-slot="input"]') as HTMLElement
      expect(wrapper.hasAttribute('data-focused')).toBe(false)
    })

    it.each([
      ['a v-if that is off', () => [createCommentVNode('v-if')]],
      ['an empty fragment', () => [h(Fragment, [])]],
    ])('renders no slot wrapper for %s', (_, trailing) => {
      const root = render(() => h(Input, { 'aria-label': 'Email' }, { trailing }))
      expect(root.querySelector('[data-slot="input"]')!.children).toHaveLength(1)
    })
  })

  describe('caller attributes and looks', () => {
    it("keeps the caller's aria-invalid when invalid is off", () => {
      const root = render(() => h(Input, { 'aria-label': 'Email', 'aria-invalid': 'true' }))
      expect(root.querySelector('input')!.getAttribute('aria-invalid')).toBe('true')
    })

    it('changes the border on hover', async () => {
      const root = render(() => h(Input, { 'aria-label': 'Email', class: 'transition-none' }))
      const wrapper = root.querySelector('[data-slot="input"]') as HTMLElement
      const before = getComputedStyle(wrapper).borderColor
      await userEvent.hover(wrapper)
      expect(getComputedStyle(wrapper).borderColor).not.toBe(before)
    })

    it('looks different when read-only', () => {
      const root = render(() =>
        h('div', [
          h(Input, { 'aria-label': 'A' }),
          h(Input, { 'aria-label': 'B', readonly: true }),
        ]),
      )
      const [editable, readonly] = [...root.querySelectorAll('[data-slot="input"]')].map(
        (wrapper) => getComputedStyle(wrapper).backgroundColor,
      )
      expect(readonly).not.toBe(editable)
    })

    it('fills only when the field is actually read-only, however readonly is passed', () => {
      const root = render(() =>
        h('div', [
          h(Input, { 'aria-label': 'Plain' }),
          h(Input, { 'aria-label': 'Off', readonly: false }),
          h(Input, { 'aria-label': 'Null', readonly: null }),
          h(Input, { 'aria-label': 'Camel', readOnly: true }),
        ]),
      )
      const inputs = [...root.querySelectorAll('input')]
      const fills = [...root.querySelectorAll('[data-slot="input"]')].map(
        (wrapper) => getComputedStyle(wrapper).backgroundColor,
      )
      const [plain] = fills
      expect([inputs[1]!.readOnly, fills[1]]).toEqual([false, plain])
      expect([inputs[2]!.readOnly, fills[2]]).toEqual([false, plain])
      expect(inputs[3]!.readOnly).toBe(true)
      expect(fills[3]).not.toBe(plain)
    })

    it('renders no slot wrapper for an empty slot', () => {
      const root = render(() => h(Input, { 'aria-label': 'Email' }, { trailing: () => [] }))
      expect(root.querySelector('[data-slot="input"]')!.children).toHaveLength(1)
    })
  })

  describe('sizes and slots', () => {
    it.each(['sm', 'md', 'lg'] as const)('renders the %s size with its token classes', (size) => {
      const root = render(() => h(Input, { 'aria-label': 'Email', size }))
      const wrapper = root.querySelector('[data-slot="input"]') as HTMLElement
      for (const name of inputVariants({ size }).split(' ')) {
        expect(wrapper.classList.contains(name), name).toBe(true)
      }
    })

    it('renders the leading slot before the input and the trailing slot after it', () => {
      const root = render(() =>
        h(
          Input,
          { 'aria-label': 'Price' },
          { leading: () => h('span', 'before'), trailing: () => h('span', 'after') },
        ),
      )
      const wrapper = root.querySelector('[data-slot="input"]') as HTMLElement
      const order = [...wrapper.children].map((child) => child.textContent || child.tagName)
      expect(order).toEqual(['before', 'INPUT', 'after'])
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('input', { mode })
      await expectNoAxeViolations()
    })
  })
})
