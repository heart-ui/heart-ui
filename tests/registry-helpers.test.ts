import { execFileSync } from 'node:child_process'
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

describe('cn with Heart UI token utilities', () => {
  it('keeps the focus ring offset width and color apart', () => {
    expect(cn('ring-offset-focus', 'ring-offset-background')).toBe(
      'ring-offset-focus ring-offset-background',
    )
  })

  it.each([
    ['h-control-md', 'h-control-lg'],
    ['px-control-px-md', 'px-4'],
    ['gap-gap-sm', 'gap-gap-lg'],
    ['rounded-button', 'rounded-lg'],
    ['rounded-input', 'rounded-none'],
    ['rounded-dialog', 'rounded-full'],
    ['p-4', 'px-page-px'],
    ['duration-fast', 'duration-slow'],
    ['z-overlay', 'z-modal'],
    ['max-w-content-max', 'max-w-content-narrow'],
    ['ease-standard', 'ease-in'],
    ['animate-fade-in', 'animate-pop-out'],
    ['animate-pop-in', 'animate-slide-in'],
  ])('lets the later of %s and %s win', (first, second) => {
    expect(cn(first, second)).toBe(first === 'p-4' ? `${first} ${second}` : second)
  })
})

describe('Icon', () => {
  it.each([
    ['check-sm', 'fluent:checkmark-12-filled'],
    ['check', 'fluent:checkmark-20-regular'],
    ['minus-sm', 'fluent:subtract-12-filled'],
    ['chevron-down', 'fluent:chevron-down-20-regular'],
    ['close', 'fluent:dismiss-20-regular'],
    ['search', 'fluent:search-20-regular'],
    ['spinner', 'fluent:spinner-ios-20-regular'],
  ] as const)('maps %s to %s', (name, id) => {
    expect(fluent[name].id).toBe(id)
  })

  it('renders the SVG on the server from bundled data, with no network', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    const html = await renderToString(createSSRApp({ render: () => h(Icon, { name: 'close' }) }))
    expect(html).toMatch(/<svg[^>]*viewBox="0 0 20 20"[^>]*>.*<path/)
    expect(fetch).not.toHaveBeenCalled()
    fetch.mockRestore()
  })
  it('bundles exactly what @iconify-json/fluent has for each id', () => {
    expect(() =>
      execFileSync('node', ['scripts/icons.ts', '--check'], { stdio: 'pipe' }),
    ).not.toThrow()
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
