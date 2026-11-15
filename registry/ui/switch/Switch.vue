<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { computed, nextTick, ref, useAttrs } from 'vue'
import { fireFormEvents, handFocus } from '@/lib/form-control'
import { cn } from '@/lib/utils/utils'
import { switchThumbVariants, switchVariants, type SwitchVariants } from './switch.variants'

interface SwitchProps {
  size?: NonNullable<SwitchVariants['size']>
  disabled?: boolean
  /** Submits `value` in its form while on; `required` needs it. */
  name?: string
  value?: string
  /** Applied to the wrapping label; every other attribute goes to the switch control. */
  class?: ClassValue
}

defineOptions({ name: 'HSwitch', inheritAttrs: false })

const props = withDefaults(defineProps<SwitchProps>(), {
  size: 'md',
  name: undefined,
  value: 'on',
  class: undefined,
})
const model = defineModel<boolean>({ default: false })
const attrs = useAttrs()
// Only a named switch has a form input to enforce `required`, so only it announces it.
const required = computed(() => !!props.name && attrs.required != null && attrs.required !== false)
// `required` is set below; read in the render, since a computed doesn't track a spread.
function forwarded() {
  return Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'required'))
}

// A user's toggle fires input and change on the form, unless the parent rejected it.
const input = ref<HTMLInputElement>()
async function toggle(next: boolean) {
  const before = input.value?.checked
  model.value = next
  await nextTick()
  if (input.value && input.value.checked !== before) fireFormEvents(input.value)
}

const text = { sm: 'text-sm', md: 'text-sm', lg: 'text-base' } as const
</script>

<template>
  <!-- A button is labelable, so the label names the switch and a click on the text toggles it. -->
  <label
    data-slot="switch"
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
    <!-- One line tall, so the track sits centred on the label's first line at every size. -->
    <span class="relative flex h-lh shrink-0 items-center">
      <!-- Given an `id`, Reka copies the text of any `[for=id]` label (hidden marks included) into
           a stale aria-label. Passing the caller's aria-label (often undefined) overrides it, so the
           labels name the switch natively. -->
      <SwitchRoot
        v-bind="forwarded()"
        :aria-label="attrs['aria-label']"
        :model-value="model"
        :disabled="props.disabled"
        :required="required"
        :class="switchVariants({ size: props.size })"
        @update:model-value="toggle"
      >
        <SwitchThumb data-slot="switch-thumb" :class="switchThumbVariants({ size: props.size })" />
      </SwitchRoot>
      <!-- The form sees a native checkbox, under the track so a validation bubble points at it.
           It comes after the button, so the label still names the button. -->
      <input
        v-if="props.name"
        ref="input"
        type="checkbox"
        class="pointer-events-none absolute inset-0 m-0 size-full opacity-0"
        tabindex="-1"
        aria-hidden="true"
        :name="props.name"
        :value="props.value"
        :checked="model"
        :required="required"
        :disabled="props.disabled"
        @focus="handFocus($event, 'switch')"
      />
    </span>
    <slot />
  </label>
</template>
