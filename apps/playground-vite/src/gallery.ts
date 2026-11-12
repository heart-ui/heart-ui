import { createApp } from 'vue'
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
export function createGallery(path: string) {
  return createApp(DemoPage, { name: demoName(path), path })
}
