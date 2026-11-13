import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { h, nextTick, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  press,
  render,
  tab,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Button } from '.'
import { buttonVariants } from './button.variants'

afterEach(unmountAll)

const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'link'] as const
const sizes = ['sm', 'md', 'lg'] as const
const label = () => 'Save'

describe('Button', () => {
  describe('variants and sizes', () => {
    it.each(variants.flatMap((variant) => sizes.map((size) => [variant, size] as const)))(
      'renders %s %s with its token classes',
      (variant, size) => {
        const root = render(() => h(Button, { variant, size }, label))
        const button = root.querySelector('button')!
        for (const name of buttonVariants({ variant, size }).split(' ')) {
          expect(button.classList.contains(name), name).toBe(true)
        }
      },
    )

    it('defaults to a secondary md button of type button and merges class last', () => {
      const root = render(() => h(Button, { class: 'w-full' }, label))
      const button = root.querySelector('button')!
      expect(button.getAttribute('type')).toBe('button')
      expect(button.className).toBe(
        buttonVariants({ variant: 'secondary', size: 'md', class: 'w-full' }),
      )
      expect(button.className.endsWith('w-full')).toBe(true)
    })
  })

  describe('disabled', () => {
    it('uses the native attribute on a button', () => {
      const onClick = vi.fn()
      const root = render(() => h(Button, { disabled: true, onClick }, label))
      const button = root.querySelector('button')!
      expect(button.disabled).toBe(true)
      button.click()
      expect(onClick).not.toHaveBeenCalled()
    })

    it('uses aria-disabled and tabindex -1 on a link, drops href, and blocks clicks', () => {
      const onClick = vi.fn()
      // The caller's tabindex and aria-disabled must not undo the disabled state.
      const root = render(() =>
        h(
          Button,
          {
            as: 'a',
            href: '#saved',
            disabled: true,
            tabindex: 0,
            'aria-disabled': 'false',
            onClick,
          },
          label,
        ),
      )
      const link = root.querySelector('a')!
      expect(link.getAttribute('aria-disabled')).toBe('true')
      expect(link.getAttribute('tabindex')).toBe('-1')
      expect(link.hasAttribute('type')).toBe(false)
      expect(link.hasAttribute('href')).toBe(false)
      link.click()
      expect(onClick).not.toHaveBeenCalled()
      expect(location.hash).not.toBe('#saved')
    })
  })

  describe('loading', () => {
    it('shows the spinner, sets aria-busy and aria-disabled, stays focusable and blocks clicks', async () => {
      const onClick = vi.fn()
      const root = render(() => h(Button, { loading: true, onClick }, label))
      const button = root.querySelector('button')!
      expect(button.getAttribute('aria-busy')).toBe('true')
      expect(button.getAttribute('aria-disabled')).toBe('true')
      expect(button.disabled).toBe(false)
      expect(button.querySelector('[data-slot="spinner"]')).not.toBeNull()
      await tab()
      expect(document.activeElement).toBe(button)
      button.click()
      await press('Enter')
      expect(onClick).not.toHaveBeenCalled()
    })

    it('keeps a loading link focusable and announced as a link once its href is dropped', async () => {
      const loading = ref(false)
      const root = render(() =>
        h(Button, { as: 'a', href: '/export', loading: loading.value }, label),
      )
      const link = root.querySelector('a')!
      link.focus()
      loading.value = true
      await nextTick()
      expect(link.hasAttribute('href')).toBe(false)
      expect(link.getAttribute('role')).toBe('link')
      expect(link.getAttribute('tabindex')).toBe('0')
      expect(document.activeElement).toBe(link)
    })

    it("keeps the caller's own attributes when not inert", () => {
      const root = render(() =>
        h(
          Button,
          { as: 'a', href: '#x', role: 'tab', 'aria-disabled': 'false', 'data-disabled': 'no' },
          label,
        ),
      )
      const link = root.querySelector('a')!
      expect(link.getAttribute('role')).toBe('tab')
      expect(link.getAttribute('aria-disabled')).toBe('false')
      expect(link.getAttribute('data-disabled')).toBe('no')
    })

    it("keeps the caller's tabindex and role on a loading link", () => {
      const root = render(() =>
        h(Button, { as: 'a', href: '#x', loading: true, tabindex: 2, role: 'menuitem' }, label),
      )
      const link = root.querySelector('a')!
      expect(link.getAttribute('tabindex')).toBe('2')
      expect(link.getAttribute('role')).toBe('menuitem')
    })

    it('leaves href on an element other than a link', () => {
      const root = render(() => h(Button, { as: 'span', href: '#x', loading: true }, label))
      expect(root.querySelector('span[href]')).not.toBeNull()
    })

    it("keeps the caller's aria-busy when not loading", () => {
      const root = render(() => h(Button, { 'aria-busy': 'true' }, label))
      expect(root.querySelector('button')!.getAttribute('aria-busy')).toBe('true')
    })

    it('blocks a real mouse click without passing it to the parent', async () => {
      const onClick = vi.fn()
      const onRow = vi.fn()
      const root = render(() =>
        h('div', { onClick: onRow }, [h(Button, { loading: true, onClick }, label)]),
      )
      // force: Playwright otherwise waits for an aria-disabled element to become enabled.
      await userEvent.click(root.querySelector('button')!, { force: true })
      expect(onClick).not.toHaveBeenCalled()
      expect(onRow).not.toHaveBeenCalled()
    })

    it('stays at full opacity, unlike disabled', () => {
      const root = render(() =>
        h('div', [h(Button, { loading: true }, label), h(Button, { disabled: true }, label)]),
      )
      const [loading, disabled] = root.querySelectorAll('button')
      expect(getComputedStyle(loading!).opacity).toBe('1')
      expect(Number(getComputedStyle(disabled!).opacity)).toBeLessThan(1)
    })

    it('shows the spinner over the content, which stays readable', () => {
      const root = render(() =>
        h(
          Button,
          { loading: true },
          { leading: () => h('span', { 'data-test': 'leading' }), default: label },
        ),
      )
      expect(root.querySelector('[data-test="leading"]')).not.toBeNull()
      expect(root.querySelector('[data-slot="spinner"]')).not.toBeNull()
      expect(root.querySelector('button')!.textContent).toContain('Save')
    })

    it.each([
      ['without a leading slot', { default: label }],
      ['with a leading slot', { leading: () => h('span', { class: 'size-4' }), default: label }],
      [
        'with a larger leading icon',
        { leading: () => h('span', { class: 'size-6' }), default: label },
      ],
      ['with an empty leading slot', { leading: () => [], default: label }],
    ])('keeps the width when loading toggles %s', async (_, slots) => {
      const loading = ref(false)
      const root = render(() => h(Button, { loading: loading.value }, slots))
      const button = root.querySelector('button')!
      const before = button.getBoundingClientRect().width
      loading.value = true
      await nextTick()
      expect(button.getBoundingClientRect().width).toBe(before)
    })
  })

  describe('hover', () => {
    // transition-none so the color is read after the change, not mid-transition.
    async function hovered(props: Record<string, unknown>) {
      const root = render(() =>
        h(Button, { variant: 'primary', class: 'transition-none', ...props }, label),
      )
      const element = root.firstElementChild as HTMLElement
      const before = getComputedStyle(element).backgroundColor
      await userEvent.hover(element, { force: true })
      return { before, after: getComputedStyle(element).backgroundColor }
    }

    it('changes an enabled button on hover', async () => {
      const { before, after } = await hovered({})
      expect(after).not.toBe(before)
    })

    it.each([
      ['a disabled button', { disabled: true }],
      ['a disabled link', { as: 'a', href: '#x', disabled: true }],
      ['a loading button', { loading: true }],
    ])('does not change %s on hover', async (_, props) => {
      const { before, after } = await hovered(props)
      expect(after).toBe(before)
    })
  })

  describe('keyboard', () => {
    it.each(['Enter', ' '])('activates on %j', async (key) => {
      const onClick = vi.fn()
      render(() => h(Button, { onClick }, label))
      await tab()
      await press(key)
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('shows the focus ring for keyboard focus only', async () => {
      const root = render(() => h(Button, null, label))
      const button = root.querySelector('button')!
      expect(getComputedStyle(button).boxShadow).toBe('none')
      await tab()
      expect(document.activeElement).toBe(button)
      expect(getComputedStyle(button).boxShadow).not.toBe('none')
      button.blur()
      await userEvent.click(button)
      expect(document.activeElement).toBe(button)
      expect(getComputedStyle(button).boxShadow).toBe('none')
    })
  })

  describe('as and asChild', () => {
    it('renders a link with as="a"', () => {
      const root = render(() => h(Button, { as: 'a', href: '/docs' }, label))
      const link = root.querySelector('a')!
      expect(link.getAttribute('href')).toBe('/docs')
      expect(link.className).toContain('rounded-button')
    })

    it('merges onto the child element with asChild', () => {
      const root = render(() =>
        h(Button, { asChild: true, variant: 'primary' }, () => h('a', { href: '/home' }, 'Home')),
      )
      const link = root.querySelector('a')!
      expect(root.querySelector('button')).toBeNull()
      expect(link.getAttribute('href')).toBe('/home')
      expect(link.className).toContain('bg-primary')
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('button', { mode })
      await expectNoAxeViolations()
    })
  })
})
