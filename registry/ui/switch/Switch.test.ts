import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createSSRApp, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  tab,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Switch } from '.'

afterEach(unmountAll)

function controlled(initial: boolean, props: Record<string, unknown> = {}, label = 'Dark mode') {
  const value = ref(initial)
  const root = render(() =>
    h(
      Switch,
      {
        modelValue: value.value,
        'onUpdate:modelValue': (next: boolean) => (value.value = next),
        ...props,
      },
      () => label,
    ),
  )
  return { value, root, control: () => root.querySelector<HTMLElement>('[role="switch"]')! }
}

describe('Switch', () => {
  describe('toggling', () => {
    it('toggles on click, on its text, on Space and on Enter', async () => {
      const { value, control } = controlled(false)
      expect(control().getAttribute('aria-checked')).toBe('false')
      await userEvent.click(control())
      expect(value.value).toBe(true)
      await nextTick()
      expect(control().getAttribute('aria-checked')).toBe('true')
      await userEvent.click(page.getByText('Dark mode'))
      expect(value.value).toBe(false)
      control().focus()
      await userEvent.keyboard(' ')
      expect(value.value).toBe(true)
      await userEvent.keyboard('{Enter}')
      expect(value.value).toBe(false)
    })

    it('is named by its slot, or by aria-label without one', async () => {
      controlled(false)
      await expect.element(page.getByRole('switch', { name: 'Dark mode' })).toBeVisible()
      render(() => h(Switch, { 'aria-label': 'Wi-Fi' }))
      await expect.element(page.getByRole('switch', { name: 'Wi-Fi' })).toBeVisible()
    })
  })

  describe('attributes and sizes', () => {
    it('passes attributes to the control and class to the wrapper', () => {
      const { root, control } = controlled(false, {
        id: 'dark',
        'aria-describedby': 'dark-help',
        class: 'text-base',
      })
      const wrapper = root.querySelector<HTMLElement>('[data-slot="switch"]')!
      expect(wrapper.tagName).toBe('LABEL')
      expect(control().id).toBe('dark')
      expect(control().getAttribute('aria-describedby')).toBe('dark-help')
      expect(wrapper.hasAttribute('id')).toBe(false)
      expect(wrapper.classList.contains('text-base')).toBe(true)
      expect(wrapper.classList.contains('text-sm')).toBe(false)
    })

    it.each([
      ['sm', 'w-7', 'text-sm'],
      ['md', 'w-9', 'text-sm'],
      ['lg', 'w-11', 'text-base'],
    ] as const)('renders size %s with its track and text classes', (size, track, text) => {
      const { root, control } = controlled(false, { size })
      expect(control().classList.contains(track)).toBe(true)
      expect(root.querySelector('[data-slot="switch"]')!.classList.contains(text)).toBe(true)
    })

    it.each(['ltr', 'rtl'] as const)(
      'moves the thumb to the inline end when on (%s)',
      async (dir) => {
        const value = ref(false)
        const root = render(() =>
          h('div', { dir }, [
            h(Switch, {
              'aria-label': 'Wi-Fi',
              class: '**:transition-none',
              modelValue: value.value,
            }),
          ]),
        )
        const thumb = () =>
          root.querySelector('[data-slot="switch-thumb"]')!.getBoundingClientRect()
        const track = root.querySelector('[role="switch"]')!.getBoundingClientRect()
        const off = thumb()
        value.value = true
        await nextTick()
        const on = thumb()
        if (dir === 'ltr') {
          expect(on.left).toBeGreaterThan(off.left)
          expect(on.right).toBeCloseTo(track.right - 2, 0)
        } else {
          expect(on.left).toBeLessThan(off.left)
          expect(on.left).toBeCloseTo(track.left + 2, 0)
        }
      },
    )
  })

  describe('states', () => {
    it('blocks toggling when disabled; dims the track and mutes the text', async () => {
      const root = render(() =>
        h('div', [
          h(Switch, { modelValue: false }, () => 'Enabled'),
          h(Switch, { modelValue: false, disabled: true }, () => 'Dark mode'),
        ]),
      )
      const [enabled, disabled] = [...root.querySelectorAll<HTMLElement>('[data-slot="switch"]')]
      const control = disabled!.querySelector<HTMLElement>('[role="switch"]')!
      await userEvent.click(control, { force: true })
      await userEvent.click(page.getByText('Dark mode'), { force: true })
      expect(control.getAttribute('aria-checked')).toBe('false')
      expect(Number(getComputedStyle(control).opacity)).toBeLessThan(1)
      expect(getComputedStyle(disabled!).opacity).toBe('1')
      expect(getComputedStyle(disabled!).color).not.toBe(getComputedStyle(enabled!).color)
    })

    it('fills the track with primary when on', () => {
      const root = render(() =>
        h('div', [
          h(Switch, { 'aria-label': 'Off', modelValue: false }),
          h(Switch, { 'aria-label': 'On', modelValue: true }),
        ]),
      )
      const [off, on] = [...root.querySelectorAll('[role="switch"]')].map(
        (control) => getComputedStyle(control).backgroundColor,
      )
      expect(on).not.toBe(off)
    })

    it('shows the focus ring on keyboard focus', async () => {
      const { control } = controlled(false)
      expect(getComputedStyle(control()).boxShadow).toBe('none')
      await tab()
      expect(document.activeElement).toBe(control())
      expect(getComputedStyle(control()).boxShadow).not.toBe('none')
    })
  })

  describe('forms', () => {
    function inForm(initial: boolean) {
      const value = ref(initial)
      const root = render(() =>
        h('form', { class: 'ps-40 pt-40' }, [
          h(
            Switch,
            {
              name: 'alerts',
              value: 'yes',
              required: true,
              modelValue: value.value,
              'onUpdate:modelValue': (next: boolean) => (value.value = next),
            },
            () => 'Alerts',
          ),
        ]),
      )
      return {
        value,
        root,
        form: root.querySelector('form')!,
        control: () => root.querySelector<HTMLElement>('[role="switch"]')!,
      }
    }

    it('submits value while on and nothing while off; required blocks submit while off', async () => {
      const { value, form } = inForm(false)
      expect(new FormData(form).get('alerts')).toBeNull()
      expect(form.checkValidity()).toBe(false)
      value.value = true
      await nextTick()
      expect(new FormData(form).get('alerts')).toBe('yes')
      expect(form.checkValidity()).toBe(true)
    })

    it('puts the form input under the track and hands its focus to the switch', async () => {
      const { value, form, control, root } = inForm(false)
      const track = control().getBoundingClientRect()
      const input = root.querySelector('input[type="checkbox"]')!.getBoundingClientRect()
      expect(Math.abs(input.left - track.left)).toBeLessThan(1)
      expect(Math.abs(input.top - track.top)).toBeLessThan(track.height)
      form.reportValidity()
      expect(document.activeElement).toBe(control())
      await userEvent.keyboard(' ')
      expect(value.value).toBe(true)
    })

    it('fires input and change when the user toggles, and not when code sets the value', async () => {
      const { value, form } = inForm(false)
      const events: string[] = []
      form.addEventListener('input', () => events.push('input'))
      form.addEventListener('change', () => events.push('change'))
      value.value = true
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(events).toEqual([])
      await userEvent.click(page.getByText('Alerts'))
      await nextTick()
      expect(events).toEqual(['input', 'change'])
    })
  })

  describe('attributes and sizes', () => {
    it('keeps its own name when an outside label points at its id', async () => {
      const value = ref(false)
      const root = render(() =>
        h('div', [
          h('label', { for: 'alerts' }, ['Alerts ', h('span', { 'aria-hidden': 'true' }, '*')]),
          h(Switch, {
            id: 'alerts',
            modelValue: value.value,
            'onUpdate:modelValue': (next: boolean) => (value.value = next),
          }),
        ]),
      )
      const control = root.querySelector<HTMLElement>('[role="switch"]')!
      await nextTick()
      expect(control.id).toBe('alerts')
      // Reka would copy the outside label's text, hidden marker included, into aria-label.
      expect(control.hasAttribute('aria-label')).toBe(false)
      await userEvent.click(root.querySelector('label[for="alerts"]')!)
      expect(value.value).toBe(true)
    })

    it('takes any id, quotes included, without a selector built from it', async () => {
      const root = render(() => h(Switch, { id: 'a"b', 'aria-label': 'Alerts' }))
      await nextTick()
      expect(root.querySelector('[role="switch"]')!.id).toBe('a"b')
    })

    it('renders a passed id on the server, so an outside label works before hydration', async () => {
      const html = await renderToString(
        createSSRApp({ render: () => h(Switch, { id: 'alerts', 'aria-label': 'Alerts' }) }),
      )
      expect(html).toMatch(/<button[^>]*\bid="alerts"/)
    })

    it('slides by its own direction: an LTR switch inside an RTL page still ends on the right', async () => {
      const value = ref(false)
      const root = render(() =>
        h('div', { dir: 'rtl' }, [
          h('div', { dir: 'ltr' }, [
            h(Switch, {
              'aria-label': 'Wi-Fi',
              class: '**:transition-none',
              modelValue: value.value,
            }),
          ]),
        ]),
      )
      value.value = true
      await nextTick()
      const thumb = root.querySelector('[data-slot="switch-thumb"]')!.getBoundingClientRect()
      const track = root.querySelector('[role="switch"]')!.getBoundingClientRect()
      expect(thumb.right).toBeCloseTo(track.right - 2, 0)
    })

    it('draws the thumb with a border, which stays visible when colours are forced', () => {
      render(() => h(Switch, { 'aria-label': 'Wi-Fi' }))
      const thumb = document.querySelector('[data-slot="switch-thumb"]')!
      expect(parseFloat(getComputedStyle(thumb).borderTopWidth)).toBeGreaterThan(0)
    })
  })

  describe('forms', () => {
    it('keeps the form in step with the shown state after a form reset', async () => {
      const root = render(() =>
        h('form', [h(Switch, { name: 'alerts', modelValue: true, 'aria-label': 'Alerts' })]),
      )
      const form = root.querySelector('form')!
      form.reset()
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(new FormData(form).get('alerts')).toBe('on')
    })

    it('announces required only when a name lets the form enforce it', () => {
      const root = render(() =>
        h('div', [
          h(Switch, { required: true, 'aria-label': 'A' }),
          h('form', [h(Switch, { required: true, name: 'b', 'aria-label': 'B' })]),
        ]),
      )
      const [unnamed, named] = [...root.querySelectorAll('[role="switch"]')]
      expect(unnamed!.getAttribute('aria-required')).not.toBe('true')
      expect(named!.getAttribute('aria-required')).toBe('true')
    })

    it('fires no form events when the parent rejects the change', async () => {
      const root = render(() =>
        h('form', [
          h(Switch, {
            name: 'alerts',
            modelValue: false,
            'onUpdate:modelValue': () => {},
            'aria-label': 'Alerts',
          }),
        ]),
      )
      const events: string[] = []
      root.querySelector('form')!.addEventListener('change', () => events.push('change'))
      await userEvent.click(root.querySelector('[role="switch"]')!)
      await nextTick()
      expect(events).toEqual([])
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('switch', { mode })
      await expectNoAxeViolations()
    })
  })
})
