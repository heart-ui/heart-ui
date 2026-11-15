<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { DropdownMenuLabel as RekaDropdownMenuLabel } from 'reka-ui'
import { inject, onUnmounted } from 'vue'
import { cn } from '@/lib/utils/utils'
import { groupLabelsKey } from './DropdownMenuRadioGroup.vue'

interface DropdownMenuLabelProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<DropdownMenuLabelProps>(), { class: undefined })

// Inside a radio group, the group is named by this label.
const groupLabels = inject(groupLabelsKey, undefined)
if (groupLabels) {
  groupLabels.value++
  onUnmounted(() => groupLabels.value--)
}
</script>

<template>
  <RekaDropdownMenuLabel
    :class="
      cn('py-1.5 ps-8 pe-control-px-sm text-xs font-medium text-muted-foreground', props.class)
    "
  >
    <slot />
  </RekaDropdownMenuLabel>
</template>
