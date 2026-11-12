import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import { Icon } from '../registry/lib/icon'
import { fluent } from '../registry/lib/icon/sets/fluent'
import { cn } from '../registry/lib/utils/utils'

describe('cn', () => {
  it('joins conditional classes and lets the later Tailwind class win', () => {
    const state = { hidden: false }
    expect(cn('p-2', state.hidden && 'hidden', ['p-4'], { 'text-sm': true, block: false })).toBe(
      'p-4 text-sm',
    )
  })
})

describe('Icon', () => {
  it.each([
    ['check', 'fluent:checkmark-20-regular'],
    ['chevron-down', 'fluent:chevron-down-20-regular'],
    ['close', 'fluent:dismiss-20-regular'],
    ['search', 'fluent:search-20-regular'],
    ['spinner', 'fluent:spinner-ios-20-regular'],
  ] as const)('maps %s to %s', (name, id) => {
    expect(fluent[name]).toBe(id)
  })

  it('renders hidden from assistive tech with class merged last', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(Icon, { name: 'check', class: 'text-primary' }) }),
    )
    expect(html).toMatch(/aria-hidden="true"/)
    expect(html).toMatch(/class="[^"]*shrink-0[^"]*text-primary"/)
  })
  it('accepts a false class without a prop warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await renderToString(createSSRApp({ render: () => h(Icon, { name: 'check', class: false }) }))
    expect(warn.mock.calls.flat().join(' ')).not.toMatch(/Invalid prop/)
    warn.mockRestore()
  })
})
