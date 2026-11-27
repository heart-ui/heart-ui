<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { PaginationList, PaginationListItem, PaginationRoot, useDirection } from 'reka-ui'
import { computed } from 'vue'
import { buttonVariants } from '@/components/ui/button'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'

interface PaginationProps {
  /** How many items the list holds. */
  total: number
  pageSize?: number
  /** The landmark's accessible name. */
  navLabel?: string
  previousLabel?: string
  nextLabel?: string
  /** Each page button's accessible name; every `{page}` becomes its number. */
  pageLabel?: string
  class?: ClassValue
}

defineOptions({ name: 'HPagination' })

const props = withDefaults(defineProps<PaginationProps>(), {
  pageSize: 10,
  navLabel: 'Pagination',
  previousLabel: 'Previous page',
  nextLabel: 'Next page',
  pageLabel: 'Page {page}',
  class: undefined,
})
const page = defineModel<number>('page', { default: 1 })

// A total or page size that isn't a positive number counts as one page.
const pageCount = computed(() => {
  const count = Math.ceil(props.total / props.pageSize)
  return Number.isFinite(count) && count > 1 ? count : 1
})
// The page shown, brought into range without emitting: a deep-linked page survives a total of 0
// while data loads, and nothing is emitted during SSR. The next press steps from here.
const current = computed(() => {
  const value = Number.isFinite(page.value) ? Math.round(page.value) : 1
  return Math.min(Math.max(value, 1), pageCount.value)
})

const atStart = computed(() => current.value <= 1)
const atEnd = computed(() => current.value >= pageCount.value)

// Reka's own previous and next set `disabled`, which drops focus to the page when the last press
// reaches an end; these stay focusable with `aria-disabled` instead.
function step(by: number) {
  if (by < 0 ? atStart.value : atEnd.value) return
  page.value = current.value + by
}

const dir = useDirection()
const chevrons = computed(() =>
  dir.value === 'rtl'
    ? ({ previous: 'chevron-right', next: 'chevron-left' } as const)
    : ({ previous: 'chevron-left', next: 'chevron-right' } as const),
)

const item = (current: boolean) =>
  cn(
    buttonVariants({ variant: current ? 'outline' : 'ghost', size: 'md' }),
    'min-w-control-md px-control-px-sm',
  )
const edge = cn(
  buttonVariants({ variant: 'ghost', size: 'md' }),
  'w-control-md px-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
)
</script>

<template>
  <PaginationRoot
    :page="current"
    :total="pageCount"
    :items-per-page="1"
    :sibling-count="1"
    show-edges
    :aria-label="props.navLabel"
    :class="cn('flex', props.class)"
    @update:page="page = $event"
  >
    <PaginationList v-slot="{ items }" as="ul" class="flex flex-wrap items-center gap-1">
      <li>
        <button
          type="button"
          :aria-label="props.previousLabel"
          :aria-disabled="atStart ? 'true' : undefined"
          :class="edge"
          @click="step(-1)"
        >
          <Icon :name="chevrons.previous" class="size-4" />
        </button>
      </li>
      <template
        v-for="(entry, index) in items"
        :key="entry.type === 'page' ? `page-${entry.value}` : `gap-${index}`"
      >
        <li v-if="entry.type === 'page'">
          <PaginationListItem
            :value="entry.value"
            :aria-label="props.pageLabel.replaceAll('{page}', String(entry.value))"
            :class="item(entry.value === current)"
          />
        </li>
        <li
          v-else
          aria-hidden="true"
          class="inline-flex min-w-control-md items-center justify-center text-sm text-muted-foreground"
        >
          …
        </li>
      </template>
      <li>
        <button
          type="button"
          :aria-label="props.nextLabel"
          :aria-disabled="atEnd ? 'true' : undefined"
          :class="edge"
          @click="step(1)"
        >
          <Icon :name="chevrons.next" class="size-4" />
        </button>
      </li>
    </PaginationList>
  </PaginationRoot>
</template>
