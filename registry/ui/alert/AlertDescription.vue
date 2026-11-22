<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

interface AlertDescriptionProps {
  class?: ClassValue
}

defineOptions({ name: 'HAlertDescription' })

const props = withDefaults(defineProps<AlertDescriptionProps>(), { class: undefined })
</script>

<template>
  <div data-slot="alert-description" :class="cn(props.class)">
    <slot />
  </div>
</template>
