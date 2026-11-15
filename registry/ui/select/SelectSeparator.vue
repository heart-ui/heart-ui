<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { SelectSeparator as RekaSelectSeparator } from 'reka-ui'
import { cn } from '@/lib/utils/utils'

interface SelectSeparatorProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<SelectSeparatorProps>(), { class: undefined })
</script>

<template>
  <RekaSelectSeparator
    data-slot="select-separator"
    :class="cn('-mx-1 my-1 h-px bg-border', props.class)"
  />
</template>
