<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { Separator as RekaSeparator } from 'reka-ui'
import { cn } from '@/lib/utils/utils'
import { separatorVariants, type SeparatorVariants } from './separator.variants'

interface SeparatorProps {
  orientation?: NonNullable<SeparatorVariants['orientation']>
  /** Hidden from screen readers. Turn off when the rule separates groups readers should hear. */
  decorative?: boolean
  class?: ClassValue
}

defineOptions({ name: 'HSeparator' })

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: 'horizontal',
  decorative: true,
  class: undefined,
})
</script>

<template>
  <RekaSeparator
    data-slot="separator"
    :orientation="props.orientation"
    :decorative="props.decorative"
    :class="cn(separatorVariants({ orientation: props.orientation }), props.class)"
  />
</template>
