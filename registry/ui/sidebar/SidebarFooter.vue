<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

const props = withDefaults(defineProps<{ class?: ClassValue }>(), { class: undefined })
</script>

<template>
  <div
    data-slot="sidebar-footer"
    :class="
      cn(
        'flex shrink-0 flex-col gap-gap-sm border-t border-border p-2 text-sm wrap-anywhere',
        'group-state-closed/sidebar:overflow-x-clip group-state-closed/sidebar:whitespace-nowrap',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
