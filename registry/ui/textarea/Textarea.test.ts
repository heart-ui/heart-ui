import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { h, nextTick, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  tab,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Textarea } from '.'

afterEach(unmountAll)

const field = (root: HTMLElement) => root.querySelector('textarea')!

describe('Textarea', () => {
  describe('v-model', () => {
    it('shows the value and emits each change', async () => {
      const value = ref('First line')
      const root = render(() =>
        h(Textarea, {
          'aria-label': 'Notes',
          modelValue: value.value,
          'onUpdate:modelValue': (next: string) => (value.value = next),
        }),
      )
      expect(field(root).value).toBe('First line')
      await userEvent.fill(field(root), 'One\nTwo')
      expect(value.value).toBe('One\nTwo')
      value.value = 'Reset'
      await nextTick()
      expect(field(root).value).toBe('Reset')
    })
  })

  describe('attributes', () => {
    it('passes native attributes and listeners to the textarea, with class merged last', async () => {
      const onFocus = vi.fn()
      const onBlur = vi.fn()
      const onKeydown = vi.fn()
      const root = render(() =>
        h(Textarea, {
          id: 'notes',
          name: 'notes',
          rows: 6,
          placeholder: 'Anything else?',
          readonly: true,
          maxlength: 500,
          required: true,
          'aria-label': 'Notes',
          class: 'px-control-px-lg',
          onFocus,
          onBlur,
          onKeydown,
        }),
      )
      const textarea = field(root)
      expect(textarea.id).toBe('notes')
      expect(textarea.name).toBe('notes')
      expect(textarea.rows).toBe(6)
      expect(textarea.placeholder).toBe('Anything else?')
      expect(textarea.readOnly).toBe(true)
      expect(textarea.maxLength).toBe(500)
      expect(textarea.required).toBe(true)
      // cn() lets the caller's padding win over the size's own.
      expect(textarea.classList.contains('px-control-px-lg')).toBe(true)
      expect(textarea.classList.contains('px-control-px-md')).toBe(false)
      await tab()
      await userEvent.keyboard('{ArrowLeft}')
      textarea.blur()
      expect(onFocus).toHaveBeenCalledTimes(1)
      expect(onKeydown).toHaveBeenCalled()
      expect(onBlur).toHaveBeenCalledTimes(1)
    })
  })

  describe('invalid and disabled', () => {
    it('marks an invalid textarea with aria-invalid and the danger border', () => {
      const textarea = field(render(() => h(Textarea, { 'aria-label': 'Notes', invalid: true })))
      expect(textarea.getAttribute('aria-invalid')).toBe('true')
      expect(textarea.classList.contains('border-danger')).toBe(true)
    })

    it('lets invalid win over a passed aria-invalid, and keeps one when not invalid', () => {
      const root = render(() =>
        h('div', [
          h(Textarea, { 'aria-label': 'A', invalid: true, 'aria-invalid': 'false' }),
          h(Textarea, { 'aria-label': 'B', 'aria-invalid': 'true' }),
          h(Textarea, { 'aria-label': 'C' }),
        ]),
      )
      const [a, b, c] = root.querySelectorAll('textarea')
      expect(a!.getAttribute('aria-invalid')).toBe('true')
      expect(b!.getAttribute('aria-invalid')).toBe('true')
      expect(c!.hasAttribute('aria-invalid')).toBe(false)
    })

    it('disables and dims the textarea', () => {
      const textarea = field(render(() => h(Textarea, { 'aria-label': 'Notes', disabled: true })))
      expect(textarea.disabled).toBe(true)
      expect(Number(getComputedStyle(textarea).opacity)).toBeLessThan(1)
    })

    it('fills whenever readonly is set, as input does, but not a disabled field alone', () => {
      const root = render(() =>
        h('div', [
          h(Textarea, { 'aria-label': 'Plain' }),
          h(Textarea, { 'aria-label': 'Read-only', readonly: true }),
          h(Textarea, { 'aria-label': 'Disabled', disabled: true }),
          h(Textarea, { 'aria-label': 'Both', readonly: true, disabled: true }),
          h(Textarea, { 'aria-label': 'Off', readonly: false }),
          h(Textarea, { 'aria-label': 'Null', readonly: null }),
          h(Textarea, { 'aria-label': 'Camel', readOnly: true }),
        ]),
      )
      const fields = [...root.querySelectorAll('textarea')]
      const [plain, readOnly, disabled, both, off, nulled, camel] = fields.map(
        (element) => getComputedStyle(element).backgroundColor,
      )
      expect(readOnly).not.toBe(plain)
      expect(disabled).toBe(plain)
      expect(both).toBe(readOnly)
      // The fill follows whether the field is read-only, however the attribute was passed.
      expect([fields[4]!.readOnly, off]).toEqual([false, plain])
      expect([fields[5]!.readOnly, nulled]).toEqual([false, plain])
      expect([fields[6]!.readOnly, camel]).toEqual([true, readOnly])
    })

    it('changes the border on hover', async () => {
      const textarea = field(
        render(() => h(Textarea, { 'aria-label': 'Notes', class: 'transition-none' })),
      )
      const before = getComputedStyle(textarea).borderColor
      await userEvent.hover(textarea)
      expect(getComputedStyle(textarea).borderColor).not.toBe(before)
    })
  })

  describe('sizes and focus', () => {
    it.each([
      ['sm', 'px-control-px-sm', 'text-sm'],
      ['md', 'px-control-px-md', 'text-sm'],
      ['lg', 'px-control-px-lg', 'text-base'],
    ] as const)('renders size %s with its token classes', (size, padding, text) => {
      const textarea = field(render(() => h(Textarea, { 'aria-label': 'Notes', size })))
      expect(textarea.classList.contains(padding)).toBe(true)
      expect(textarea.classList.contains(text)).toBe(true)
      expect(textarea.classList.contains('rounded-input')).toBe(true)
    })

    it('defaults to md', () => {
      const textarea = field(render(() => h(Textarea, { 'aria-label': 'Notes' })))
      expect(textarea.classList.contains('px-control-px-md')).toBe(true)
      expect(textarea.classList.contains('text-sm')).toBe(true)
    })

    it('shows the focus ring on keyboard focus', async () => {
      const textarea = field(render(() => h(Textarea, { 'aria-label': 'Notes' })))
      expect(getComputedStyle(textarea).boxShadow).toBe('none')
      await tab()
      expect(document.activeElement).toBe(textarea)
      expect(getComputedStyle(textarea).boxShadow).not.toBe('none')
    })
  })

  describe('autoresize', () => {
    it('starts one line tall and grows as lines are added', async () => {
      const root = render(() =>
        h('div', [
          h(Textarea, { 'aria-label': 'Grow', autoresize: true }),
          h(Textarea, { 'aria-label': 'One row', rows: 1 }),
        ]),
      )
      const [textarea, oneRow] = root.querySelectorAll('textarea')
      const line = oneRow!.getBoundingClientRect().height
      expect(textarea!.getBoundingClientRect().height).toBe(line)
      expect(getComputedStyle(textarea!).resize).toBe('none')
      await userEvent.fill(textarea!, 'One\nTwo\nThree\nFour\nFive')
      expect(textarea!.getBoundingClientRect().height).toBeGreaterThan(line * 2)
    })

    it('drops the resize handle only where the browser can grow the field', () => {
      // Without field-sizing support the field keeps a fixed height, so it must stay resizable.
      // Read the rendered classes, after cn() has merged them.
      const textarea = field(render(() => h(Textarea, { 'aria-label': 'Grow', autoresize: true })))
      const classes = [...textarea.classList]
      expect(classes).toContain('supports-field-sizing:resize-none')
      expect(classes).not.toContain('resize-none')
      expect(classes).toContain('resize-y')
    })

    it('without it, follows rows and resizes vertically', async () => {
      const root = render(() =>
        h('div', [
          h(Textarea, { 'aria-label': 'Two', rows: 2 }),
          h(Textarea, { 'aria-label': 'Six', rows: 6 }),
        ]),
      )
      const [two, six] = root.querySelectorAll('textarea')
      expect(six!.getBoundingClientRect().height).toBeGreaterThan(
        two!.getBoundingClientRect().height,
      )
      expect(getComputedStyle(two!).resize).toBe('vertical')
      const before = two!.getBoundingClientRect().height
      await userEvent.fill(two!, 'One\nTwo\nThree\nFour\nFive')
      expect(two!.getBoundingClientRect().height).toBe(before)
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('textarea', { mode })
      await expectNoAxeViolations()
    })
  })
})
