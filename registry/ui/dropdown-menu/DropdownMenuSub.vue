<script setup lang="ts">
import { DropdownMenuSub as RekaDropdownMenuSub } from 'reka-ui'

// Undefined until bound, so an unbound submenu stays uncontrolled.
const open = defineModel<boolean | undefined>('open', { default: undefined })
</script>

<template>
  <RekaDropdownMenuSub v-model:open="open">
    <slot />
  </RekaDropdownMenuSub>
</template>
