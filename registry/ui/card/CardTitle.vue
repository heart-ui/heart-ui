<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '@/lib/utils/utils'

// `as` sets the heading level that fits the page outline.
interface CardTitleProps extends PrimitiveProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<CardTitleProps>(), { as: 'h3', class: undefined })
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    :class="cn('text-base leading-snug font-semibold text-foreground', props.class)"
  >
    <slot />
  </Primitive>
</template>
