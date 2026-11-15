<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { DropdownMenuPortal, DropdownMenuSubContent as RekaDropdownMenuSubContent } from 'reka-ui'
import { cn } from '@/lib/utils/utils'
import { dropdownMenuContentClasses, dropdownMenuContentStyle } from './dropdown-menu.variants'

interface DropdownMenuSubContentProps {
  class?: ClassValue
}

// The root is the portal, so attributes go to the content element by hand; they come after the
// default side offset, so a caller's wins. The height is capped at the room Reka measures beside
// the trigger, and the list scrolls.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<DropdownMenuSubContentProps>(), { class: undefined })
</script>

<template>
  <DropdownMenuPortal>
    <RekaDropdownMenuSubContent
      :side-offset="4"
      :style="dropdownMenuContentStyle"
      v-bind="$attrs"
      :class="cn(dropdownMenuContentClasses, props.class)"
    >
      <slot />
    </RekaDropdownMenuSubContent>
  </DropdownMenuPortal>
</template>
