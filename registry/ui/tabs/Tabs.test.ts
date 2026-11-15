import { ConfigProvider } from 'reka-ui'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  tab,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '.'

// Every test starts at the dialog reference's size; tests that change it get it back.
beforeEach(() => page.viewport(1024, 800))
afterEach(unmountAll)

function project(props: Record<string, unknown> = {}) {
  const value = ref((props.modelValue as string | undefined) ?? 'overview')
  render(() =>
    h(
      Tabs,
      {
        ...props,
        class: 'part-tabs',
        modelValue: value.value,
        'onUpdate:modelValue': (next: string | undefined) => (value.value = next ?? value.value),
      },
      () => [
        h(TabsList, { 'aria-label': 'Project', class: 'part-list' }, () => [
          h(TabsTrigger, { value: 'overview', class: 'part-trigger' }, () => 'Overview'),
          h(TabsTrigger, { value: 'activity' }, () => 'Activity'),
          h(TabsTrigger, { value: 'billing', disabled: true }, () => 'Billing'),
          h(TabsTrigger, { value: 'settings' }, () => 'Settings'),
        ]),
        h(TabsContent, { value: 'overview', class: 'part-content' }, () => 'Overview panel'),
        h(TabsContent, { value: 'activity' }, () => 'Activity panel'),
        h(TabsContent, { value: 'billing' }, () => 'Billing panel'),
        h(TabsContent, { value: 'settings' }, () => 'Settings panel'),
      ],
    ),
  )
  const tabs = () => [...document.querySelectorAll<HTMLElement>('[role="tab"]')]
  return { value, tabs }
}

// A minimal tab set as a vnode, for wrappers that set direction.
const project$ = () =>
  h(Tabs, { defaultValue: 'a' }, () => [
    h(TabsList, { 'aria-label': 'Direction' }, () => [
      h(TabsTrigger, { value: 'a' }, () => 'A'),
      h(TabsTrigger, { value: 'b' }, () => 'B'),
    ]),
  ])

describe('Tabs', () => {
  describe('activating', () => {
    it('activates a tab on click and shows its panel', async () => {
      const { value } = project()
      await expect.element(page.getByRole('tabpanel')).toHaveTextContent('Overview panel')
      await userEvent.click(page.getByRole('tab', { name: 'Activity' }))
      expect(value.value).toBe('activity')
      await expect.element(page.getByRole('tabpanel')).toHaveTextContent('Activity panel')
    })

    it("can't activate a disabled tab", async () => {
      const { value } = project()
      await userEvent.click(page.getByRole('tab', { name: 'Billing' }), { force: true })
      expect(value.value).toBe('overview')
    })
  })

  describe('keyboard', () => {
    it('moves along a horizontal list with right and left, skipping disabled, wrapping', async () => {
      const { value, tabs } = project()
      await tab()
      expect(document.activeElement).toBe(tabs()[0])
      await userEvent.keyboard('{ArrowRight}')
      expect(value.value).toBe('activity')
      await userEvent.keyboard('{ArrowRight}')
      expect(value.value).toBe('settings')
      await userEvent.keyboard('{ArrowRight}')
      expect(value.value).toBe('overview')
      await userEvent.keyboard('{ArrowLeft}')
      expect(value.value).toBe('settings')
      await userEvent.keyboard('{Home}')
      expect(value.value).toBe('overview')
      await userEvent.keyboard('{End}')
      expect(value.value).toBe('settings')
    })

    it('moves along a vertical list with down and up', async () => {
      const { value } = project({ orientation: 'vertical' })
      await tab()
      await userEvent.keyboard('{ArrowDown}')
      expect(value.value).toBe('activity')
      await userEvent.keyboard('{ArrowUp}')
      expect(value.value).toBe('overview')
    })

    it('tabs from the active tab into its panel', async () => {
      project()
      await tab()
      await tab()
      expect(document.activeElement?.getAttribute('role')).toBe('tabpanel')
      expect(getComputedStyle(document.activeElement!).boxShadow).not.toBe('none')
    })
  })

  describe('variants', () => {
    it('line: the active tab’s bar differs from the rule the other tabs draw', () => {
      const { tabs } = project({ variant: 'line' })
      const [active, inactive] = tabs().map((element) => getComputedStyle(element))
      expect(parseFloat(inactive!.borderBottomWidth)).toBeGreaterThan(0)
      expect(active!.borderBottomColor).not.toBe(inactive!.borderBottomColor)
    })

    it('pill: a muted track with a raised chip for the active tab', () => {
      const { tabs } = project({ variant: 'pill' })
      const list = document.querySelector<HTMLElement>('[role="tablist"]')!
      const [active, inactive] = tabs().map((element) => getComputedStyle(element))
      expect(getComputedStyle(list).backgroundColor).not.toBe(
        getComputedStyle(document.body).backgroundColor,
      )
      expect(active!.backgroundColor).not.toBe(inactive!.backgroundColor)
    })

    it('vertical: the list is a column beside the panels from the sm breakpoint', async () => {
      project({ orientation: 'vertical' })
      const root = document.querySelector<HTMLElement>('.part-tabs')!
      const list = document.querySelector<HTMLElement>('[role="tablist"]')!
      expect(getComputedStyle(root).flexDirection).toBe('row')
      expect(getComputedStyle(list).flexDirection).toBe('column')
    })

    it('merges class last on each part', () => {
      project()
      for (const part of ['tabs', 'list', 'trigger', 'content'])
        expect(
          document.querySelector(`.part-${part}`)!.className.endsWith(`part-${part}`),
          part,
        ).toBe(true)
    })
  })

  describe('roles', () => {
    it('wires tablist, tabs and panels together', async () => {
      const { tabs } = project({ orientation: 'vertical' })
      const list = page.getByRole('tablist', { name: 'Project' })
      await expect.element(list).toHaveAttribute('aria-orientation', 'vertical')
      const active = tabs()[0]!
      expect(active.getAttribute('aria-selected')).toBe('true')
      const panel = document.getElementById(active.getAttribute('aria-controls')!)!
      expect(panel.getAttribute('role')).toBe('tabpanel')
      expect(panel.getAttribute('aria-labelledby')).toBe(active.id)
    })
  })

  describe('variants', () => {
    it('line: every tab carries the rule, so wrapped rows keep it, and the active tab a primary bar', () => {
      render(() =>
        h('div', { class: 'w-60' }, [
          h(Tabs, { defaultValue: 't0' }, () => [
            h(TabsList, { 'aria-label': 'Many' }, () =>
              Array.from({ length: 8 }, (_, index) =>
                h(TabsTrigger, { value: `t${index}` }, () => `Tab ${index}`),
              ),
            ),
          ]),
        ]),
      )
      const triggers = [...document.querySelectorAll<HTMLElement>('[role="tab"]')]
      const tops = new Set(
        triggers.map((trigger) => Math.round(trigger.getBoundingClientRect().top)),
      )
      expect(tops.size).toBeGreaterThan(1)
      for (const trigger of triggers)
        expect(parseFloat(getComputedStyle(trigger).borderBottomWidth)).toBeGreaterThan(0)
      const [active, inactive] = triggers.map((trigger) => getComputedStyle(trigger))
      expect(active!.borderBottomColor).not.toBe(inactive!.borderBottomColor)
      // The inactive tabs draw the visible rule, in the `border` token's colour.
      const probe = document.createElement('div')
      probe.className = 'border border-border'
      document.body.append(probe)
      expect(inactive!.borderBottomColor).toBe(getComputedStyle(probe).borderTopColor)
    })

    it('stacks vertical tabs above the panels on a phone', async () => {
      await page.viewport(375, 800)
      project({ orientation: 'vertical' })
      expect(getComputedStyle(document.querySelector('.part-tabs')!).flexDirection).toBe('column')
    })
  })

  describe('activating', () => {
    it('starts on defaultValue without v-model', async () => {
      render(() =>
        h(Tabs, { defaultValue: 'b' }, () => [
          h(TabsList, { 'aria-label': 'Start' }, () => [
            h(TabsTrigger, { value: 'a' }, () => 'A'),
            h(TabsTrigger, { value: 'b' }, () => 'B'),
          ]),
          h(TabsContent, { value: 'a' }, () => 'Panel A'),
          h(TabsContent, { value: 'b' }, () => 'Panel B'),
        ]),
      )
      await expect.element(page.getByRole('tabpanel')).toHaveTextContent('Panel B')
    })

    it('looks disabled when the active tab is disabled', () => {
      const { tabs } = project({ modelValue: 'billing' })
      const billing = tabs()[2]!
      expect(billing.getAttribute('aria-selected')).toBe('true')
      const probe = document.createElement('div')
      probe.className = 'text-disabled-foreground'
      document.body.append(probe)
      expect(getComputedStyle(billing).color).toBe(getComputedStyle(probe).color)
    })
  })

  describe('keyboard', () => {
    it('shows the focus ring on the focused tab', async () => {
      const { tabs } = project()
      expect(getComputedStyle(tabs()[0]!).boxShadow).toBe('none')
      await tab()
      expect(getComputedStyle(tabs()[0]!).boxShadow).not.toBe('none')
    })
  })

  describe('roles', () => {
    it('never writes dir on the root or the list, so an RTL page lays tabs out right to left', () => {
      for (const wrap of ['page', 'provider'] as const) {
        render(() =>
          wrap === 'page'
            ? h('div', { dir: 'rtl' }, [project$()])
            : h('div', { dir: 'rtl' }, [h(ConfigProvider, { useId: () => 'x' }, () => project$())]),
        )
        const root = document.querySelector('[data-orientation]')!
        const list = document.querySelector('[role="tablist"]')!
        for (const element of [root, list]) {
          expect(element.getAttribute('dir'), wrap).toBeNull()
          expect(getComputedStyle(element).direction, wrap).toBe('rtl')
        }
        const [a, b] = [...document.querySelectorAll('[role="tab"]')].map((tab) =>
          tab.getBoundingClientRect(),
        )
        expect(b!.right, wrap).toBeLessThanOrEqual(a!.left)
        unmountAll()
      }
    })

    it.each(['page', 'provider without dir'] as const)(
      'moves with arrow keys in reading order on an RTL page (%s)',
      async (setup) => {
        render(() =>
          h('div', { dir: 'rtl' }, [
            setup === 'page'
              ? project$()
              : h(ConfigProvider, { useId: () => 'x' }, () => project$()),
          ]),
        )
        await tab()
        await userEvent.keyboard('{ArrowLeft}')
        expect(document.activeElement?.textContent).toBe('B')
        await userEvent.keyboard('{ArrowRight}')
        expect(document.activeElement?.textContent).toBe('A')
      },
    )

    it('lays out and moves right to left when given dir="rtl" on an LTR page', async () => {
      render(() =>
        h(Tabs, { defaultValue: 'a', dir: 'rtl' }, () => [
          h(TabsList, { 'aria-label': 'Direction' }, () => [
            h(TabsTrigger, { value: 'a' }, () => 'A'),
            h(TabsTrigger, { value: 'b' }, () => 'B'),
          ]),
        ]),
      )
      const [a, b] = [...document.querySelectorAll('[role="tab"]')].map((tab) =>
        tab.getBoundingClientRect(),
      )
      expect(b!.right).toBeLessThanOrEqual(a!.left)
      await tab()
      await userEvent.keyboard('{ArrowLeft}')
      expect(document.activeElement?.textContent).toBe('B')
    })

    it('moves with arrow keys in reading order under an RTL ConfigProvider', async () => {
      render(() => h('div', { dir: 'rtl' }, [h(ConfigProvider, { dir: 'rtl' }, () => project$())]))
      await tab()
      await userEvent.keyboard('{ArrowLeft}')
      expect(document.activeElement?.textContent).toBe('B')
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      await mountDemo('tabs', { mode })
      await expectNoAxeViolations()
    })
  })
})
