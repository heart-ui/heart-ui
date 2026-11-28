<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { ComboboxEmpty as RekaComboboxEmpty } from 'reka-ui'
import { inject } from 'vue'
import { cn } from '@/lib/utils/utils'
import { comboboxTextOnlyKey } from './Combobox.vue'

interface ComboboxEmptyProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<ComboboxEmptyProps>(), { class: undefined })
const textOnly = inject(comboboxTextOnlyKey, false)
</script>

<template>
  <!-- Rendered only with content: an empty slot lets Reka's English fallback show. -->
  <RekaComboboxEmpty
    v-if="!textOnly && $slots.default"
    :class="cn('py-6 text-center text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </RekaComboboxEmpty>
</template>
