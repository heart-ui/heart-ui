<script setup lang="ts">
import type { ClassValue } from 'clsx'
import {
  DropdownMenuCheckboxItem as RekaDropdownMenuCheckboxItem,
  DropdownMenuItemIndicator,
} from 'reka-ui'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'
import { dropdownMenuItemVariants } from './dropdown-menu.variants'

interface DropdownMenuCheckboxItemProps {
  disabled?: boolean
  class?: ClassValue
}

const props = withDefaults(defineProps<DropdownMenuCheckboxItemProps>(), { class: undefined })
const model = defineModel<boolean>({ default: false })
const emit = defineEmits<{ select: [event: Event] }>()
</script>

<template>
  <RekaDropdownMenuCheckboxItem
    v-model="model"
    :disabled="props.disabled"
    :class="cn(dropdownMenuItemVariants(), props.class)"
    @select="emit('select', $event)"
  >
    <DropdownMenuItemIndicator
      aria-hidden="true"
      class="absolute start-2 flex size-4 items-center justify-center"
    >
      <Icon name="check" class="size-4" />
    </DropdownMenuItemIndicator>
    <slot />
  </RekaDropdownMenuCheckboxItem>
</template>
