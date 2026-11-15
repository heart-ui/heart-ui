<script lang="ts">
import type { InjectionKey, Ref } from 'vue'

export interface SelectFormContext {
  name: Ref<string | undefined>
  autocomplete: Ref<string | undefined>
  /** Counts the user's choices that changed the value, so the trigger fires form events for them. */
  choices: Ref<number>
}
export const selectFormKey: InjectionKey<SelectFormContext> = Symbol('select-form')
</script>

<script setup lang="ts">
import { SelectRoot } from 'reka-ui'
import { computed, nextTick, provide, ref, toRef, useAttrs } from 'vue'

interface SelectProps {
  disabled?: boolean
  /** Submits the chosen item's value in its form; `required` needs it. */
  name?: string
  required?: boolean
}

defineOptions({ name: 'HSelect' })

const props = withDefaults(defineProps<SelectProps>(), { name: undefined })
const model = defineModel<string>()
// Undefined until bound, so an unbound select stays uncontrolled (`defaultOpen` works).
const open = defineModel<boolean | undefined>('open', { default: undefined })
const attrs = useAttrs()

// The trigger renders the form's native select; Reka gets no name, so it renders none of its own
// (Reka's can't take focus when form validation fails).
const choices = ref(0)
provide(selectFormKey, {
  name: toRef(props, 'name'),
  autocomplete: computed(() => attrs.autocomplete as string | undefined),
  choices,
})
// Reka gets `null`, never `undefined`: undefined would make it keep its own value, so a choice the
// parent rejects would still show and submit.
// Reka also reports picking the item already chosen, and a parent may reject the value.
async function choose(next: string | null) {
  if (next == null || next === model.value) return
  model.value = next
  await nextTick()
  if (model.value === next) choices.value++
}
</script>

<template>
  <SelectRoot
    v-model:open="open"
    :model-value="model ?? null"
    :disabled="props.disabled"
    :required="props.required && !!props.name"
    @update:model-value="choose"
  >
    <slot />
  </SelectRoot>
</template>
