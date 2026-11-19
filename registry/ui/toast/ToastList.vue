<script setup lang="ts">
import {
  injectToastProviderContext,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastRoot,
  ToastTitle,
  useToastManager,
  type ToastObject,
} from 'reka-ui'
import { Button, buttonVariants } from '@/components/ui/button'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Icon } from '@/lib/icon'
import type { ToastData } from './toast'
import { toastVariants } from './toast.variants'

const props = defineProps<{ closeLabel: string; duration: number }>()

const { toasts, close } = useToastManager<ToastData>()
const provider = injectToastProviderContext()

const variant = (item: ToastObject<ToastData>) => item.data?.variant ?? 'neutral'

// Reka's timers lose track of their pause (its keyboard close marks them running while other
// toasts are paused, and it stops listening once the list empties), so Reka gets no timeout and
// each toast counts down here, paused while the list holds focus or the pointer, or while the
// window is in the background.
const focused = ref(false)
const hovered = ref(false)
// Read at mount and listened to after, so a toast that arrives while the window is in the
// background waits.
const windowFocused = ref(true)
const paused = computed(() => focused.value || hovered.value || !windowFocused.value)

// Read after every change to the toasts too: a focused toast removed by code fires no
// focusout in some browsers.
function readFocus() {
  focused.value = !!provider.viewport.value?.contains(document.activeElement)
}
// A toast removed from under a still pointer may fire no pointerleave. Only cleared here: a toast
// that appears under a resting pointer counts down until the pointer moves, as in Reka.
function readPointer() {
  if (!provider.viewport.value?.matches(':hover')) hovered.value = false
}
function onFocusOut(event: FocusEvent) {
  if (!provider.viewport.value?.contains(event.relatedTarget as Node | null)) focused.value = false
}
const onPointerMove = () => (hovered.value = true)
const onPointerLeave = () => (hovered.value = false)
const onWindowBlur = () => (windowFocused.value = false)
const onWindowFocus = () => (windowFocused.value = true)

watch(
  () => provider.viewport.value,
  (list, _, onCleanup) => {
    if (!list) return
    list.addEventListener('focusin', readFocus)
    list.addEventListener('focusout', onFocusOut)
    list.addEventListener('pointermove', onPointerMove)
    list.addEventListener('pointerleave', onPointerLeave)
    onCleanup(() => {
      list.removeEventListener('focusin', readFocus)
      list.removeEventListener('focusout', onFocusOut)
      list.removeEventListener('pointermove', onPointerMove)
      list.removeEventListener('pointerleave', onPointerLeave)
    })
  },
  { immediate: true },
)

interface Timer {
  // The toast it times: one dismissed and added again with its id is a new object.
  item: ToastObject<ToastData>
  updateKey: number
  duration: number
  remaining: number
  startedAt: number
  handle?: ReturnType<typeof setTimeout>
}
const timers = new Map<string, Timer>()

function stop(timer: Timer) {
  if (timer.handle === undefined) return
  clearTimeout(timer.handle)
  timer.handle = undefined
  timer.remaining -= performance.now() - timer.startedAt
}

function schedule() {
  const live = new Set<string>()
  for (const item of toasts.value) {
    const duration = item.data?.duration ?? props.duration
    const timed = duration > 0 && duration < Number.POSITIVE_INFINITY
    if (!item.open || !timed) continue
    live.add(item.id)
    let timer = timers.get(item.id)
    // Adding a toast again with its id, updating it or a new duration starts its time over.
    if (timer?.item !== item || timer.updateKey !== item.updateKey || timer.duration !== duration) {
      if (timer) clearTimeout(timer.handle)
      timer = { item, updateKey: item.updateKey, duration, remaining: duration, startedAt: 0 }
      timers.set(item.id, timer)
    }
    if (paused.value) stop(timer)
    else if (timer.handle === undefined) {
      timer.startedAt = performance.now()
      timer.handle = setTimeout(() => close(item.id), timer.remaining)
    }
  }
  for (const [id, timer] of timers) {
    if (live.has(id)) continue
    clearTimeout(timer.handle)
    timers.delete(id)
  }
}

// Focus and pointer are read first, so the schedule sees this change's pause.
watch(
  [toasts, () => props.duration],
  () => {
    readFocus()
    readPointer()
    schedule()
  },
  { flush: 'post' },
)
watch(paused, schedule, { flush: 'post' })

onMounted(() => {
  window.addEventListener('blur', onWindowBlur)
  window.addEventListener('focus', onWindowFocus)
  windowFocused.value = document.hasFocus()
  schedule()
})

// Reka's store puts the newest first; the list shows the newest at the bottom (toast.md), also
// for toasts added in the same tick.
const ordered = computed(() => [...toasts.value].reverse())
onBeforeUnmount(() => {
  window.removeEventListener('blur', onWindowBlur)
  window.removeEventListener('focus', onWindowFocus)
  for (const timer of timers.values()) clearTimeout(timer.handle)
})

// Reka closes every toast on an Escape pressed anywhere, from one window listener per toast.
// With focus in the list, every listener cancels the key and only the focused toast closes,
// focus moving to the list; the choice is made once per key press, so the order of the
// listeners doesn't matter. Elsewhere the key is left alone (cancelling it would keep a native
// dialog or popover open).
const decided = new WeakMap<Event, { inList: boolean; toast?: HTMLElement }>()
function onEscape(event: KeyboardEvent, id: string) {
  let choice = decided.get(event)
  if (!choice) {
    const active = document.activeElement
    const toast = active?.closest<HTMLElement>('[data-slot="toast"]')
    choice = { inList: !!active?.closest('[data-slot="toaster"]'), toast: toast ?? undefined }
    decided.set(event, choice)
  }
  if (!choice.inList) return
  event.preventDefault()
  if (choice.toast?.dataset.toastId !== id) return
  // Focus leaves the toast before it goes, also one already fading out.
  choice.toast.closest<HTMLElement>('[data-slot="toaster"]')?.focus()
  if (choice.toast.dataset.state === 'open') close(id)
}
</script>

<template>
  <ToastRoot
    v-for="item in ordered"
    :key="item.id"
    :toast="item"
    data-slot="toast"
    :data-toast-id="item.id"
    :data-variant="variant(item)"
    :class="toastVariants({ variant: variant(item) })"
    @escape-key-down="onEscape($event, item.id)"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <ToastTitle data-slot="toast-title" class="text-sm font-medium" />
      <ToastDescription data-slot="toast-description" class="text-sm" />
    </div>
    <ToastAction
      data-slot="toast-action"
      :class="buttonVariants({ variant: 'outline', size: 'sm' })"
    />
    <ToastClose as-child>
      <Button
        variant="ghost"
        size="sm"
        data-slot="toast-close"
        :aria-label="closeLabel"
        class="shrink-0"
      >
        <Icon name="close" class="size-4" />
      </Button>
    </ToastClose>
  </ToastRoot>
</template>
