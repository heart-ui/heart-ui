<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

interface ListFiltersProps {
  /** The data is loading: sets `aria-busy` on the data region. */
  loading?: boolean
  class?: ClassValue
}

defineOptions({ name: 'HListFilters' })

const props = withDefaults(defineProps<ListFiltersProps>(), { loading: false, class: undefined })
const slots = defineSlots<{
  header?(): unknown
  filters?(): unknown
  data?(): unknown
  pagination?(): unknown
}>()
</script>

<template>
  <!-- The page's landmark is app-shell's main; this only arranges its regions. -->
  <div :class="cn('flex min-w-0 flex-col gap-section-gap', props.class)">
    <div v-if="slots.header" data-slot="list-filters-header">
      <slot name="header" />
    </div>
    <!-- Filters, data and pagination sit closer together than sections: they read as one unit. -->
    <div
      v-if="slots.filters || slots.data || slots.pagination"
      class="flex min-w-0 flex-col gap-gap-md"
    >
      <div
        v-if="slots.filters"
        data-slot="list-filters-filters"
        class="flex flex-wrap items-center gap-gap-sm"
      >
        <slot name="filters" />
      </div>
      <div
        v-if="slots.data"
        data-slot="list-filters-data"
        :aria-busy="props.loading ? 'true' : undefined"
        class="min-w-0"
      >
        <slot name="data" />
      </div>
      <div v-if="slots.pagination" data-slot="list-filters-pagination" class="flex justify-end">
        <slot name="pagination" />
      </div>
    </div>
  </div>
</template>
