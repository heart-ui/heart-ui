<script setup lang="ts">
import type { ClassValue } from 'clsx'
import {
  injectRadioGroupRootContext,
  RadioGroupIndicator,
  RadioGroupItem as RekaRadioGroupItem,
} from 'reka-ui'
import { computed, inject, nextTick, ref } from 'vue'
import { cn } from '@/lib/utils/utils'
import { radioGroupKey } from './RadioGroup.vue'
import { radioGroupItemVariants } from './radio-group.variants'

interface RadioGroupItemProps {
  value: string
  disabled?: boolean
  /** Applied to the wrapping label; every other attribute goes to the radio. */
  class?: ClassValue
}

defineOptions({ name: 'HRadioGroupItem', inheritAttrs: false })

const props = withDefaults(defineProps<RadioGroupItemProps>(), { class: undefined })
const group = inject(radioGroupKey, {
  size: ref('md' as const),
  name: ref(undefined),
  required: ref(false),
})
const root = injectRadioGroupRootContext()
const disabled = computed(() => props.disabled || root.disabled.value)
const checked = computed(() => root.modelValue?.value === props.value)

// Form validation focuses the first invalid control, which is a hidden input. Hand focus to the
// visible radio, so arrow keys act on the model and screen readers announce the radio.
function handFocus(event: FocusEvent) {
  const input = event.target as HTMLElement
  input.parentElement?.querySelector<HTMLElement>('[role="radio"]')?.focus()
}

// A user's choice (Reka's `select`) fires input and change on the form, as choosing a native radio
// does, so form-level listeners (dirty state, autosave) see it. A value set in code fires nothing.
const input = ref<HTMLInputElement>()
async function chosen() {
  await nextTick()
  if (!checked.value) return
  input.value?.dispatchEvent(new Event('input', { bubbles: true }))
  input.value?.dispatchEvent(new Event('change', { bubbles: true }))
}

const text = { sm: 'text-sm', md: 'text-sm', lg: 'text-base' } as const
const dot = { sm: 'size-1.5', md: 'size-1.5', lg: 'size-2' } as const
</script>

<template>
  <!-- A button is labelable, so the label names the radio and a click on the text chooses it. -->
  <label
    data-slot="radio-group-item"
    :data-disabled="disabled ? '' : undefined"
    :class="
      cn(
        'inline-flex items-start gap-gap-sm text-foreground',
        'data-disabled:cursor-not-allowed data-disabled:text-muted-foreground',
        text[group.size.value],
        props.class,
      )
    "
  >
    <!-- One line tall, so the radio sits centred on the label's first line at every size. -->
    <span class="relative flex h-lh shrink-0 items-center">
      <RekaRadioGroupItem
        v-bind="$attrs"
        :value="props.value"
        :disabled="props.disabled"
        :class="radioGroupItemVariants({ size: group.size.value })"
        @select="chosen"
      >
        <RadioGroupIndicator
          :class="cn('rounded-full bg-primary-foreground', dot[group.size.value])"
        />
      </RekaRadioGroupItem>
      <!-- The form's view of this item, under the radio so a validation bubble points at it.
           It comes after the button, so the label still names the button. -->
      <input
        v-if="group.name.value"
        ref="input"
        type="radio"
        class="pointer-events-none absolute inset-0 m-0 size-full opacity-0"
        tabindex="-1"
        aria-hidden="true"
        :name="group.name.value"
        :value="props.value"
        :checked="checked"
        :required="group.required.value"
        :disabled="disabled"
        @focus="handFocus"
      />
    </span>
    <slot />
  </label>
</template>
