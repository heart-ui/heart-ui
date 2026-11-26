<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

// The demo runs in a frame so a dialog it opens, or anything it portals, stays inside the preview.
// `overlay`: the demo opens a layer outside its own box (a dialog, a menu), so the frame keeps room for it.
// `path`: a page to show instead of the item's demo page (the landing page's showcase).
// `theme`: a theme preset applied inside the frame as `data-heart-theme` (presets.css).
const props = defineProps<{
  name: string
  title: string
  overlay?: boolean
  path?: string
  theme?: string
}>()

const { isDark } = useData()
const frame = ref<HTMLIFrameElement>()
const height = ref<number>()
let observer: ResizeObserver | undefined

// A demo may focus itself on load (the dialog demo opens its dialog). Unless the reader pointed at, typed in
// or tabbed into the frame, that focus goes back where the reader had it.
let readerFocus: Element | undefined
let usedFrame = false
let tabbing = false
const useFrame = () => (usedFrame = true)

function onPageFocus(event: FocusEvent) {
  if (event.target instanceof Element && event.target !== frame.value) readerFocus = event.target
}
function onPageKey(event: KeyboardEvent) {
  tabbing = event.type === 'keydown' && event.key === 'Tab'
}

function releaseFocus() {
  if (usedFrame || !frame.value || document.activeElement !== frame.value) return
  // Tab's keyup lands inside the frame, so tabbing in counts as using it from then on.
  if (tabbing) {
    usedFrame = true
    return
  }
  if (
    readerFocus instanceof HTMLElement &&
    readerFocus.isConnected &&
    readerFocus !== document.body
  ) {
    readerFocus.focus({ preventScroll: true })
  } else {
    frame.value.blur()
  }
}

function frameWindow() {
  try {
    const view = frame.value?.contentWindow
    return view?.document.location.href === 'about:blank' ? undefined : (view ?? undefined)
  } catch {
    return undefined
  }
}

function syncMode() {
  const root = frameWindow()?.document.documentElement
  if (!root) return
  root.classList.toggle('dark', isDark.value)
  if (props.theme) root.setAttribute('data-heart-theme', props.theme)
  else root.removeAttribute('data-heart-theme')
}

function connect() {
  const view = frameWindow()
  if (!view || !frame.value) return
  syncMode()
  for (const type of ['pointerdown', 'keydown']) {
    view.document.addEventListener(type, useFrame, { capture: true })
  }
  view.document.addEventListener('focusin', releaseFocus)
  releaseFocus()
  observer?.disconnect()
  const element = frame.value
  const body = view.document.body
  // The frame's own ResizeObserver: observations are delivered per document.
  const resize = new (view as Window & typeof globalThis).ResizeObserver(() => {
    const content = Math.max(body.scrollHeight, Math.ceil(body.getBoundingClientRect().height))
    height.value = content + element.offsetHeight - element.clientHeight
  })
  resize.observe(body)
  observer = resize
}

// The frame can finish loading before hydration attaches the load listener.
onMounted(() => {
  document.addEventListener('focusin', onPageFocus)
  document.addEventListener('keydown', onPageKey, { capture: true })
  document.addEventListener('keyup', onPageKey, { capture: true })
  if (frameWindow()?.document.readyState === 'complete') connect()
})
watch([isDark, () => props.theme], syncMode)
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('focusin', onPageFocus)
  document.removeEventListener('keydown', onPageKey, { capture: true })
  document.removeEventListener('keyup', onPageKey, { capture: true })
})
</script>

<template>
  <iframe
    ref="frame"
    class="demo-preview"
    :class="{ 'demo-preview--overlay': props.overlay }"
    loading="lazy"
    :src="withBase(props.path ?? `/demo/${props.name}`)"
    :title="`${props.title} preview`"
    :style="height ? { blockSize: `${height}px` } : undefined"
    @load="connect"
  />
</template>
