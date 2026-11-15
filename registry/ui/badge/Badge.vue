<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { Comment, Fragment, useSlots, type VNode } from 'vue'
import { cn } from '@/lib/utils/utils'
import { badgeVariants, type BadgeVariants } from './badge.variants'

interface BadgeProps {
  variant?: NonNullable<BadgeVariants['variant']>
  size?: NonNullable<BadgeVariants['size']>
  class?: ClassValue
}

defineOptions({ name: 'HBadge' })

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'neutral',
  size: 'md',
  class: undefined,
})
const slots = useSlots()

// A slot whose content renders nothing (a `v-if` that is off) gets no wrapper and no gap, as in
// `input`.
function rendersSomething(nodes: VNode[]): boolean {
  return nodes.some((node) =>
    node.type === Comment
      ? false
      : node.type === Fragment
        ? rendersSomething((node.children ?? []) as VNode[])
        : true,
  )
}
</script>

<template>
  <span
    data-slot="badge"
    :class="cn(badgeVariants({ variant: props.variant, size: props.size }), props.class)"
  >
    <span
      v-if="rendersSomething(slots.leading?.() ?? [])"
      data-slot="leading"
      aria-hidden="true"
      class="inline-flex shrink-0 items-center"
    >
      <slot name="leading" />
    </span>
    <slot />
  </span>
</template>
