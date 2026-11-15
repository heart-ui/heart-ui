<script lang="ts">
import type { InjectionKey, Ref } from 'vue'
import type { RadioGroupItemVariants } from './radio-group.variants'

export type RadioGroupSize = NonNullable<RadioGroupItemVariants['size']>
export interface RadioGroupContext {
  size: Ref<RadioGroupSize>
  name: Ref<string | undefined>
  required: Ref<boolean>
}
export const radioGroupKey: InjectionKey<RadioGroupContext> = Symbol('radio-group')
</script>

<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { RadioGroupRoot } from 'reka-ui'
import { provide, toRef } from 'vue'
import { cn } from '@/lib/utils/utils'

interface RadioGroupProps {
  size?: RadioGroupSize
  /** Layout; arrow keys move through the group in both directions either way. */
  orientation?: 'vertical' | 'horizontal'
  disabled?: boolean
  /** Submits the chosen item's value in its form; `required` needs it. */
  name?: string
  required?: boolean
  class?: ClassValue
}

defineOptions({ name: 'HRadioGroup' })

const props = withDefaults(defineProps<RadioGroupProps>(), {
  size: 'md',
  orientation: 'vertical',
  name: undefined,
  class: undefined,
})
const model = defineModel<string>()

// The items render native radio inputs for the form: Reka's own input submits the field with an
// empty value (`plan=`) when nothing is chosen, which a native radio group never does.
provide(radioGroupKey, {
  size: toRef(props, 'size'),
  name: toRef(props, 'name'),
  required: toRef(props, 'required'),
})
</script>

<template>
  <!-- Reka gets no orientation, so all four arrow keys move, as in the ARIA radio group pattern. -->
  <RadioGroupRoot
    v-model="model"
    :disabled="props.disabled"
    :required="props.required && !!props.name"
    :class="
      cn(
        'flex gap-gap-sm',
        props.orientation === 'horizontal'
          ? 'flex-row flex-wrap gap-x-gap-md'
          : 'flex-col items-start',
        props.class,
      )
    "
  >
    <slot />
  </RadioGroupRoot>
</template>
