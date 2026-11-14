<script setup lang="ts">
import { DialogRoot } from 'reka-ui'

interface DialogProps {
  modal?: boolean
}

defineOptions({ name: 'TrevDialog' })

const { modal = true } = defineProps<DialogProps>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open" :modal="modal">
    <slot />
  </DialogRoot>
</template>
