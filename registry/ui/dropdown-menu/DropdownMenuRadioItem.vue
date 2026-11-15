<script setup lang="ts">
import type { ClassValue } from 'clsx'
import {
  DropdownMenuItemIndicator,
  DropdownMenuRadioItem as RekaDropdownMenuRadioItem,
} from 'reka-ui'
import { cn } from '@/lib/utils/utils'
import { dropdownMenuItemVariants } from './dropdown-menu.variants'

interface DropdownMenuRadioItemProps {
  value: string
  disabled?: boolean
  class?: ClassValue
}

const props = withDefaults(defineProps<DropdownMenuRadioItemProps>(), { class: undefined })
const emit = defineEmits<{ select: [event: Event] }>()
</script>

<template>
  <RekaDropdownMenuRadioItem
    :value="props.value"
    :disabled="props.disabled"
    :class="cn(dropdownMenuItemVariants(), props.class)"
    @select="emit('select', $event)"
  >
    <DropdownMenuItemIndicator
      aria-hidden="true"
      class="absolute start-2 flex size-4 items-center justify-center"
    >
      <!-- Drawn by its border, which stays visible when colours are forced. -->
      <span class="size-2 rounded-full border-4 border-current" />
    </DropdownMenuItemIndicator>
    <slot />
  </RekaDropdownMenuRadioItem>
</template>
