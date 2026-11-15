<script setup lang="ts">
import type { ClassValue } from 'clsx'
import {
  injectRadioGroupRootContext,
  RadioGroupIndicator,
  RadioGroupItem as RekaRadioGroupItem,
} from 'reka-ui'
import { computed, inject, nextTick, ref, useAttrs } from 'vue'
import { fireFormEvents, handFocus } from '@/lib/form-control'
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

const attrs = useAttrs()
// `id` goes on our own button below; read in the render, since a computed doesn't track a spread.
const controlId = () => attrs.id as string | undefined
function forwarded() {
  return Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'id'))
}
const checked = computed(() => root.modelValue?.value === props.value)

// A user's choice (Reka's `select`, which also fires on the item already chosen) fires input and
// change on the form when it changed something; a value set in code fires nothing.
const input = ref<HTMLInputElement>()
async function chosen() {
  const was = checked.value
  await nextTick()
  if (!was && checked.value) fireFormEvents(input.value)
}

const text = { sm: 'text-sm', md: 'text-sm', lg: 'text-base' } as const
// Drawn by its border, which stays visible when colours are forced and backgrounds vanish.
const dot = { sm: 'size-1.5 border-3', md: 'size-1.5 border-3', lg: 'size-2 border-4' } as const
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
      <!-- Given an `id`, Reka builds an unescaped `[for=id]` selector from it and copies that
           label's text (hidden marks included) into a stale aria-label. So Reka never gets the
           `id`: the button is ours (as-child) and carries it, and the labels name it natively. -->
      <RekaRadioGroupItem
        v-bind="forwarded()"
        as-child
        :value="props.value"
        :disabled="props.disabled"
        :class="radioGroupItemVariants({ size: group.size.value })"
        @select="chosen"
      >
        <button :id="controlId()" type="button">
          <RadioGroupIndicator
            :class="
              cn(
                'rounded-full border-primary-foreground bg-primary-foreground',
                dot[group.size.value],
              )
            "
          />
        </button>
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
        @focus="handFocus($event, 'radio')"
      />
    </span>
    <slot />
  </label>
</template>
