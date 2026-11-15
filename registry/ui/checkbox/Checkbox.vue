<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { computed, nextTick, ref, useAttrs } from 'vue'
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

// Form validation focuses the first invalid control, which is the hidden input. Hand focus to
// the visible box, so keys act on the model and screen readers announce the checkbox.
function handFocus(event: FocusEvent) {
  const input = event.target as HTMLElement
  input.parentElement?.querySelector<HTMLElement>('[role="checkbox"]')?.focus()
}

// A user's toggle fires input and change on the form, as a click on a native checkbox does, so
// form-level listeners (dirty state, autosave) see it. A value set in code fires nothing.
const input = ref<HTMLInputElement>()
async function toggle(next: boolean | 'indeterminate') {
  model.value = next
  await nextTick()
  input.value?.dispatchEvent(new Event('input', { bubbles: true }))
  input.value?.dispatchEvent(new Event('change', { bubbles: true }))
}

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
    <span class="relative flex h-lh shrink-0 items-center">
      <CheckboxRoot
        v-bind="$attrs"
        :model-value="model"
        :disabled="props.disabled"
        :class="checkboxVariants({ size: props.size })"
        @update:model-value="toggle"
      >
        <CheckboxIndicator class="flex items-center justify-center">
          <Icon :name="icon" :class="iconSize[props.size]" />
        </CheckboxIndicator>
      </CheckboxRoot>
      <!-- The form sees a native checkbox: indeterminate counts as unchecked for submit and
           `required`, which Reka's own hidden input doesn't do. It lies under the box, so a
           validation bubble points at it, and comes after the button, so the label still names
           the button. -->
      <input
        v-if="props.name"
        ref="input"
        type="checkbox"
        class="pointer-events-none absolute inset-0 m-0 size-full opacity-0"
        tabindex="-1"
        aria-hidden="true"
        :name="props.name"
        :value="props.value"
        :checked="model === true"
        :required="required"
        :disabled="props.disabled"
        @focus="handFocus"
      />
    </span>
    <slot />
  </label>
</template>
