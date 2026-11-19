import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, provide } from 'vue'
import { render, unmountAll } from '../../../apps/playground-vite/test/harness'
import DemoStates from './DemoStates.vue'
import { demoStateKey, type DemoState, type ProvidedDemoState } from './demo-state'

afterEach(unmountAll)

const all: DemoState[] = ['default', 'empty', 'loading', 'error', 'long']

function mount(provided?: ProvidedDemoState, props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      if (provided) provide(demoStateKey, provided)
      return () =>
        h(DemoStates, props, {
          default: ({ state }: { state: string }) => h('p', { 'data-testid': 'shown' }, state),
        })
    },
  })
  return render(() => h(Host))
}

const shown = (root: HTMLElement) => root.querySelector('[data-testid="shown"]')?.textContent
const buttons = (root: HTMLElement) => [...root.querySelectorAll('[role="group"] button')]
const button = (root: HTMLElement, name: string) =>
  buttons(root).find((b) => b.textContent?.trim() === name)!

describe('DemoStates', () => {
  it('offers the states the gallery provides, in a labelled group', () => {
    const root = mount({ state: undefined, states: all })
    const group = root.querySelector('[role="group"]')!
    expect(group.getAttribute('aria-label')).toBe('Demo state')
    expect(buttons(root).map((b) => b.textContent?.trim())).toEqual(all)
    expect(shown(root)).toBe('default')
    expect(button(root, 'default').getAttribute('aria-pressed')).toBe('true')
  })

  it('offers only the states the item lists', () => {
    const root = mount({ state: undefined, states: ['default', 'empty'] })
    expect(buttons(root).map((b) => b.textContent?.trim())).toEqual(['default', 'empty'])
  })

  it('shows only default when nothing is provided', () => {
    const root = mount()
    expect(buttons(root).map((b) => b.textContent?.trim())).toEqual(['default'])
    expect(shown(root)).toBe('default')
  })

  it('takes its group label from groupLabel', () => {
    const root = mount({ state: undefined, states: all }, { groupLabel: 'Zustand' })
    expect(root.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Zustand')
  })

  it('starts in the state the gallery provides', () => {
    expect(shown(mount({ state: 'error', states: all }))).toBe('error')
  })

  it('falls back to default for a state it does not offer', () => {
    expect(shown(mount({ state: 'long', states: ['default', 'empty'] }))).toBe('default')
  })

  it('switches to the clicked state and marks it pressed, never as a primary button', async () => {
    const root = mount({ state: undefined, states: all })
    await userEvent.click(button(root, 'long'))
    expect(shown(root)).toBe('long')
    expect(button(root, 'long').getAttribute('aria-pressed')).toBe('true')
    expect(button(root, 'default').getAttribute('aria-pressed')).toBe('false')
    for (const b of buttons(root)) expect(b.className).not.toMatch(/\bbg-primary\b/)
  })
})
