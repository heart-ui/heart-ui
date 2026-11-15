<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

interface CardHeaderProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<CardHeaderProps>(), { class: undefined })
</script>

<template>
  <div :class="cn('flex flex-col gap-1.5 px-gap-lg', props.class)">
    <slot />
  </div>
</template>
