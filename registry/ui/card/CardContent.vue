<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

interface CardContentProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<CardContentProps>(), { class: undefined })
</script>

<template>
  <div :class="cn('px-gap-lg', props.class)">
    <slot />
  </div>
</template>
