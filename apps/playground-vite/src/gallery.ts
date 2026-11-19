import { createApp } from 'vue'
import { demoStateKey, galleryState } from '../../gallery-rules'
import DemoPage from './DemoPage.vue'

function demoName(path: string) {
  const segment = /^\/demo\/([^/]+)\/?$/.exec(path)?.[1]
  if (!segment) return undefined
  try {
    return decodeURIComponent(segment)
  } catch {
    return undefined
  }
}

/** The gallery for a URL path: `/demo/<name>` renders that item's demo, anything else not found. */
export function createGallery(path: string, search = '') {
  const name = demoName(path)
  // getAll, so a repeated parameter reaches first() as the Nuxt route's array does.
  const state = new URLSearchParams(search).getAll('state')
  return createApp(DemoPage, { name, path }).provide(
    demoStateKey,
    galleryState(name ?? '', { state }),
  )
}
