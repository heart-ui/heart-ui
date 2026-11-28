<script lang="ts">
import type { InjectionKey } from 'vue'

export interface ComboboxContext {
  /** Each item's text by its value, so the field can show the chosen item's text. */
  texts: Map<string, string>
}
export const comboboxKey: InjectionKey<ComboboxContext> = Symbol('combobox')
/** True inside the hidden copy of the list, where parts render only their text. */
export const comboboxTextOnlyKey: InjectionKey<boolean> = Symbol('combobox-text-only')
</script>

<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { ComboboxRoot } from 'reka-ui'
import { provide, reactive } from 'vue'

interface ComboboxProps {
  disabled?: boolean
  /** Submits the chosen item's value in its form. */
  name?: string
  /** Hides items whose text doesn't contain the typed text; `false` for a list the caller loads. */
  filter?: boolean
  class?: ClassValue
}

defineOptions({ name: 'HCombobox' })

const props = withDefaults(defineProps<ComboboxProps>(), {
  name: undefined,
  filter: true,
  class: undefined,
})
const model = defineModel<string>()
// Undefined until bound, so an unbound combobox stays uncontrolled.
const open = defineModel<boolean | undefined>('open', { default: undefined })

// Texts outlive their items, so a chosen item that a new result list drops keeps its text.
provide(comboboxKey, { texts: reactive(new Map<string, string>()) })

// Reka gets `null`, never `undefined`, so it never keeps a value of its own that the parent rejected.
function choose(next: unknown) {
  if (typeof next === 'string' && next !== model.value) model.value = next
}
</script>

<template>
  <ComboboxRoot
    v-model:open="open"
    :model-value="model ?? null"
    :disabled="props.disabled"
    :name="props.name"
    :ignore-filter="!props.filter"
    :class="props.class"
    @update:model-value="choose"
  >
    <slot />
  </ComboboxRoot>
</template>
