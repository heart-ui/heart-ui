<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

interface BreadcrumbPageProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<BreadcrumbPageProps>(), { class: undefined })
</script>

<template>
  <span aria-current="page" :class="cn('font-medium text-foreground', props.class)">
    <slot />
  </span>
</template>
