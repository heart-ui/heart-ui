// Helpers for component browser tests (Vitest browser mode on Playwright).
import axe from 'axe-core'
import { userEvent } from 'vitest/browser'
import { createApp, type App } from 'vue'
import { demos } from '../../gallery-rules'
import '../src/style.css'

const mounted: { app: App; root: HTMLElement }[] = []

/** Mounts the demo for an item name into a fresh element, in light or dark mode. */
export async function mountDemo(
  name: string,
  { mode = 'light' }: { mode?: 'light' | 'dark' } = {},
) {
  const load = demos.get(name)
  if (!load) throw new Error(`No demo named "${name}"`)
  document.documentElement.classList.toggle('dark', mode === 'dark')
  // A page landmark around the demo, as the gallery pages have.
  const root = document.createElement('main')
  document.body.append(root)
  const app = createApp((await load()).default)
  app.mount(root)
  mounted.push({ app, root })
  return root
}

/** Unmounts every demo and removes leftover fixtures; call it in afterEach. */
export function unmountAll() {
  for (const { app } of mounted.splice(0)) app.unmount()
  document.body.replaceChildren()
  document.documentElement.classList.remove('dark')
}

/** Fails with each axe rule id, its help text and the elements that break it. */
export async function expectNoAxeViolations(root: Element = document.body) {
  const { violations } = await axe.run(root, { resultTypes: ['violations'] })
  if (violations.length === 0) return
  const lines = violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(' ')).join(', ')})`,
  )
  throw new Error(`axe found ${violations.length} violation(s):\n${lines.join('\n')}`)
}

export const tab = () => userEvent.keyboard('{Tab}')
export const shiftTab = () => userEvent.keyboard('{Shift>}{Tab}{/Shift}')
/** Sends one key by its `KeyboardEvent.key` name, such as `Enter` or `ArrowDown`. */
// A single character is typed as itself, with `{` and `[` doubled because they open
// user-event descriptors; a longer name is a key descriptor such as `{Enter}`.
export const press = (key: string) =>
  userEvent.keyboard(key.length === 1 ? key.replace(/[{[]/, '$&$&') : `{${key}}`)
export const focused = () => document.activeElement
