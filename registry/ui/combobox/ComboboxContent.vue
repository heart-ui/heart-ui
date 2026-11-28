<script setup lang="ts">
import type { ClassValue } from 'clsx'
import {
  ComboboxPortal,
  ComboboxContent as RekaComboboxContent,
  ComboboxViewport,
  injectComboboxRootContext,
} from 'reka-ui'
import { defineComponent, provide } from 'vue'
import { cn } from '@/lib/utils/utils'
import { comboboxTextOnlyKey } from './Combobox.vue'

interface ComboboxContentProps {
  class?: ClassValue
}

// The root is the portal, so attributes go to the content element by hand.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<ComboboxContentProps>(), { class: undefined })
const root = injectComboboxRootContext()

// Its parts render plain text, never Reka options: a hidden option would still be highlighted,
// named by aria-activedescendant and chosen by Enter.
const TextOnly = defineComponent({
  setup(_, { slots }) {
    provide(comboboxTextOnlyKey, true)
    return () => slots.default?.()
  },
})

// As wide as the field, and capped at the room Reka measures beside it, so the list scrolls.
const style = {
  width: 'var(--reka-combobox-trigger-width)',
  maxHeight: 'var(--reka-combobox-content-available-height)',
}
</script>

<template>
  <ComboboxPortal>
    <RekaComboboxContent
      position="popper"
      :side-offset="4"
      :style="style"
      v-bind="$attrs"
      :class="
        cn(
          'z-popover overflow-hidden rounded-md border border-border bg-surface-raised text-foreground shadow-md',
          'state-open:animate-fade-in',
          props.class,
        )
      "
    >
      <ComboboxViewport class="max-h-72 p-1">
        <slot />
      </ComboboxViewport>
    </RekaComboboxContent>
  </ComboboxPortal>
  <!-- While closed, the items render hidden in place, so each registers its text and the field can
       show the chosen item's text before the list first opens. Keeping the list itself mounted
       instead makes Reka hide it from assistive tech when it opens. -->
  <div v-if="!root.open.value" hidden>
    <TextOnly><slot /></TextOnly>
  </div>
</template>
