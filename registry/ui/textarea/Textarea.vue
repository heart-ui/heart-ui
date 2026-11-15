<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { computed, useAttrs } from 'vue'
import { cn } from '@/lib/utils/utils'
import { textareaVariants, type TextareaVariants } from './textarea.variants'

interface TextareaProps {
  size?: NonNullable<TextareaVariants['size']>
  invalid?: boolean
  /** Grows with its content; cap it with a `max-h-*` class. */
  autoresize?: boolean
  disabled?: boolean
  class?: ClassValue
}

// The caller's attributes are bound first, so `invalid` below wins over a passed aria-invalid.
defineOptions({ name: 'HTextarea', inheritAttrs: false })

const props = withDefaults(defineProps<TextareaProps>(), { size: 'md', class: undefined })
const model = defineModel<string>({ default: '' })
const attrs = useAttrs()
// Mirrors how Vue applies the attribute: null and false leave the field editable.
const readonly = computed(() =>
  [attrs.readonly, attrs.readOnly].some((value) => value != null && value !== false),
)
const ariaInvalid = computed(() =>
  props.invalid ? 'true' : (attrs['aria-invalid'] as 'true' | 'false' | undefined),
)
</script>

<template>
  <textarea
    v-bind="$attrs"
    v-model="model"
    :disabled="props.disabled"
    :aria-invalid="ariaInvalid"
    :data-readonly="readonly ? '' : undefined"
    :class="
      cn(
        textareaVariants({
          size: props.size,
          invalid: props.invalid,
          autoresize: props.autoresize,
        }),
        props.class,
      )
    "
  />
</template>
