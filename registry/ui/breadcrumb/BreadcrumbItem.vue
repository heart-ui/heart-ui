<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

interface BreadcrumbItemProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<BreadcrumbItemProps>(), { class: undefined })
</script>

<template>
  <li :class="cn('inline-flex min-w-0 items-center gap-gap-sm', props.class)">
    <slot />
  </li>
</template>
