<script setup lang="ts">
import type { ClassValue } from 'clsx'
import {
  ComboboxItemIndicator,
  injectComboboxRootContext,
  ComboboxItem as RekaComboboxItem,
} from 'reka-ui'
import { computed, inject, onMounted, onUpdated, useTemplateRef } from 'vue'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'
import { comboboxKey, comboboxTextOnlyKey } from './Combobox.vue'

interface ComboboxItemProps {
  value: string
  disabled?: boolean
  class?: ClassValue
}

const props = withDefaults(defineProps<ComboboxItemProps>(), { class: undefined })
const context = inject(comboboxKey, undefined)
const textOnly = inject(comboboxTextOnlyKey, false)
// Reka marks a disabled option with a bare `disabled` attribute, which assistive tech ignores on a div.
const root = injectComboboxRootContext()
const disabled = computed(() => !!props.disabled || !!root.disabled.value)
const text = useTemplateRef<HTMLElement>('text')

// A filtered-out item renders nothing, so there is no text to read until it shows again.
function register() {
  const shown = text.value?.textContent?.trim()
  if (shown) context?.texts.set(props.value, shown)
}
onMounted(register)
onUpdated(register)
</script>

<template>
  <span v-if="textOnly" ref="text"><slot /></span>
  <RekaComboboxItem
    v-else
    :value="props.value"
    :disabled="props.disabled"
    :aria-disabled="disabled ? 'true' : undefined"
    :class="
      cn(
        'relative flex cursor-default items-center gap-gap-sm rounded-sm py-1.5 ps-control-px-md pe-8 text-sm outline-hidden select-none',
        'data-highlighted:bg-muted data-disabled:cursor-not-allowed data-disabled:text-disabled-foreground',
        props.class,
      )
    "
  >
    <span ref="text"><slot /></span>
    <ComboboxItemIndicator class="absolute end-2 flex items-center">
      <Icon name="check" class="size-4" />
    </ComboboxItemIndicator>
  </RekaComboboxItem>
</template>
