<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { SelectItemIndicator, SelectItem as RekaSelectItem, SelectItemText } from 'reka-ui'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'

interface SelectItemProps {
  value: string
  disabled?: boolean
  class?: ClassValue
}

const props = withDefaults(defineProps<SelectItemProps>(), { class: undefined })
</script>

<template>
  <RekaSelectItem
    :value="props.value"
    :disabled="props.disabled"
    :class="
      cn(
        'relative flex cursor-default items-center gap-gap-sm rounded-sm py-1.5 ps-control-px-md pe-8 text-sm outline-hidden select-none',
        'data-highlighted:bg-muted data-disabled:cursor-not-allowed data-disabled:text-disabled-foreground',
        props.class,
      )
    "
  >
    <SelectItemText>
      <slot />
    </SelectItemText>
    <SelectItemIndicator class="absolute end-2 flex items-center">
      <Icon name="check" class="size-4" />
    </SelectItemIndicator>
  </RekaSelectItem>
</template>
