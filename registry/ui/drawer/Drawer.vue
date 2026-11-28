<script setup lang="ts">
import { DialogRoot } from 'reka-ui'

interface DrawerProps {
  modal?: boolean
}

defineOptions({ name: 'HDrawer' })

const { modal = true } = defineProps<DrawerProps>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open" :modal="modal">
    <slot />
  </DialogRoot>
</template>
