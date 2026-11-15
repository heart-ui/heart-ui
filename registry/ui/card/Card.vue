<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '@/lib/utils/utils'
import { cardVariants, type CardVariants } from './card.variants'

interface CardProps extends PrimitiveProps {
  variant?: NonNullable<CardVariants['variant']>
  class?: ClassValue
}

defineOptions({ name: 'HCard' })

const props = withDefaults(defineProps<CardProps>(), {
  variant: 'default',
  as: 'div',
  class: undefined,
})
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    :class="cn(cardVariants({ variant: props.variant }), props.class)"
  >
    <slot />
  </Primitive>
</template>
