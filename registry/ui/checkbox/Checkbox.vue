<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { computed, useAttrs } from 'vue'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'
import { checkboxVariants, type CheckboxVariants } from './checkbox.variants'

interface CheckboxProps {
  size?: NonNullable<CheckboxVariants['size']>
  disabled?: boolean
  /** Submits `value` in its form while checked. */
  name?: string
  value?: string
  /** Applied to the wrapping label; every other attribute goes to the checkbox control. */
  class?: ClassValue
}

defineOptions({ name: 'HCheckbox', inheritAttrs: false })

const props = withDefaults(defineProps<CheckboxProps>(), {
  size: 'md',
  name: undefined,
  value: 'on',
  class: undefined,
})
const model = defineModel<boolean | 'indeterminate'>({ default: false })
const attrs = useAttrs()

const icon = computed(() => (model.value === 'indeterminate' ? 'minus-sm' : 'check-sm'))
const required = computed(() => attrs.required != null && attrs.required !== false)

const text = { sm: 'text-sm', md: 'text-sm', lg: 'text-base' } as const
const iconSize = { sm: 'size-2.5', md: 'size-3', lg: 'size-3.5' } as const
</script>

<template>
  <!-- A button is labelable, so the label names the control and a click on the text toggles it. -->
  <label
    data-slot="checkbox"
    :data-disabled="props.disabled ? '' : undefined"
    :class="
      cn(
        'inline-flex items-start gap-gap-sm text-foreground',
        'data-disabled:cursor-not-allowed data-disabled:text-muted-foreground',
        text[props.size],
        props.class,
      )
    "
  >
    <!-- One line tall, so the box sits centred on the label's first line at every size. -->
    <span class="flex h-lh shrink-0 items-center">
      <CheckboxRoot
        v-bind="$attrs"
        v-model="model"
        :disabled="props.disabled"
        :class="checkboxVariants({ size: props.size })"
      >
        <CheckboxIndicator class="flex items-center justify-center">
          <Icon :name="icon" :class="iconSize[props.size]" />
        </CheckboxIndicator>
      </CheckboxRoot>
    </span>
    <!-- The form sees a native checkbox: indeterminate counts as unchecked for submit and
         `required`, which Reka's own hidden input doesn't do. It comes after the button, so the
         label still names the button. -->
    <input
      v-if="props.name"
      type="checkbox"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      :name="props.name"
      :value="props.value"
      :checked="model === true"
      :required="required"
      :disabled="props.disabled"
    />
    <slot />
  </label>
</template>
