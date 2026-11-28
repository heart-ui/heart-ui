<script lang="ts">
import type { InjectionKey, Ref } from 'vue'

/** How many `DrawerDescription`s the content holds; it drops `aria-describedby` at zero. */
export const descriptionKey: InjectionKey<Ref<number>> = Symbol('drawer-description')
</script>

<script setup lang="ts">
import type { ClassValue } from 'clsx'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  injectDialogRootContext,
} from 'reka-ui'
import { nextTick, provide, ref, useAttrs, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'
import { drawerVariants, type DrawerVariants } from './drawer.variants'

interface DrawerContentProps {
  side?: NonNullable<DrawerVariants['side']>
  size?: NonNullable<DrawerVariants['size']>
  /** `false` keeps the drawer open on Escape and on a click outside. */
  dismissible?: boolean
  showClose?: boolean
  closeLabel?: string
  class?: ClassValue
}

// The root is the portal, so attributes go to the panel by hand.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<DrawerContentProps>(), {
  side: 'end',
  size: 'md',
  dismissible: true,
  showClose: true,
  closeLabel: 'Close',
  class: undefined,
})
const emit = defineEmits<{ close: [] }>()
const attrs = useAttrs()
const root = injectDialogRootContext()

const layers = {
  start: 'inset-y-0 start-0',
  end: 'inset-y-0 end-0',
  bottom: 'inset-0 flex-col justify-end',
}

const descriptions = ref(0)
provide(descriptionKey, descriptions)
// Reka always points aria-describedby at the description id, which dangles without a description.
// Read in the render, which reruns when attrs change; a computed doesn't track `in` or spread.
function forwarded() {
  return descriptions.value > 0 || 'aria-describedby' in attrs
    ? attrs
    : { ...attrs, 'aria-describedby': undefined }
}

// The layer stays until the panel has played its exit animation and unmounted.
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

// The first control may sit below long content, out of view; the panel itself is at the top.
function focusStart(event: Event) {
  const content = event.target as HTMLElement
  const body = content.querySelector('[data-slot="drawer-body"]')
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
      data-slot="drawer-overlay"
      class="fixed inset-0 z-modal bg-overlay state-open:animate-fade-in state-closed:animate-fade-out"
    />
    <!-- max-w-full is the page beside a scrollbar, which 100vw is not; the panel shrinks to it. -->
    <div
      v-if="root.open.value || present"
      :class="cn('pointer-events-none fixed z-modal flex max-w-full', layers[side])"
    >
      <DialogContent
        v-bind="forwarded()"
        :data-side="side"
        :data-close="showClose ? '' : undefined"
        :class="cn(drawerVariants({ side, size }), props.class)"
        @open-auto-focus="focusStart"
        @close-auto-focus="unmounted"
        @escape-key-down="blockDismiss"
        @interact-outside="blockDismiss"
      >
        <!-- Only the body scrolls, so the close button stays in the corner. -->
        <div
          data-slot="drawer-body"
          class="flex min-h-0 flex-1 flex-col gap-gap-md overflow-y-auto p-6"
        >
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
      </DialogContent>
    </div>
  </DialogPortal>
</template>

<style>
/* Insets, not translate: inline-start and -end follow the text direction, and the panel's
   containing block is a layer as wide as the panel, so -100% is the panel's own width. */
@keyframes heart-drawer-start-in {
  from {
    inset-inline-start: -100%;
  }
}

@keyframes heart-drawer-start-out {
  to {
    inset-inline-start: -100%;
  }
}

@keyframes heart-drawer-end-in {
  from {
    inset-inline-end: -100%;
  }
}

@keyframes heart-drawer-end-out {
  to {
    inset-inline-end: -100%;
  }
}

@keyframes heart-drawer-bottom-in {
  from {
    translate: 0 100%;
  }
}

@keyframes heart-drawer-bottom-out {
  to {
    translate: 0 100%;
  }
}

/* Private layer: never reorders Tailwind's layers when bundled before theme.css, and survives
   revert-layer resets in layered demo iframes. --h-duration-normal is 0 ms under reduced motion. */
@layer heart-drawer {
  .heart-drawer[data-state='open'] {
    animation: var(--heart-drawer-in) var(--h-duration-normal) var(--h-ease) both;
  }

  .heart-drawer[data-state='closed'] {
    animation: var(--heart-drawer-out) var(--h-duration-normal) var(--h-ease) both;
  }

  .heart-drawer[data-side='start'] {
    --heart-drawer-in: heart-drawer-start-in;
    --heart-drawer-out: heart-drawer-start-out;
  }

  .heart-drawer[data-side='end'] {
    --heart-drawer-in: heart-drawer-end-in;
    --heart-drawer-out: heart-drawer-end-out;
  }

  .heart-drawer[data-side='bottom'] {
    --heart-drawer-in: heart-drawer-bottom-in;
    --heart-drawer-out: heart-drawer-bottom-out;
  }
}
</style>
