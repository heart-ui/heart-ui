<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { computed, nextTick, ref, useAttrs } from 'vue'
import { fireFormEvents, handFocus } from '@/lib/form-control'
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
// Only a named checkbox has a form input to enforce `required`, so only it announces it.
const required = computed(() => !!props.name && attrs.required != null && attrs.required !== false)
// `id` and `required` are set below; read in the render, since a computed doesn't track a spread.
const controlId = () => attrs.id as string | undefined
function forwarded() {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== 'id' && key !== 'required'),
  )
}

// A user's toggle fires input and change on the form, unless the parent rejected it.
const input = ref<HTMLInputElement>()
async function toggle(next: boolean | 'indeterminate') {
  const before = input.value?.checked
  model.value = next
  await nextTick()
  if (input.value && input.value.checked !== before) fireFormEvents(input.value)
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
      <!-- Given an `id`, Reka copies the text of any `[for=id]` label (hidden marks included) into
           a stale aria-label that outranks the caller's attributes. So Reka never gets the `id`:
           the button is ours (as-child) and carries it, and the labels name it natively. -->
      <CheckboxRoot
        v-bind="forwarded()"
        as-child
        :model-value="model"
        :disabled="props.disabled"
        :required="required"
        :class="checkboxVariants({ size: props.size })"
        @update:model-value="toggle"
      >
        <button :id="controlId()" type="button">
          <CheckboxIndicator class="flex items-center justify-center">
            <Icon :name="icon" :class="iconSize[props.size]" />
          </CheckboxIndicator>
        </button>
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
        @focus="handFocus($event, 'checkbox')"
      />
    </span>
    <slot />
  </label>
</template>
