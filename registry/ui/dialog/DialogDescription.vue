<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { DialogDescription as RekaDialogDescription, type DialogDescriptionProps } from 'reka-ui'
import { inject, onUnmounted } from 'vue'
import { cn } from '@/lib/utils/utils'
import { descriptionKey } from './DialogContent.vue'

interface Props extends DialogDescriptionProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<Props>(), { class: undefined })

const descriptions = inject(descriptionKey, undefined)
if (descriptions) {
  descriptions.value++
  onUnmounted(() => descriptions.value--)
}
</script>

<template>
  <RekaDialogDescription
    :as="as"
    :as-child="asChild"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </RekaDialogDescription>
</template>
