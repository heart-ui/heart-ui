<script setup lang="ts">
import { TooltipProvider as RekaTooltipProvider } from 'reka-ui'

interface TooltipProviderProps {
  /** Milliseconds of hover before a tooltip opens. */
  delayDuration?: number
  /** Moving to another trigger within this time opens it at once. */
  skipDelayDuration?: number
  /** Only keyboard focus opens a tooltip; `false` lets any focus open it. */
  ignoreNonKeyboardFocus?: boolean
}

const props = withDefaults(defineProps<TooltipProviderProps>(), {
  delayDuration: 700,
  skipDelayDuration: 300,
  ignoreNonKeyboardFocus: true,
})
</script>

<!-- By default only keyboard focus opens a tooltip: focus that a closing menu or dialog returns by
     script after a click doesn't. -->
<template>
  <RekaTooltipProvider
    :delay-duration="props.delayDuration"
    :skip-delay-duration="props.skipDelayDuration"
    :ignore-non-keyboard-focus="props.ignoreNonKeyboardFocus"
  >
    <slot />
  </RekaTooltipProvider>
</template>
