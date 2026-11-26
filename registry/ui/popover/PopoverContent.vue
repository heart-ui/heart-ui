<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { PopoverPortal, PopoverContent as RekaPopoverContent } from 'reka-ui'
import { cn } from '@/lib/utils/utils'

interface PopoverContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  class?: ClassValue
}

// The root is the portal, so attributes go to the content element by hand; they come after the
// default side offset, so a caller's wins.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<PopoverContentProps>(), {
  side: 'bottom',
  align: 'center',
  class: undefined,
})

// Capped at the room Reka measures beside the trigger, so it stays on a phone screen and scrolls.
const style = {
  maxWidth: 'var(--reka-popover-content-available-width)',
  maxHeight: 'var(--reka-popover-content-available-height)',
}
</script>

<template>
  <PopoverPortal>
    <RekaPopoverContent
      :side-offset="4"
      :style="style"
      v-bind="$attrs"
      :side="props.side"
      :align="props.align"
      :class="
        cn(
          'z-popover w-72 overflow-y-auto rounded-md border border-border bg-surface-raised p-4 text-foreground shadow-md outline-hidden',
          'state-open:animate-fade-in state-closed:animate-fade-out',
          props.class,
        )
      "
    >
      <slot />
    </RekaPopoverContent>
  </PopoverPortal>
</template>
