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
import { RadioGroup, RadioGroupItem } from '.'

afterEach(unmountAll)

// Reka chooses the newly focused radio in a timeout that checks the arrow key is still down.
// A person's key press lasts long enough; Playwright's releases the key at once, so hold it.
async function arrow(key: string) {
  await userEvent.keyboard(`{${key}>}`)
  await new Promise((resolve) => setTimeout(resolve, 20))
  await userEvent.keyboard(`{/${key}}`)
}

function plans(
  props: Record<string, unknown> = {},
  items: Record<string, Record<string, unknown>> = {},
) {
  const value = ref<string | undefined>(props.modelValue as string | undefined)
  const root = render(() =>
    h(
      RadioGroup,
      {
        'aria-label': 'Plan',
        ...props,
        modelValue: value.value,
        'onUpdate:modelValue': (next: string | undefined) => (value.value = next),
      },
      () =>
        ['free', 'team', 'business'].map((plan) =>
          h(RadioGroupItem, { key: plan, value: plan, ...items[plan] }, () => `Plan ${plan}`),
        ),
    ),
  )
  const radios = () => [...root.querySelectorAll<HTMLElement>('[role="radio"]')]
  const labels = () => [...root.querySelectorAll<HTMLElement>('[data-slot="radio-group-item"]')]
  return { value, root, radios, labels }
}

describe('RadioGroup', () => {
  describe('choosing', () => {
    it('chooses on a click on the radio or its text', async () => {
      const { value, radios } = plans()
      await userEvent.click(radios()[1]!)
      expect(value.value).toBe('team')
      await userEvent.click(page.getByText('Plan business'))
      expect(value.value).toBe('business')
      await nextTick()
      expect(radios().map((radio) => radio.getAttribute('aria-checked'))).toEqual([
        'false',
        'false',
        'true',
      ])
    })

    it('tabs onto the chosen item, and arrow keys choose and wrap', async () => {
      const { value, radios } = plans({ modelValue: 'team' })
      await tab()
      expect(document.activeElement).toBe(radios()[1])
      await arrow('ArrowDown')
      expect(value.value).toBe('business')
      await arrow('ArrowDown')
      expect(value.value).toBe('free')
      await arrow('ArrowUp')
      expect(value.value).toBe('business')
    })

    it.each(['vertical', 'horizontal'] as const)(
      'moves with all four arrows when %s',
      async (orientation) => {
        const { value, radios } = plans({ modelValue: 'free', orientation })
        radios()[0]!.focus()
        await arrow('ArrowRight')
        expect(value.value).toBe('team')
        await arrow('ArrowDown')
        expect(value.value).toBe('business')
        await arrow('ArrowLeft')
        expect(value.value).toBe('team')
        await arrow('ArrowUp')
        expect(value.value).toBe('free')
      },
    )
  })

  describe('layout and attributes', () => {
    it('lays items out in a column by default and in a row when horizontal', () => {
      const column = plans().root.querySelector<HTMLElement>('[role="radiogroup"]')!
      const row = plans({ orientation: 'horizontal' }).root.querySelector<HTMLElement>(
        '[role="radiogroup"]',
      )!
      expect(getComputedStyle(column).flexDirection).toBe('column')
      expect(getComputedStyle(row).flexDirection).toBe('row')
    })

    it.each([
      ['sm', 'size-3.5', 'text-sm'],
      ['md', 'size-4', 'text-sm'],
      ['lg', 'size-5', 'text-base'],
    ] as const)('applies size %s to every item', (size, radio, text) => {
      const { radios, labels } = plans({ size })
      expect(radios().every((element) => element.classList.contains(radio))).toBe(true)
      expect(labels().every((element) => element.classList.contains(text))).toBe(true)
    })

    it('merges class last on each part and passes item attributes to the radio', () => {
      const { root, radios, labels } = plans(
        { class: 'gap-gap-lg' },
        { team: { class: 'text-base', id: 'team-radio', 'aria-describedby': 'team-help' } },
      )
      const group = root.querySelector<HTMLElement>('[role="radiogroup"]')!
      expect(group.classList.contains('gap-gap-lg')).toBe(true)
      expect(group.classList.contains('gap-gap-sm')).toBe(false)
      expect(labels()[1]!.classList.contains('text-base')).toBe(true)
      expect(labels()[1]!.classList.contains('text-sm')).toBe(false)
      expect(radios()[1]!.id).toBe('team-radio')
      expect(radios()[1]!.getAttribute('aria-describedby')).toBe('team-help')
      expect(labels()[1]!.hasAttribute('id')).toBe(false)
    })
  })

  describe('states', () => {
    it("can't choose a disabled item, and arrows skip it", async () => {
      const { value, radios } = plans({ modelValue: 'free' }, { team: { disabled: true } })
      await userEvent.click(radios()[1]!, { force: true })
      expect(value.value).toBe('free')
      radios()[0]!.focus()
      await arrow('ArrowDown')
      expect(value.value).toBe('business')
    })

    it("can't choose anything in a disabled group", async () => {
      const { value, radios } = plans({ disabled: true })
      await userEvent.click(radios()[0]!, { force: true })
      expect(value.value).toBeUndefined()
    })

    it('mutes a disabled item’s text without fading it', () => {
      const { labels } = plans({}, { team: { disabled: true } })
      const [enabled, disabled] = labels()
      expect(getComputedStyle(disabled!).opacity).toBe('1')
      expect(getComputedStyle(disabled!).color).not.toBe(getComputedStyle(enabled!).color)
    })

    it('mutes every item’s text in a disabled group', () => {
      const enabled = plans().labels()[0]!
      const { labels } = plans({ disabled: true })
      for (const label of labels()) {
        expect(label.hasAttribute('data-disabled')).toBe(true)
        expect(getComputedStyle(label).color).not.toBe(getComputedStyle(enabled).color)
      }
    })

    it('keeps each item only as wide as its content in a column', () => {
      const { root, labels } = plans()
      const group = root.querySelector<HTMLElement>('[role="radiogroup"]')!
      expect(labels()[0]!.getBoundingClientRect().width).toBeLessThan(
        group.getBoundingClientRect().width / 2,
      )
    })

    it('fills the chosen radio with primary', () => {
      const { radios } = plans({ modelValue: 'team' })
      const [free, team] = radios().map((radio) => getComputedStyle(radio).backgroundColor)
      expect(team).not.toBe(free)
    })

    it('shows the focus ring on keyboard focus', async () => {
      const { radios } = plans()
      expect(getComputedStyle(radios()[0]!).boxShadow).toBe('none')
      await tab()
      expect(getComputedStyle(radios()[0]!).boxShadow).not.toBe('none')
    })
  })

  describe('forms', () => {
    function inForm(initial?: string) {
      const value = ref<string | undefined>(initial)
      const root = render(() =>
        h('form', [
          h(
            RadioGroup,
            {
              name: 'plan',
              required: true,
              'aria-label': 'Plan',
              modelValue: value.value,
              'onUpdate:modelValue': (next: string | undefined) => (value.value = next),
            },
            () => [
              h(RadioGroupItem, { value: 'free' }, () => 'Free'),
              h(RadioGroupItem, { value: 'team' }, () => 'Team'),
            ],
          ),
        ]),
      )
      return { value, root, form: root.querySelector('form')! }
    }

    it('submits the chosen value, and required blocks submit until one is chosen', async () => {
      const { value, form } = inForm()
      expect(form.checkValidity()).toBe(false)
      value.value = 'team'
      await nextTick()
      expect(form.checkValidity()).toBe(true)
      expect(new FormData(form).get('plan')).toBe('team')
    })

    it('leaves the field out of the form while nothing is chosen, as native radios do', () => {
      const { form } = inForm()
      expect(new FormData(form).has('plan')).toBe(false)
    })

    it('keeps the form in step with the shown choice after a form reset', async () => {
      const { form } = inForm('team')
      form.reset()
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(new FormData(form).get('plan')).toBe('team')
      expect(form.checkValidity()).toBe(true)
    })

    it('puts each form input under its radio, so a validation bubble points at it', () => {
      const { root } = inForm()
      // The last item, away from the page corner where a misplaced input would also land.
      const radio = [...root.querySelectorAll('[role="radio"]')].at(-1)!.getBoundingClientRect()
      const input = [...root.querySelectorAll('input[type="radio"]')]
        .at(-1)!
        .getBoundingClientRect()
      expect(Math.abs(input.left - radio.left)).toBeLessThan(1)
      expect(Math.abs(input.top - radio.top)).toBeLessThan(radio.height)
    })

    it('hands focus from a form input to its radio, so keys never change a hidden radio', async () => {
      const { value, root } = inForm()
      const form = root.querySelector('form')!
      form.reportValidity()
      const radios = [...root.querySelectorAll('[role="radio"]')]
      expect(radios).toContain(document.activeElement)
      await arrow('ArrowDown')
      expect(value.value).toBe('team')
      await nextTick()
      const checked = root.querySelector<HTMLInputElement>('input[type="radio"]:checked')
      expect(checked?.value).toBe('team')
    })

    it('fires input and change when the user chooses, and not when code sets the value', async () => {
      const { value, root } = inForm()
      const form = root.querySelector('form')!
      const events: string[] = []
      form.addEventListener('input', () => events.push('input'))
      form.addEventListener('change', () => events.push('change'))
      value.value = 'free'
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(events).toEqual([])
      await userEvent.click(page.getByText('Team'))
      await nextTick()
      expect(events).toEqual(['input', 'change'])
      // A click on the radio already chosen changes nothing, as with native radios.
      await userEvent.click(page.getByText('Team'))
      await nextTick()
      expect(events).toEqual(['input', 'change'])
    })

    it('marks the group required only when it has a name to enforce it with', () => {
      const root = render(() =>
        h(RadioGroup, { required: true, 'aria-label': 'Plan' }, () => [
          h(RadioGroupItem, { value: 'free' }, () => 'Free'),
        ]),
      )
      expect(root.querySelector('[role="radiogroup"]')!.getAttribute('aria-required')).not.toBe(
        'true',
      )
      expect(
        inForm().root.querySelector('[role="radiogroup"]')!.getAttribute('aria-required'),
      ).toBe('true')
    })
  })

  describe('layout and attributes', () => {
    it('takes any item id, quotes included, without a selector built from it', async () => {
      const root = render(() =>
        h(RadioGroup, { 'aria-label': 'Plan' }, () => [
          h(RadioGroupItem, { value: 'pro', id: 'plan"pro' }, () => 'Pro'),
        ]),
      )
      await nextTick()
      expect(root.querySelector('[role="radio"]')!.id).toBe('plan"pro')
    })

    it('keeps its own name when an outside label points at an item id', async () => {
      const root = render(() =>
        h('div', [
          h('label', { for: 'team' }, ['Team plan ', h('span', { 'aria-hidden': 'true' }, '*')]),
          h(RadioGroup, { 'aria-label': 'Plan' }, () => [
            h(RadioGroupItem, { value: 'team', id: 'team' }, () => 'Team'),
          ]),
        ]),
      )
      await nextTick()
      const radio = root.querySelector<HTMLElement>('[role="radio"]')!
      expect(radio.id).toBe('team')
      expect(radio.hasAttribute('aria-label')).toBe(false)
    })
  })

  describe('states', () => {
    it('draws the chosen dot with a border, which stays visible when colours are forced', () => {
      const { root } = plans({ modelValue: 'team' })
      const dot = root.querySelector('[role="radio"][aria-checked="true"] span')!
      expect(parseFloat(getComputedStyle(dot).borderTopWidth)).toBeGreaterThan(0)
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('radio-group', { mode })
      await expectNoAxeViolations()
    })
  })
})
