<script setup lang="ts">
import { PopoverRoot } from 'reka-ui'

interface PopoverProps {
  /**
   * `true` traps focus inside, hides the rest of the page from screen readers and stops it
   * scrolling; a click outside only closes the popover and never reaches the page.
   */
  modal?: boolean
}

defineOptions({ name: 'HPopover' })

const props = withDefaults(defineProps<PopoverProps>(), { modal: false })
// Undefined until bound, so an unbound popover stays uncontrolled.
const open = defineModel<boolean | undefined>('open', { default: undefined })
</script>

<template>
  <PopoverRoot v-model:open="open" :modal="props.modal">
    <slot />
  </PopoverRoot>
</template>
