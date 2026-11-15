<script setup lang="ts">
import { TooltipTrigger as RekaTooltipTrigger, type TooltipTriggerProps } from 'reka-ui'
import { computed } from 'vue'

// No styles of its own: `class` falls through to the rendered element, or to the child with asChild.
const props = defineProps<Pick<TooltipTriggerProps, 'as' | 'asChild'>>()
// Reka renders a button with no type, which would submit a surrounding form.
const type = computed(() =>
  !props.asChild && (props.as ?? 'button') === 'button' ? 'button' : undefined,
)
</script>

<template>
  <RekaTooltipTrigger v-bind="props" :type="type">
    <slot />
  </RekaTooltipTrigger>
</template>
