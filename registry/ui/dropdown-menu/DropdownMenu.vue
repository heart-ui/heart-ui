<script setup lang="ts">
import { DropdownMenuRoot } from 'reka-ui'

interface DropdownMenuProps {
  /** `false` keeps the page usable while the menu is open. */
  modal?: boolean
}

defineOptions({ name: 'HDropdownMenu' })

const props = withDefaults(defineProps<DropdownMenuProps>(), { modal: true })
// Undefined until bound, so an unbound menu stays uncontrolled (`defaultOpen` works).
const open = defineModel<boolean | undefined>('open', { default: undefined })
</script>

<template>
  <DropdownMenuRoot v-model:open="open" :modal="props.modal">
    <slot />
  </DropdownMenuRoot>
</template>
