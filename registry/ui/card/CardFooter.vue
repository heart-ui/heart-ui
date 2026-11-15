<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

interface CardFooterProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<CardFooterProps>(), { class: undefined })
</script>

<template>
  <div :class="cn('flex flex-wrap items-center gap-gap-sm px-gap-lg', props.class)">
    <slot />
  </div>
</template>
