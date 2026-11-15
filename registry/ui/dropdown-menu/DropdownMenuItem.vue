<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { DropdownMenuItem as RekaDropdownMenuItem } from 'reka-ui'
import { cn } from '@/lib/utils/utils'
import { dropdownMenuItemVariants, type DropdownMenuItemVariants } from './dropdown-menu.variants'

interface DropdownMenuItemProps {
  variant?: NonNullable<DropdownMenuItemVariants['variant']>
  disabled?: boolean
  class?: ClassValue
}

const props = withDefaults(defineProps<DropdownMenuItemProps>(), {
  variant: 'default',
  class: undefined,
})
const emit = defineEmits<{ select: [event: Event] }>()
</script>

<template>
  <RekaDropdownMenuItem
    :disabled="props.disabled"
    :class="cn(dropdownMenuItemVariants({ variant: props.variant }), props.class)"
    @select="emit('select', $event)"
  >
    <span
      v-if="$slots.leading"
      data-slot="leading"
      aria-hidden="true"
      class="absolute start-2 flex size-4 items-center justify-center"
    >
      <slot name="leading" />
    </span>
    <slot />
    <span
      v-if="$slots.trailing"
      data-slot="trailing"
      class="ms-auto ps-gap-md text-xs text-muted-foreground in-data-disabled:text-disabled-foreground"
    >
      <slot name="trailing" />
    </span>
  </RekaDropdownMenuItem>
</template>
