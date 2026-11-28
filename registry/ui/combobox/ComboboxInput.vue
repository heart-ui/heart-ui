<script setup lang="ts">
import type { ClassValue } from 'clsx'
import {
  ComboboxAnchor,
  injectComboboxRootContext,
  injectListboxRootContext,
  ComboboxInput as RekaComboboxInput,
  ComboboxTrigger,
} from 'reka-ui'
import { computed, inject, ref, useAttrs, watch } from 'vue'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'
import { comboboxKey } from './Combobox.vue'
import { comboboxInputVariants, type ComboboxInputVariants } from './combobox.variants'

interface ComboboxInputProps {
  size?: NonNullable<ComboboxInputVariants['size']>
  invalid?: boolean
  /** Shown while the field is empty. */
  placeholder?: string
  /** Text shown for the chosen value; defaults to the chosen item's text. */
  displayValue?: (value: string) => string
  /** Accessible name of the button that opens the list. */
  toggleLabel?: string
  /** Applied to the box; every other attribute goes to the `input`. */
  class?: ClassValue
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<ComboboxInputProps>(), {
  size: 'md',
  placeholder: undefined,
  displayValue: undefined,
  toggleLabel: 'Show options',
  class: undefined,
})
const search = defineModel<string>({ default: '' })
const attrs = useAttrs()
// `invalid` wins; otherwise a form library's own aria-invalid is kept.
const ariaInvalid = computed(() =>
  props.invalid ? 'true' : (attrs['aria-invalid'] as 'true' | 'false' | undefined),
)

const root = injectComboboxRootContext()
const listbox = injectListboxRootContext()
const context = inject(comboboxKey, undefined)
const disabled = computed(() => !!root.disabled.value)

function label(value: unknown): string {
  if (typeof value !== 'string' || value === '') return ''
  return props.displayValue ? props.displayValue(value) : (context?.texts.get(value) ?? value)
}

// Reka keeps the last highlighted option after it unmounts (the list closed, or filtering left no
// match), so the field would name an option that is gone. Checked after each render, once the DOM
// has caught up.
const highlightGone = ref(true)
watch(
  [root.open, root.highlightedElement, root.filterState, () => root.allItems.value.size],
  () => {
    highlightGone.value = !root.open.value || !root.highlightedElement.value?.isConnected
    // Reka highlights again only when the old list was empty, so results a caller swaps in while
    // the list is open would leave nothing highlighted.
    if (root.open.value && highlightGone.value && root.filterState.value.count > 0)
      listbox.highlightFirstItem()
  },
  { flush: 'post', immediate: true },
)
const activeOption = computed(() =>
  highlightGone.value ? { 'aria-activedescendant': undefined } : {},
)

// While the list is open, Enter belongs to it, even when nothing matches. As in Reka, modified
// Enter (a form's save shortcut) and Enter that commits an input method's text pass through.
function keepEnter(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
  if (root.open.value) event.preventDefault()
}

// Reka writes the shown text on a choice, a reset and each keystroke; the field shows it.
const text = ref(search.value || label(root.modelValue.value))
function write(next: string) {
  text.value = next
  if (next !== search.value) search.value = next
}
watch(search, (next) => (text.value = next))
// An item's text can register after the value was set (the list mounts on the client), and the
// value can change in code; Reka only rewrites the field when the value itself changes.
watch(
  () => label(root.modelValue.value),
  (next) => {
    if (!root.open.value) write(next)
  },
)
</script>

<template>
  <ComboboxAnchor
    data-slot="combobox-input"
    :data-disabled="disabled ? '' : undefined"
    :class="cn(comboboxInputVariants({ size: props.size, invalid: props.invalid }), props.class)"
  >
    <RekaComboboxInput
      v-bind="{ ...$attrs, ...activeOption }"
      :model-value="text"
      :display-value="label"
      :placeholder="props.placeholder"
      :aria-invalid="ariaInvalid"
      class="h-full min-w-0 flex-1 bg-transparent outline-hidden placeholder:text-subtle-foreground disabled:cursor-not-allowed"
      @update:model-value="write"
      @keydown.enter="keepEnter"
    />
    <ComboboxTrigger
      :aria-label="props.toggleLabel"
      class="inline-flex shrink-0 items-center text-muted-foreground disabled:cursor-not-allowed"
    >
      <Icon name="chevron-down" class="size-4" />
    </ComboboxTrigger>
  </ComboboxAnchor>
</template>
