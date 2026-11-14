<script lang="ts">
import type { InjectionKey, Ref } from 'vue'

/** How many `DialogDescription`s the content holds; it drops `aria-describedby` at zero. */
export const descriptionKey: InjectionKey<Ref<number>> = Symbol('dialog-description')
</script>

<script setup lang="ts">
import type { ClassValue } from 'clsx'
import {
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogContent as RekaDialogContent,
  injectDialogRootContext,
} from 'reka-ui'
import { nextTick, provide, ref, useAttrs, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'
import { dialogVariants, type DialogVariants } from './dialog.variants'

interface DialogContentProps {
  size?: NonNullable<DialogVariants['size']>
  /** `false` keeps the dialog open on Escape and on a click outside. */
  dismissible?: boolean
  showClose?: boolean
  closeLabel?: string
  class?: ClassValue
}

// The root is the portal, so attributes go to the content element by hand.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<DialogContentProps>(), {
  size: 'md',
  dismissible: true,
  showClose: true,
  closeLabel: 'Close',
  class: undefined,
})
const emit = defineEmits<{ close: [] }>()
const attrs = useAttrs()
const root = injectDialogRootContext()

const descriptions = ref(0)
provide(descriptionKey, descriptions)
// Reka always points aria-describedby at the description id, which dangles without a description.
// Read in the render, which reruns when attrs change; a computed doesn't track `in` or spread.
function forwarded() {
  return descriptions.value > 0 || 'aria-describedby' in attrs
    ? attrs
    : { ...attrs, 'aria-describedby': undefined }
}

// The centering layer stays until the content has played its exit animation and unmounted.
// Reka reports the unmount while the element is still in the DOM, so `close` waits a tick.
const present = ref(false)
watch(
  () => root.open.value,
  (open) => {
    if (open) present.value = true
  },
  { immediate: true },
)
function unmounted() {
  void nextTick(() => {
    // Reka also reports an unmount when `modal` changes while open and it swaps the content.
    if (root.open.value) return
    present.value = false
    emit('close')
  })
}

// The first control may sit below long content, out of view; the dialog itself is at the top.
function focusStart(event: Event) {
  const content = event.target as HTMLElement
  const body = content.querySelector('[data-slot="dialog-body"]')
  if (body && body.scrollHeight > body.clientHeight) {
    event.preventDefault()
    content.focus()
  }
}

function blockDismiss(event: Event) {
  if (!props.dismissible) event.preventDefault()
}
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      data-slot="dialog-overlay"
      class="fixed inset-0 z-modal bg-overlay state-open:animate-fade-in state-closed:animate-fade-out"
    />
    <!-- Padding is the page margin on a phone; max-h-full on the content then keeps it on screen. -->
    <div
      v-if="root.open.value || present"
      class="pointer-events-none fixed inset-0 z-modal flex items-center justify-center p-page-px"
    >
      <RekaDialogContent
        v-bind="forwarded()"
        :data-close="showClose ? '' : undefined"
        :class="cn(dialogVariants({ size }), props.class)"
        @open-auto-focus="focusStart"
        @close-auto-focus="unmounted"
        @escape-key-down="blockDismiss"
        @interact-outside="blockDismiss"
      >
        <!-- Only the body scrolls, so the close button stays in the corner. -->
        <div data-slot="dialog-body" class="flex min-h-0 flex-col gap-gap-md overflow-y-auto p-6">
          <slot />
        </div>
        <DialogClose v-if="showClose" as-child>
          <Button
            variant="ghost"
            size="sm"
            :aria-label="closeLabel"
            class="absolute end-4 top-3 bg-surface-raised"
          >
            <Icon name="close" class="size-4" />
          </Button>
        </DialogClose>
      </RekaDialogContent>
    </div>
  </DialogPortal>
</template>
