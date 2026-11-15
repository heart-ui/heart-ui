<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { TabsContent as RekaTabsContent } from 'reka-ui'
import { cn } from '@/lib/utils/utils'

interface TabsContentProps {
  value: string
  class?: ClassValue
}

const props = withDefaults(defineProps<TabsContentProps>(), { class: undefined })
</script>

<template>
  <!-- Reka gives the panel tabindex="0", so a panel without focusable content is reachable. -->
  <RekaTabsContent
    :value="props.value"
    :class="
      cn(
        'min-w-0 flex-1 rounded-sm outline-hidden',
        'focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-focus focus-visible:ring-offset-background',
        props.class,
      )
    "
  >
    <slot />
  </RekaTabsContent>
</template>
