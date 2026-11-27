<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { computed, inject } from 'vue'
import { cn } from '@/lib/utils/utils'
import { tableKey } from './Table.vue'
import { tableCellVariants } from './table.variants'

interface TableCellProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<TableCellProps>(), { class: undefined })
const table = inject(tableKey, undefined)
const size = computed(() => table?.size.value ?? 'md')
</script>

<template>
  <td
    data-slot="table-cell"
    :class="cn(tableCellVariants({ size }), 'text-foreground', props.class)"
  >
    <slot />
  </td>
</template>
