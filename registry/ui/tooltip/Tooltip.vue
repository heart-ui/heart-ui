<script setup lang="ts">
import { TooltipRoot } from 'reka-ui'

interface TooltipProps {
  /** Overrides the provider's delay for this tooltip. */
  delayDuration?: number
}

defineOptions({ name: 'HTooltip' })

const props = defineProps<TooltipProps>()
// Undefined until bound, so an unbound tooltip stays uncontrolled.
const open = defineModel<boolean | undefined>('open', { default: undefined })
</script>

<template>
  <TooltipRoot v-model:open="open" :delay-duration="props.delayDuration">
    <slot />
  </TooltipRoot>
</template>
