<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

const props = withDefaults(defineProps<{ class?: ClassValue }>(), { class: undefined })
</script>

<template>
  <div
    data-slot="drawer-footer"
    :class="cn('mt-auto flex flex-wrap items-center justify-end gap-gap-sm', props.class)"
  >
    <slot />
  </div>
</template>
