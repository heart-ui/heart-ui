<script setup lang="ts">
import type { ClassValue } from 'clsx'
import {
  AccordionHeader,
  AccordionTrigger as RekaAccordionTrigger,
  injectAccordionItemContext,
  injectAccordionRootContext,
  injectCollapsibleRootContext,
  useId,
} from 'reka-ui'
import { computed, useAttrs } from 'vue'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'

interface AccordionTriggerProps {
  class?: ClassValue
}

// The root is the heading, so attributes go to the button by hand.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<AccordionTriggerProps>(), { class: undefined })

// Reka's trigger reads the content's id as a plain string that the content sets only when it sets
// up, after the trigger renders. Naming the id here first gives an item open at first a real
// `aria-controls`; the content keeps an id that is already set.
const collapsible = injectCollapsibleRootContext()
collapsible.contentId ||= useId(undefined, 'heart-accordion-content')

// A caller's `id` becomes the trigger id Reka shares with the region's `aria-labelledby`, so the
// region keeps its name.
const attrs = useAttrs()
const item = injectAccordionItemContext()
if (typeof attrs.id === 'string' && attrs.id) item.triggerId = attrs.id

// An open item that can't close ignores a press, so it says so, as the WAI-ARIA accordion asks.
const root = injectAccordionRootContext()
const locked = computed(
  () => item.disabled.value || (item.open.value && root.isSingle.value && !root.collapsible),
)
// Read in the render, which reruns when attrs change; a computed doesn't track attrs.
const ariaDisabled = () => (locked.value ? 'true' : attrs['aria-disabled'])
</script>

<template>
  <AccordionHeader class="flex">
    <RekaAccordionTrigger
      v-bind="$attrs"
      :aria-disabled="ariaDisabled()"
      :class="
        cn(
          'group flex flex-1 items-center justify-between gap-gap-md rounded-sm py-4 text-start text-sm font-medium text-foreground outline-hidden',
          'focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-focus focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:text-disabled-foreground',
          props.class,
        )
      "
    >
      <slot />
      <Icon
        name="chevron-down"
        class="size-4 shrink-0 text-muted-foreground transition-transform duration-normal group-state-open:rotate-180 group-disabled:text-disabled-foreground"
      />
    </RekaAccordionTrigger>
  </AccordionHeader>
</template>
