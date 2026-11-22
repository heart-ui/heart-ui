<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

interface AlertTitleProps {
  class?: ClassValue
}

defineOptions({ name: 'HAlertTitle' })

const props = withDefaults(defineProps<AlertTitleProps>(), { class: undefined })
</script>

<template>
  <div data-slot="alert-title" :class="cn('font-medium', props.class)">
    <slot />
  </div>
</template>
