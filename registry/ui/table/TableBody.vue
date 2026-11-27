<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

interface TableBodyProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<TableBodyProps>(), { class: undefined })
</script>

<template>
  <tbody data-slot="table-body" :class="cn(props.class)">
    <slot />
  </tbody>
</template>
