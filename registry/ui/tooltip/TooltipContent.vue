<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { TooltipContent as RekaTooltipContent, TooltipPortal } from 'reka-ui'
import { cn } from '@/lib/utils/utils'

interface TooltipContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left'
  class?: ClassValue
}

// The root is the portal, so attributes go to the content element by hand; they come after the
// default side offset, so a caller's wins.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<TooltipContentProps>(), { side: 'top', class: undefined })
</script>

<template>
  <TooltipPortal>
    <RekaTooltipContent
      :side-offset="4"
      v-bind="$attrs"
      :side="props.side"
      :class="
        cn(
          'z-tooltip max-w-xs rounded-sm bg-foreground px-2 py-1 text-xs text-background',
          'not-state-closed:animate-fade-in state-closed:animate-fade-out',
          props.class,
        )
      "
    >
      <slot />
    </RekaTooltipContent>
  </TooltipPortal>
</template>
