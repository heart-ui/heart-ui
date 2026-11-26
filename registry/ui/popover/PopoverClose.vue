<script setup lang="ts">
import { PopoverClose as RekaPopoverClose, type PopoverCloseProps } from 'reka-ui'

// No styles of its own: `class` falls through to the rendered element, or to the child with asChild.
const props = defineProps<PopoverCloseProps>()
</script>

<template>
  <RekaPopoverClose v-bind="props">
    <slot />
  </RekaPopoverClose>
</template>
