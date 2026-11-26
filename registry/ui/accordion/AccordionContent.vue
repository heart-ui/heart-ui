<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { AccordionContent as RekaAccordionContent } from 'reka-ui'
import { cn } from '@/lib/utils/utils'

interface AccordionContentProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<AccordionContentProps>(), { class: undefined })
</script>

<template>
  <!-- Padding sits on the inner element: on the animated one it would show at zero height. -->
  <RekaAccordionContent class="heart-accordion-content text-sm text-foreground">
    <div :class="cn('pb-4', props.class)">
      <slot />
    </div>
  </RekaAccordionContent>
</template>

<style>
/* Clipped only while the height moves: open content must not cut off focus rings inside it. */
@keyframes heart-accordion-open {
  from {
    height: 0;
    overflow: hidden;
  }
  to {
    height: var(--reka-accordion-content-height);
    overflow: hidden;
  }
}

@keyframes heart-accordion-close {
  from {
    height: var(--reka-accordion-content-height);
    overflow: hidden;
  }
  to {
    height: 0;
    overflow: hidden;
  }
}

/* Private layer: never reorders Tailwind's layers when bundled before theme.css, and survives
   revert-layer resets in layered demo iframes. --h-duration-normal is 0 ms under reduced motion. */
@layer heart-accordion {
  .heart-accordion-content[data-state='open'] {
    animation: heart-accordion-open var(--h-duration-normal) var(--h-ease);
  }

  .heart-accordion-content[data-state='closed'] {
    overflow: hidden;
    animation: heart-accordion-close var(--h-duration-normal) var(--h-ease);
  }
}
</style>
