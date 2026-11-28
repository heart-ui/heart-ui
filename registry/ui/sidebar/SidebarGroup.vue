<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { useId } from 'vue'
import { cn } from '@/lib/utils/utils'

interface SidebarGroupProps {
  /** Names the group; visually hidden while the sidebar is collapsed. */
  heading?: string
  class?: ClassValue
}

const props = withDefaults(defineProps<SidebarGroupProps>(), {
  heading: undefined,
  class: undefined,
})
const headingId = useId()
</script>

<template>
  <div
    role="group"
    :aria-labelledby="props.heading ? headingId : undefined"
    data-slot="sidebar-group"
    :class="cn('relative flex flex-col gap-1', props.class)"
  >
    <div
      v-if="props.heading"
      :id="headingId"
      data-slot="sidebar-group-heading"
      class="px-control-px-md text-xs font-medium text-muted-foreground group-state-closed/sidebar:sr-only"
    >
      {{ props.heading }}
    </div>
    <ul role="list" class="flex flex-col gap-1">
      <slot />
    </ul>
  </div>
</template>
