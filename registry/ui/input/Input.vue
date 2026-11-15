<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { Comment, computed, Fragment, ref, useAttrs, useSlots, type VNode } from 'vue'
import { cn } from '@/lib/utils/utils'
import { inputVariants, type InputVariants } from './input.variants'

interface InputProps {
  size?: NonNullable<InputVariants['size']>
  invalid?: boolean
  disabled?: boolean
  /** Applied to the wrapper; every other attribute goes to the `input`. */
  class?: ClassValue
}

defineOptions({ name: 'HInput', inheritAttrs: false })

const props = withDefaults(defineProps<InputProps>(), { size: 'md', class: undefined })
const model = defineModel<string>({ default: '' })
const attrs = useAttrs()
const slots = useSlots()
const field = ref<HTMLInputElement>()
const focused = ref(false)
const readonly = computed(() => attrs.readonly !== undefined && attrs.readonly !== false)
// `invalid` wins; otherwise a form library's own aria-invalid is kept.
const ariaInvalid = computed(() =>
  props.invalid ? 'true' : (attrs['aria-invalid'] as 'true' | 'false' | undefined),
)

// A slot whose content renders nothing (a `v-if` that is off, an empty fragment) gets no wrapper
// and no gap.
function rendersSomething(nodes: VNode[]): boolean {
  return nodes.some((node) =>
    node.type === Comment
      ? false
      : node.type === Fragment
        ? rendersSomething((node.children ?? []) as VNode[])
        : true,
  )
}
function hasContent(name: 'leading' | 'trailing') {
  return rendersSomething(slots[name]?.() ?? [])
}

// A press on the box while the input has focus keeps it focused, so blur listeners (validation,
// popovers) don't fire for what is a click inside the field.
function keepFocus(event: MouseEvent) {
  const box = event.currentTarget as HTMLElement
  const control = (event.target as HTMLElement).closest(
    'a, button, input, select, textarea, [tabindex]',
  )
  if (document.activeElement === field.value && !(control && box.contains(control)))
    event.preventDefault()
}

// A click on the box or a non-interactive slot focuses the input, as a click on its label would.
// Only controls inside the box keep the click; a focusable ancestor (a dialog) doesn't count.
function focusField(event: MouseEvent) {
  const box = event.currentTarget as HTMLElement
  const control = (event.target as HTMLElement).closest(
    'a, button, input, select, textarea, [tabindex]',
  )
  if (control && box.contains(control)) return
  field.value?.focus()
}
</script>

<template>
  <div
    data-slot="input"
    :data-disabled="disabled ? '' : undefined"
    :data-readonly="readonly ? '' : undefined"
    :data-focused="focused && !disabled ? '' : undefined"
    :class="cn(inputVariants({ size, invalid }), props.class)"
    @mousedown="keepFocus"
    @click="focusField"
  >
    <span
      v-if="hasContent('leading')"
      :inert="disabled"
      class="inline-flex shrink-0 items-center text-muted-foreground"
    >
      <slot name="leading" />
    </span>
    <input
      ref="field"
      v-bind="$attrs"
      v-model="model"
      :disabled="disabled"
      :aria-invalid="ariaInvalid"
      class="h-full min-w-0 flex-1 bg-transparent outline-hidden placeholder:text-subtle-foreground disabled:cursor-not-allowed"
      @focus="focused = true"
      @blur="focused = false"
    />
    <span
      v-if="hasContent('trailing')"
      :inert="disabled"
      class="inline-flex shrink-0 items-center text-muted-foreground"
    >
      <slot name="trailing" />
    </span>
  </div>
</template>
