<script setup lang="ts">
import { PopoverTrigger as RekaPopoverTrigger, type PopoverTriggerProps } from 'reka-ui'

// No styles of its own: `class` falls through to the rendered element, or to the child with asChild.
const props = defineProps<PopoverTriggerProps>()
</script>

<template>
  <RekaPopoverTrigger v-bind="props">
    <slot />
  </RekaPopoverTrigger>
</template>
