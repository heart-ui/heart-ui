import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Label } from '.'

afterEach(unmountAll)

function field(props: Record<string, unknown> = {}) {
  return render(() =>
    h('div', [
      h(Label, { for: 'email', ...props }, () => 'Email'),
      h('input', { id: 'email', type: 'email' }),
    ]),
  )
}

describe('Label', () => {
  describe('label element', () => {
    it('renders a label with for, its slot, attributes and class merged last', () => {
      const root = render(() =>
        h(
          Label,
          { for: 'name', id: 'name-label', 'data-test': 'x', class: 'text-base' },
          () => 'Full name',
        ),
      )
      const label = root.querySelector('label')!
      expect(label.htmlFor).toBe('name')
      expect(label.id).toBe('name-label')
      expect(label.dataset.test).toBe('x')
      expect(label.textContent).toBe('Full name')
      // cn() lets the caller's text size win over the default one.
      expect(label.className).toMatch(/(^| )text-base( |$)/)
      expect(label.className).not.toMatch(/(^| )text-sm( |$)/)
    })

    it('focuses the control it names on click', async () => {
      const root = field()
      await userEvent.click(root.querySelector('label')!)
      expect(document.activeElement).toBe(root.querySelector('input'))
    })

    it('names and focuses a control it wraps, with no for', async () => {
      const root = render(() => h(Label, null, () => ['Notes', h('input', { type: 'text' })]))
      await expect.element(page.getByRole('textbox', { name: 'Notes' })).toBeVisible()
      await userEvent.click(page.getByText('Notes'))
      expect(document.activeElement).toBe(root.querySelector('input'))
    })

    it('still names a disabled control', async () => {
      render(() =>
        h('div', [
          h(Label, { for: 'company' }, () => 'Company'),
          h('input', { id: 'company', disabled: true }),
        ]),
      )
      await expect.element(page.getByRole('textbox', { name: 'Company' })).toBeDisabled()
    })
  })

  describe('required', () => {
    it('shows a hidden marker and names the control "Email required" by default', async () => {
      const root = field({ required: true })
      const marker = root.querySelector('[data-slot="required-marker"]')!
      expect(marker.getAttribute('aria-hidden')).toBe('true')
      expect(marker.textContent).toBe(' *')
      // The leading space keeps "Email required" apart wherever sr-only styles don't apply.
      expect(root.querySelector('.sr-only')!.textContent).toBe(' required')
      expect(root.querySelector('label')!.textContent).toBe('Email * required')
      await expect.element(page.getByRole('textbox', { name: 'Email required' })).toBeVisible()
    })

    it('reads requiredLabel in place of the marker', async () => {
      field({ required: true, requiredLabel: 'obligatoire' })
      await expect.element(page.getByRole('textbox', { name: 'Email obligatoire' })).toBeVisible()
    })

    it('renders neither the marker nor the text when not required', async () => {
      const root = field()
      expect(root.querySelector('[data-slot="required-marker"]')).toBeNull()
      expect(root.querySelector('.sr-only')).toBeNull()
      await expect.element(page.getByRole('textbox', { name: 'Email', exact: true })).toBeVisible()
    })
  })

  describe('double click', () => {
    it("doesn't select the label text", () => {
      const label = field().querySelector('label')!
      const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true, detail: 2 })
      label.dispatchEvent(press)
      expect(press.defaultPrevented).toBe(true)
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('label', { mode })
      await expectNoAxeViolations()
    })
  })
})
