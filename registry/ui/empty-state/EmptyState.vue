<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { Comment, Fragment, Text, useSlots, type VNode } from 'vue'
import { cn } from '@/lib/utils/utils'

interface EmptyStateProps {
  title: string
  description?: string
  class?: ClassValue
}

defineOptions({ name: 'HEmptyState' })

const props = withDefaults(defineProps<EmptyStateProps>(), {
  description: undefined,
  class: undefined,
})
const slots = useSlots()

// A slot whose content renders nothing (a `v-if` that is off, blank text) gets no wrapper and no
// gap, as in `badge`.
function rendersSomething(nodes: VNode[]): boolean {
  return nodes.some((node) =>
    node.type === Comment
      ? false
      : node.type === Text
        ? String(node.children ?? '').trim() !== ''
        : node.type === Fragment
          ? rendersSomething((node.children ?? []) as VNode[])
          : true,
  )
}
</script>

<template>
  <div
    data-slot="empty-state"
    :class="cn('flex w-full flex-col items-center gap-gap-md p-6 text-center', props.class)"
  >
    <div
      v-if="rendersSomething(slots.icon?.() ?? [])"
      data-slot="empty-state-icon"
      aria-hidden="true"
      class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground *:size-6"
    >
      <slot name="icon" />
    </div>
    <div class="flex w-full max-w-content-narrow flex-col gap-1 wrap-anywhere">
      <div
        data-slot="empty-state-title"
        class="text-base leading-snug font-semibold text-foreground"
      >
        {{ props.title }}
      </div>
      <div
        v-if="props.description"
        data-slot="empty-state-description"
        class="text-sm text-muted-foreground"
      >
        {{ props.description }}
      </div>
    </div>
    <div
      v-if="rendersSomething(slots.actions?.() ?? [])"
      data-slot="empty-state-actions"
      class="flex flex-wrap items-center justify-center gap-gap-sm"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
