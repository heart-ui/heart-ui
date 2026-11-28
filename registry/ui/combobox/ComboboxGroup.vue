<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { ComboboxLabel, ComboboxGroup as RekaComboboxGroup } from 'reka-ui'
import { inject, useId } from 'vue'
import { comboboxTextOnlyKey } from './Combobox.vue'

interface ComboboxGroupProps {
  /** Shown above the items, and names the group. */
  heading?: string
  class?: ClassValue
}

const props = withDefaults(defineProps<ComboboxGroupProps>(), {
  heading: undefined,
  class: undefined,
})
// Reka's group reads its label's id before the label sets it, so both get this one.
const headingId = useId()
const textOnly = inject(comboboxTextOnlyKey, false)
</script>

<template>
  <slot v-if="textOnly" />
  <RekaComboboxGroup
    v-else
    :aria-labelledby="props.heading ? headingId : undefined"
    :class="props.class"
  >
    <ComboboxLabel
      v-if="props.heading"
      :id="headingId"
      class="px-control-px-md py-1.5 text-xs font-medium text-muted-foreground"
    >
      {{ props.heading }}
    </ComboboxLabel>
    <slot />
  </RekaComboboxGroup>
</template>
