<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

const props = withDefaults(defineProps<{ class?: ClassValue }>(), { class: undefined })
</script>

<template>
  <!-- The padding keeps the items' focus rings inside the scrolling box, which clips them. -->
  <div
    data-slot="sidebar-content"
    :class="cn('flex min-h-0 flex-1 flex-col gap-gap-md overflow-y-auto p-2', props.class)"
  >
    <slot />
  </div>
</template>
