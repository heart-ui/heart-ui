<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { TabsTrigger as RekaTabsTrigger } from 'reka-ui'
import { inject, ref } from 'vue'
import { cn } from '@/lib/utils/utils'
import { tabsKey } from './Tabs.vue'
import { tabsTriggerVariants } from './tabs.variants'

interface TabsTriggerProps {
  value: string
  disabled?: boolean
  class?: ClassValue
}

const props = withDefaults(defineProps<TabsTriggerProps>(), { class: undefined })
const tabs = inject(tabsKey, {
  variant: ref('line' as const),
  orientation: ref('horizontal' as const),
})
</script>

<template>
  <RekaTabsTrigger
    :value="props.value"
    :disabled="props.disabled"
    :class="
      cn(
        tabsTriggerVariants({ variant: tabs.variant.value, orientation: tabs.orientation.value }),
        props.class,
      )
    "
  >
    <slot />
  </RekaTabsTrigger>
</template>
