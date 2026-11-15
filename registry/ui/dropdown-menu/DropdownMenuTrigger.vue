<script setup lang="ts">
import {
  DropdownMenuTrigger as RekaDropdownMenuTrigger,
  type DropdownMenuTriggerProps,
} from 'reka-ui'

// No styles of its own: `class` falls through to the rendered element, or to the child with asChild.
const props = defineProps<DropdownMenuTriggerProps>()
</script>

<template>
  <RekaDropdownMenuTrigger v-bind="props">
    <slot />
  </RekaDropdownMenuTrigger>
</template>
