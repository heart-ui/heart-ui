<script setup lang="ts">
import { DialogClose as RekaDialogClose, type DialogCloseProps } from 'reka-ui'

// No styles of its own: `class` falls through to the rendered element, or to the child with asChild.
const props = defineProps<DialogCloseProps>()
</script>

<template>
  <RekaDialogClose v-bind="props">
    <slot />
  </RekaDialogClose>
</template>
