<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { Label as LabelRoot } from 'reka-ui'
import { cn } from '@/lib/utils/utils'

interface LabelProps {
  /** `id` of the control the label names. */
  for?: string
  required?: boolean
  /** Read by screen readers in place of the required marker. */
  requiredLabel?: string
  class?: ClassValue
}

defineOptions({ name: 'HLabel' })

const props = withDefaults(defineProps<LabelProps>(), {
  for: undefined,
  requiredLabel: 'required',
  class: undefined,
})
</script>

<template>
  <LabelRoot
    :for="props.for"
    :class="cn('text-sm leading-normal font-medium text-foreground', props.class)"
  >
    <slot />
    <template v-if="props.required">
      <!-- A plain space, so it collapses into any whitespace that ends the slot. -->
      <span data-slot="required-marker" aria-hidden="true" class="text-muted-foreground"> *</span>
      <span class="sr-only">{{ ` ${props.requiredLabel}` }}</span>
    </template>
  </LabelRoot>
</template>
