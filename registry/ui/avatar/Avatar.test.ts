import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import {
  expectNoAxeViolations,
  mountDemo,
  render,
  unmountAll,
} from '../../../apps/playground-vite/test/harness'
import { Avatar, AvatarFallback, AvatarImage } from '.'

afterEach(unmountAll)

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
const BROKEN = 'data:image/png;base64,AAAA'

/** A computed style of a probe element carrying the given utility classes. */
function probe(className: string, read: (style: CSSStyleDeclaration) => string) {
  const element = document.createElement('span')
  element.className = className
  document.body.append(element)
  const value = read(getComputedStyle(element))
  element.remove()
  return value
}

/** Waits until the avatar's image has failed: the element finished with no picture. */
async function failed(root: Element) {
  await vi.waitFor(() => {
    const image = root.querySelector<HTMLImageElement>('[data-slot="avatar-image"]')!
    expect(image.complete && image.naturalWidth === 0).toBe(true)
  })
  await nextTick()
}

const part = (root: Element, slot: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${slot}"]`)

function avatar(
  props: Record<string, unknown> = {},
  image: Record<string, unknown> | null = { src: PIXEL, alt: 'Ada Lovelace' },
  fallback: Record<string, unknown> = {},
) {
  return render(() =>
    h(Avatar, props, () => [
      image ? h(AvatarImage, image as { src: string; alt: string }) : null,
      h(AvatarFallback, fallback, () => 'AL'),
    ]),
  )
}

describe('Avatar', () => {
  describe('size', () => {
    it.each([
      ['sm', 'text-xs'],
      ['md', 'text-sm'],
      ['lg', 'text-base'],
    ] as const)('is a control-%s circle with %s initials', (size, text) => {
      const root = part(avatar({ size }, null), 'avatar')!
      const control = parseFloat(probe(`block h-control-${size}`, (style) => style.height))
      const box = root.getBoundingClientRect()
      expect(box.width).toBe(control)
      expect(box.height).toBe(control)
      expect(getComputedStyle(root).borderRadius).toBe(
        probe('rounded-full', (style) => style.borderRadius),
      )
      expect(getComputedStyle(root).fontSize).toBe(probe(text, (style) => style.fontSize))
    })

    it('is md by default', () => {
      const root = part(avatar({}, null), 'avatar')!
      expect(root.getBoundingClientRect().width).toBe(
        parseFloat(probe('block h-control-md', (style) => style.height)),
      )
    })
  })

  describe('image', () => {
    it('shows the loaded image, filling the circle, and drops the fallback', async () => {
      const root = avatar()
      await vi.waitFor(() => expect(part(root, 'avatar-fallback')).toBeNull())
      const image = part(root, 'avatar-image') as HTMLImageElement
      expect(image.style.display).not.toBe('none')
      expect(image.alt).toBe('Ada Lovelace')
      expect(image.getAttribute('role')).toBe('img')
      const box = image.getBoundingClientRect()
      const circle = part(root, 'avatar')!.getBoundingClientRect()
      expect(box.width).toBe(circle.width)
      expect(box.height).toBe(circle.height)
    })

    it('is presentational with an empty alt', async () => {
      const root = avatar({}, { src: PIXEL, alt: '' })
      await vi.waitFor(() => expect(part(root, 'avatar-fallback')).toBeNull())
      expect(part(root, 'avatar-image')!.getAttribute('role')).toBe('presentation')
    })

    it('is presentational with a whitespace-only alt', async () => {
      const root = avatar({}, { src: PIXEL, alt: '  ' })
      await vi.waitFor(() => expect(part(root, 'avatar-fallback')).toBeNull())
      expect(part(root, 'avatar-image')!.getAttribute('role')).toBe('presentation')
      expect(part(root, 'avatar-image')!.getAttribute('alt')).toBe('')
    })
  })

  describe('fallback', () => {
    it('shows the initials on muted once the image fails', async () => {
      const root = avatar({}, { src: BROKEN, alt: 'Ada Lovelace' })
      await failed(root)
      const image = part(root, 'avatar-image')!
      expect(image.style.display).toBe('none')
      const fallback = part(root, 'avatar-fallback')!
      expect(fallback.querySelector('[aria-hidden="true"]')!.textContent).toBe('AL')
      expect(probe('bg-muted', (style) => style.backgroundColor)).not.toBe(
        probe('bg-transparent', (style) => style.backgroundColor),
      )
      expect(getComputedStyle(fallback).backgroundColor).toBe(
        probe('bg-muted', (style) => style.backgroundColor),
      )
      expect(getComputedStyle(fallback).color).toBe(
        probe('text-muted-foreground', (style) => style.color),
      )
    })

    it("reads the image's name, not the initials, once a named image fails", async () => {
      const root = avatar({}, { src: BROKEN, alt: 'Ada Lovelace' })
      await failed(root)
      const fallback = part(root, 'avatar-fallback')!
      expect(fallback.querySelector('[aria-hidden="true"]')!.textContent).toBe('AL')
      const name = fallback.querySelector('.sr-only')!
      expect(name.textContent).toBe('Ada Lovelace')
      expect(name.closest('[aria-hidden="true"]')).toBeNull()
    })

    it('reads the initials when there is no image', () => {
      const root = avatar({}, null)
      const fallback = part(root, 'avatar-fallback')!
      expect(fallback.textContent).toBe('AL')
      expect(fallback.querySelector('[aria-hidden="true"]')).toBeNull()
      expect(fallback.querySelector('.sr-only')).toBeNull()
    })

    it('comes back when a loaded image is removed', async () => {
      const shown = ref(true)
      const root = render(() =>
        h(Avatar, null, () => [
          shown.value ? h(AvatarImage, { src: PIXEL, alt: 'Ada Lovelace' }) : null,
          h(AvatarFallback, null, () => 'AL'),
        ]),
      )
      await vi.waitFor(() => expect(part(root, 'avatar-fallback')).toBeNull())
      shown.value = false
      await nextTick()
      const fallback = part(root, 'avatar-fallback')!
      expect(fallback.textContent).toBe('AL')
      expect(fallback.querySelector('.sr-only')).toBeNull()
    })

    it('stays hidden when one of two images goes and the other has loaded', async () => {
      const images = ref(['old', 'new'])
      const root = render(() =>
        h(Avatar, null, () => [
          ...images.value.map((key) =>
            h(AvatarImage, { key, src: PIXEL, alt: key === 'new' ? 'Ada Lovelace' : 'Old name' }),
          ),
          h(AvatarFallback, null, () => 'AL'),
        ]),
      )
      await vi.waitFor(() => expect(part(root, 'avatar-fallback')).toBeNull())
      images.value = ['new']
      await nextTick()
      await nextTick()
      expect(part(root, 'avatar-fallback')).toBeNull()
      images.value = []
      await nextTick()
      expect(part(root, 'avatar-fallback')!.textContent).toBe('AL')
    })
  })

  describe('delay', () => {
    it('shows the fallback only after delayMs', async () => {
      const root = avatar({}, null, { delayMs: 300 })
      await nextTick()
      expect(part(root, 'avatar-fallback')).toBeNull()
      await vi.waitFor(() => expect(part(root, 'avatar-fallback')).not.toBeNull(), {
        timeout: 1000,
      })
    })

    it('shows the fallback at once when delayMs drops to 0 before it fires', async () => {
      const delay = ref(5000)
      const root = render(() =>
        h(Avatar, null, () => [h(AvatarFallback, { delayMs: delay.value }, () => 'AL')]),
      )
      await nextTick()
      expect(part(root, 'avatar-fallback')).toBeNull()
      delay.value = 0
      await nextTick()
      await nextTick()
      expect(part(root, 'avatar-fallback')!.textContent).toBe('AL')
    })

    it('shows the fallback at once with delayMs 0', async () => {
      const root = avatar({}, null, { delayMs: 0 })
      await nextTick()
      expect(part(root, 'avatar-fallback')!.textContent).toBe('AL')
    })
  })

  describe('attributes', () => {
    it('passes attributes through each part and merges class last', async () => {
      const root = render(() =>
        h(Avatar, { id: 'who', 'aria-hidden': 'true', class: 'size-control-lg' }, () => [
          h(AvatarImage, { src: PIXEL, alt: '', 'data-test': 'img', class: 'object-contain' }),
          h(AvatarFallback, { 'data-test': 'fb', class: 'bg-primary' }, () => 'AL'),
        ]),
      )
      const circle = part(root, 'avatar')!
      expect(circle.id).toBe('who')
      expect(circle.getAttribute('aria-hidden')).toBe('true')
      expect(circle.className).toMatch(/(^| )size-control-lg( |$)/)
      expect(circle.className).not.toMatch(/(^| )size-control-md( |$)/)
      const fallback = part(root, 'avatar-fallback')!
      expect(fallback.dataset.test).toBe('fb')
      expect(fallback.className).toMatch(/(^| )bg-primary( |$)/)
      expect(fallback.className).not.toMatch(/(^| )bg-muted( |$)/)
      const image = part(root, 'avatar-image')!
      expect(image.dataset.test).toBe('img')
      expect(image.className).toMatch(/(^| )object-contain( |$)/)
      expect(image.className).not.toMatch(/(^| )object-cover( |$)/)
    })
  })

  describe('axe', () => {
    it.each(['light', 'dark'] as const)('reports no violations in the %s demo', async (mode) => {
      const root = await mountDemo('avatar', { mode })
      // Audit the settled demo: every image has loaded or failed, and each loaded one shows.
      await vi.waitFor(() => {
        const images = [...root.querySelectorAll<HTMLImageElement>('[data-slot="avatar-image"]')]
        expect(images.length).toBeGreaterThan(0)
        for (const image of images) {
          expect(image.complete).toBe(true)
          expect(image.style.display === 'none').toBe(image.naturalWidth === 0)
        }
      })
      await expectNoAxeViolations()
    })
  })
})
