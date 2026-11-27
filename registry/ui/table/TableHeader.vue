<script lang="ts">
import type { InjectionKey } from 'vue'

/** True inside `TableHeader`, so its header cells name columns; `Table` resets it for a nested table. */
export const tableHeaderKey: InjectionKey<boolean> = Symbol('table-header')
</script>

<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { provide } from 'vue'
import { cn } from '@/lib/utils/utils'

interface TableHeaderProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<TableHeaderProps>(), { class: undefined })
provide(tableHeaderKey, true)
</script>

<template>
  <thead
    data-slot="table-header"
    :class="cn('border-b border-border bg-surface-sunken', props.class)"
  >
    <slot />
  </thead>
</template>
