<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { AccordionItem as RekaAccordionItem } from 'reka-ui'
import { cn } from '@/lib/utils/utils'

interface AccordionItemProps {
  /** Names the item in `v-model`. */
  value: string
  disabled?: boolean
  class?: ClassValue
}

const props = withDefaults(defineProps<AccordionItemProps>(), {
  disabled: false,
  class: undefined,
})
</script>

<template>
  <RekaAccordionItem
    :value="props.value"
    :disabled="props.disabled"
    :class="cn('border-b border-border', props.class)"
  >
    <slot />
  </RekaAccordionItem>
</template>
