<script setup lang="ts">
import { DialogTrigger as RekaDialogTrigger, type DialogTriggerProps } from 'reka-ui'

// No styles of its own: `class` falls through to the rendered element, or to the child with asChild.
const props = defineProps<DialogTriggerProps>()
</script>

<template>
  <RekaDialogTrigger v-bind="props">
    <slot />
  </RekaDialogTrigger>
</template>
