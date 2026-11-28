<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

const props = withDefaults(defineProps<{ class?: ClassValue }>(), { class: undefined })
</script>

<template>
  <!-- Collapsed, the brand stacks over the trigger; in the drawer, it clears the close button. -->
  <div
    data-slot="sidebar-header"
    :class="
      cn(
        'flex shrink-0 items-center justify-between gap-gap-sm p-2',
        'group-state-closed/sidebar:flex-col group-data-close/drawer:pe-8',
        'group-state-closed/sidebar:overflow-x-clip group-state-closed/sidebar:whitespace-nowrap',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
