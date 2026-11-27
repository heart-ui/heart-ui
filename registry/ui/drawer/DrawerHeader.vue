<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

const props = withDefaults(defineProps<{ class?: ClassValue }>(), { class: undefined })
</script>

<template>
  <div
    data-slot="drawer-header"
    :class="cn('flex flex-col gap-1 group-data-close/drawer:pe-8', props.class)"
  >
    <slot />
  </div>
</template>
