<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { SelectLabel as RekaSelectLabel } from 'reka-ui'
import { cn } from '@/lib/utils/utils'

interface SelectLabelProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<SelectLabelProps>(), { class: undefined })
</script>

<template>
  <RekaSelectLabel
    :class="cn('px-control-px-md py-1.5 text-xs font-medium text-muted-foreground', props.class)"
  >
    <slot />
  </RekaSelectLabel>
</template>
