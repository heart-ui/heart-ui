<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { DialogTitle as RekaDialogTitle, type DialogTitleProps } from 'reka-ui'
import { cn } from '@/lib/utils/utils'

interface Props extends DialogTitleProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<Props>(), { class: undefined })
</script>

<template>
  <RekaDialogTitle
    :as="as"
    :as-child="asChild"
    :class="cn('text-lg font-semibold text-foreground', props.class)"
  >
    <slot />
  </RekaDialogTitle>
</template>
