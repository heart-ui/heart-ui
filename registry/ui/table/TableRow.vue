<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

interface TableRowProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<TableRowProps>(), { class: undefined })
</script>

<template>
  <!-- The header's own border closes its row, so the last row of any section draws none. -->
  <tr data-slot="table-row" :class="cn('border-b border-border last:border-b-0', props.class)">
    <slot />
  </tr>
</template>
