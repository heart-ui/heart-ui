<script setup lang="ts">
import type { ClassValue } from 'clsx'
import {
  injectSelectRootContext,
  SelectIcon,
  SelectTrigger as RekaSelectTrigger,
  SelectValue,
} from 'reka-ui'
import { computed, inject, nextTick, ref, useAttrs, watch } from 'vue'
import { fireFormEvents } from '@/lib/form-control'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'
import { selectFormKey } from './Select.vue'
import { selectTriggerVariants, type SelectTriggerVariants } from './select.variants'

interface SelectTriggerProps {
  size?: NonNullable<SelectTriggerVariants['size']>
  invalid?: boolean
  /** Shown while nothing is chosen. */
  placeholder?: string
  class?: ClassValue
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<SelectTriggerProps>(), {
  size: 'md',
  placeholder: undefined,
  class: undefined,
})
const attrs = useAttrs()
// `invalid` wins; otherwise a form library's own aria-invalid is kept.
const ariaInvalid = computed(() =>
  props.invalid ? 'true' : (attrs['aria-invalid'] as 'true' | 'false' | undefined),
)

const root = injectSelectRootContext()
const form = inject(selectFormKey, undefined)
const value = computed(() => root.modelValue.value as string | undefined)

// A user's choice fires input and change on the form; a value set in code fires nothing.
const input = ref<HTMLSelectElement>()
let firing = false
watch(
  () => form?.choices.value,
  async () => {
    await nextTick()
    firing = true
    fireFormEvents(input.value)
    firing = false
  },
)

// The hidden select follows Reka's state, which also covers a `disabled` trigger.
const disabled = computed(
  () => !!root.disabled?.value || (attrs.disabled != null && attrs.disabled !== false),
)

// Form validation focuses the first invalid control, which is the hidden select. Hand focus to
// the trigger just before it (not a role lookup: a group may hold several selects), so keys act
// on the model and screen readers announce the trigger.
function handFocus(event: FocusEvent) {
  ;((event.target as HTMLElement).previousElementSibling as HTMLElement | null)?.focus()
}

// The items register as options (Reka renders them even while the list is closed), so the hidden
// select lists them all and browser autofill can pick one.
const options = computed(() =>
  [...(root.optionsSet?.value ?? [])].map((option) => ({
    value: String(option.value),
    text: option.textContent ?? String(option.value),
    disabled: !!option.disabled,
  })),
)
// Input from the browser (autofill) picks the value; the events fired above don't count.
function autofill(event: Event) {
  if (firing) return
  root.onValueChange((event.target as HTMLSelectElement).value)
}
</script>

<template>
  <!-- Named, the trigger shares a positioned box with the form's select, laid over it; unnamed, the
       box takes no part in layout (display: contents). -->
  <div :class="form?.name.value ? 'relative' : 'contents'">
    <RekaSelectTrigger
      v-bind="$attrs"
      :aria-invalid="ariaInvalid"
      :class="cn(selectTriggerVariants({ size: props.size, invalid: props.invalid }), props.class)"
    >
      <SelectValue :placeholder="props.placeholder" class="truncate" />
      <SelectIcon as-child>
        <Icon name="chevron-down" class="size-4 text-muted-foreground" />
      </SelectIcon>
    </RekaSelectTrigger>
    <!-- The form's view of the select: a native select listing every option, so submit,
         `required` and autofill behave natively. It lies over the trigger, where a validation
         bubble then points; the chosen option is selected as an attribute, so a form reset keeps
         it. -->
    <select
      v-if="form?.name.value"
      ref="input"
      class="pointer-events-none absolute inset-0 m-0 size-full opacity-0"
      tabindex="-1"
      aria-hidden="true"
      :name="form.name.value"
      :autocomplete="form.autocomplete.value"
      :required="!!root.required?.value"
      :disabled="disabled"
      @focus="handFocus"
      @input="autofill"
    >
      <option value="" />
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
        :selected.attr="option.value === value ? true : undefined"
      >
        {{ option.text }}
      </option>
    </select>
  </div>
</template>
