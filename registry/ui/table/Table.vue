<script lang="ts">
import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { TableCellVariants } from './table.variants'

export interface TableContext {
  size: ComputedRef<NonNullable<TableCellVariants['size']>>
  /** The caption's id, which names the scroll container while it is a region. */
  captionId: Ref<string | undefined>
}
export const tableKey: InjectionKey<TableContext> = Symbol('table')
</script>

<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { computed, onBeforeUnmount, onMounted, provide, ref, useAttrs, useTemplateRef } from 'vue'
import { cn } from '@/lib/utils/utils'
import { tableHeaderKey } from './TableHeader.vue'

interface TableProps {
  /** Row density: each row is at least the control height of its size. */
  size?: NonNullable<TableCellVariants['size']>
  class?: ClassValue
}

defineOptions({ name: 'HTable' })

const props = withDefaults(defineProps<TableProps>(), { size: 'md', class: undefined })
const captionId = ref<string>()
provide(tableKey, { size: computed(() => props.size), captionId })
provide(tableHeaderKey, false)

// Keyboard users must be able to reach a container that scrolls; one that doesn't is no stop.
const container = useTemplateRef<HTMLDivElement>('container')
const table = useTemplateRef<HTMLTableElement>('table')
const overflows = ref(false)
// A focused container keeps its tab stop until it loses focus, or focus would fall back to the page.
const focused = ref(false)
const focusable = computed(() => overflows.value || focused.value)
// The window losing focus blurs the container but leaves it the active element.
const onBlur = () => (focused.value = document.activeElement === container.value)
const attrs = useAttrs()
// Read in the render: a computed doesn't track the attrs proxy reliably. A caller's name always
// makes the container a region, since a name on a plain div is ignored.
const namedByCaller = () =>
  Boolean(
    attrs['aria-label'] ?? attrs.ariaLabel ?? attrs['aria-labelledby'] ?? attrs.ariaLabelledby,
  )
let observer: ResizeObserver | undefined

function measure() {
  const element = container.value
  if (!element) return
  // Both sizes are rounded to whole pixels, so a table that fits can measure 1 px over.
  overflows.value =
    element.scrollWidth - element.clientWidth > 1 || element.scrollHeight - element.clientHeight > 1
}

onMounted(() => {
  observer = new ResizeObserver(measure)
  observer.observe(container.value!)
  observer.observe(table.value!)
  measure()
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div
    ref="container"
    data-slot="table-container"
    :tabindex="focusable ? 0 : undefined"
    :role="namedByCaller() || (focusable && captionId) ? 'region' : undefined"
    :aria-labelledby="focusable && !namedByCaller() ? captionId : undefined"
    :class="
      cn(
        'relative w-full overflow-auto rounded-sm outline-hidden',
        'focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-focus focus-visible:ring-offset-background',
        props.class,
      )
    "
    @focus="focused = true"
    @blur="onBlur"
  >
    <table ref="table" data-slot="table" class="w-full caption-top border-collapse text-sm">
      <slot />
    </table>
  </div>
</template>
