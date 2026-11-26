<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { AccordionRoot } from 'reka-ui'
import { cn } from '@/lib/utils/utils'

interface AccordionProps {
  /** `multiple` lets several items stay open. */
  type?: 'single' | 'multiple'
  /** `false` keeps one item open in `single`. */
  collapsible?: boolean
  disabled?: boolean
  /** The open item or items at first, without `v-model`. */
  defaultValue?: string | string[]
  class?: ClassValue
}

defineOptions({ name: 'HAccordion' })

const props = withDefaults(defineProps<AccordionProps>(), {
  type: 'single',
  collapsible: true,
  disabled: false,
  defaultValue: undefined,
  class: undefined,
})
// Undefined until bound, so an unbound accordion stays uncontrolled (`defaultValue` works).
const model = defineModel<string | string[] | undefined>({ default: undefined })
</script>

<template>
  <AccordionRoot
    v-model="model"
    :type="props.type"
    :collapsible="props.collapsible"
    :disabled="props.disabled"
    :default-value="props.defaultValue"
    :class="cn('flex flex-col', props.class)"
  >
    <slot />
  </AccordionRoot>
</template>
