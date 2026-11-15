<script setup lang="ts">
import type { ClassValue } from 'clsx'
import {
  SelectContent as RekaSelectContent,
  SelectPortal,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectViewport,
} from 'reka-ui'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'

interface SelectContentProps {
  class?: ClassValue
}

// The root is the portal, so attributes go to the content element by hand.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<SelectContentProps>(), { class: undefined })
</script>

<template>
  <SelectPortal>
    <!-- Item-aligned (Reka's default): the list opens over the trigger, at least its width. -->
    <RekaSelectContent
      v-bind="$attrs"
      :class="
        cn(
          'relative z-popover overflow-hidden rounded-md border border-border bg-surface-raised text-foreground shadow-md',
          'state-open:animate-fade-in state-closed:animate-fade-out',
          props.class,
        )
      "
    >
      <SelectScrollUpButton
        data-slot="select-scroll-up"
        class="flex items-center justify-center py-1 text-muted-foreground"
      >
        <Icon name="chevron-up" class="size-4" />
      </SelectScrollUpButton>
      <SelectViewport class="p-1">
        <slot />
      </SelectViewport>
      <SelectScrollDownButton
        data-slot="select-scroll-down"
        class="flex items-center justify-center py-1 text-muted-foreground"
      >
        <Icon name="chevron-down" class="size-4" />
      </SelectScrollDownButton>
    </RekaSelectContent>
  </SelectPortal>
</template>
