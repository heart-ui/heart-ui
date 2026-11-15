<script setup lang="ts">
import type { ClassValue } from 'clsx'
import {
  DropdownMenuSubTrigger as RekaDropdownMenuSubTrigger,
  injectDropdownMenuRootContext,
} from 'reka-ui'
import { computed } from 'vue'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'
import { dropdownMenuItemVariants } from './dropdown-menu.variants'

interface DropdownMenuSubTriggerProps {
  disabled?: boolean
  class?: ClassValue
}

const props = withDefaults(defineProps<DropdownMenuSubTriggerProps>(), { class: undefined })
// The chevron points where the submenu opens. Reka's direction also drives its arrow keys, so the
// two agree; a CSS direction selector would break in production builds.
const root = injectDropdownMenuRootContext()
const chevron = computed(() => (root.dir.value === 'rtl' ? 'chevron-left' : 'chevron-right'))
</script>

<template>
  <RekaDropdownMenuSubTrigger
    :disabled="props.disabled"
    :class="cn(dropdownMenuItemVariants(), 'state-open:bg-muted', props.class)"
  >
    <slot />
    <Icon
      :name="chevron"
      class="ms-auto size-4 text-muted-foreground in-data-disabled:text-disabled-foreground"
    />
  </RekaDropdownMenuSubTrigger>
</template>
