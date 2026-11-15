<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { ToastProvider, ToastViewport } from 'reka-ui'
import { cn } from '@/lib/utils/utils'
import { toastManager } from './toast'
import ToastList from './ToastList.vue'

interface ToasterProps {
  duration?: number
  closeLabel?: string
  regionLabel?: string
  announceLabel?: string
  class?: ClassValue
}

// The provider renders no element, so attributes go to the toast list by hand.
defineOptions({ name: 'HToaster', inheritAttrs: false })

const props = withDefaults(defineProps<ToasterProps>(), {
  duration: 5000,
  closeLabel: 'Close',
  regionLabel: 'Notifications ({hotkey})',
  announceLabel: 'Notification',
  class: undefined,
})
</script>

<template>
  <!-- Swipe is off: showing the drag needs Reka's swipe variables in an arbitrary-value class. -->
  <ToastProvider :toast-manager="toastManager" :label="props.announceLabel" disable-swipe>
    <ToastList :close-label="props.closeLabel" :duration="props.duration" />
    <ToastViewport
      v-bind="$attrs"
      :label="props.regionLabel"
      data-slot="toaster"
      :class="
        cn(
          // The list lets clicks through around its toasts and scrolls once they fill the screen.
          'pointer-events-none fixed end-0 bottom-0 z-toast flex max-h-dvh w-full max-w-sm flex-col',
          'gap-gap-sm overflow-y-auto p-page-px',
          // F8 focuses the list, so it shows a ring while it holds toasts.
          'outline-hidden not-empty:focus-visible:ring not-empty:focus-visible:ring-ring',
          props.class,
        )
      "
    />
  </ToastProvider>
</template>
