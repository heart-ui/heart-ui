<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

interface CardDescriptionProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<CardDescriptionProps>(), { class: undefined })
</script>

<template>
  <div :class="cn('text-sm text-muted-foreground', props.class)">
    <slot />
  </div>
</template>
