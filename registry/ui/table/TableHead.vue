<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { computed, inject } from 'vue'
import { cn } from '@/lib/utils/utils'
import { tableKey } from './Table.vue'
import { tableHeaderKey } from './TableHeader.vue'
import { tableCellVariants } from './table.variants'

interface TableHeadProps {
  /** `row` makes the cell a row header, such as a record's id in the first column; `col` inside `TableHeader`. */
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup'
  class?: ClassValue
}

const props = withDefaults(defineProps<TableHeadProps>(), { scope: undefined, class: undefined })
const table = inject(tableKey, undefined)
const size = computed(() => table?.size.value ?? 'md')
// An explicit scope, because not every accessibility engine infers one for a `th` in a `thead`.
const inHeader = inject(tableHeaderKey, false)
const scope = computed(() => props.scope ?? (inHeader ? 'col' : undefined))
</script>

<template>
  <th
    data-slot="table-head"
    :scope="scope"
    :class="
      cn(
        tableCellVariants({ size }),
        'text-start font-medium text-muted-foreground',
        scope === 'col' && 'whitespace-nowrap',
        props.class,
      )
    "
  >
    <slot />
  </th>
</template>
