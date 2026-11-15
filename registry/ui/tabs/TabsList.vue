<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { TabsList as RekaTabsList } from 'reka-ui'
import { inject, ref } from 'vue'
import { cn } from '@/lib/utils/utils'
import { tabsKey } from './Tabs.vue'
import { tabsListVariants } from './tabs.variants'

interface TabsListProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<TabsListProps>(), { class: undefined })
const tabs = inject(tabsKey, {
  variant: ref('line' as const),
  orientation: ref('horizontal' as const),
})
</script>

<template>
  <!-- Reka's focus group writes dir="ltr" on the list unless an app sets a direction; our own
       element writes none and follows the page (see Tabs.vue). -->
  <RekaTabsList as-child>
    <div
      :dir="undefined"
      :class="
        cn(
          tabsListVariants({ variant: tabs.variant.value, orientation: tabs.orientation.value }),
          props.class,
        )
      "
    >
      <slot />
    </div>
  </RekaTabsList>
</template>
