<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { computed, inject, onBeforeUnmount, useAttrs, useId, watchEffect } from 'vue'
import { cn } from '@/lib/utils/utils'
import { tableKey } from './Table.vue'

interface TableCaptionProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<TableCaptionProps>(), { class: undefined })
const attrs = useAttrs()
const fallbackId = useId()
// A caller's id wins, so links to the caption keep working.
const id = computed(() => (attrs.id as string | undefined) || fallbackId)
const table = inject(tableKey, undefined)

watchEffect(() => {
  if (table) table.captionId.value = id.value
})
onBeforeUnmount(() => {
  if (table?.captionId.value === id.value) table.captionId.value = undefined
})
</script>

<template>
  <caption
    :id="id"
    data-slot="table-caption"
    :class="cn('pb-gap-sm text-start text-sm font-medium text-foreground', props.class)"
  >
    <slot />
  </caption>
</template>
