<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

interface SkeletonProps {
  class?: ClassValue
}

defineOptions({ name: 'HSkeleton' })

const props = withDefaults(defineProps<SkeletonProps>(), { class: undefined })
</script>

<template>
  <div
    data-slot="skeleton"
    aria-hidden="true"
    :class="cn('rounded-md bg-muted motion-safe:animate-pulse', props.class)"
  />
</template>
