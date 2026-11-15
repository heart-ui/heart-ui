<script lang="ts">
import type { InjectionKey, Ref } from 'vue'

export interface TabsContext {
  variant: Ref<'line' | 'pill'>
  orientation: Ref<'horizontal' | 'vertical'>
}
export const tabsKey: InjectionKey<TabsContext> = Symbol('tabs')
</script>

<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { TabsRoot } from 'reka-ui'
import { provide, toRef } from 'vue'
import { cn } from '@/lib/utils/utils'

interface TabsProps {
  variant?: 'line' | 'pill'
  orientation?: 'horizontal' | 'vertical'
  /** The tab active at first, without `v-model`. */
  defaultValue?: string
  /** Sets layout and arrow keys together; by default both follow the page. */
  dir?: 'ltr' | 'rtl'
  class?: ClassValue
}

defineOptions({ name: 'HTabs' })

const props = withDefaults(defineProps<TabsProps>(), {
  variant: 'line',
  orientation: 'horizontal',
  defaultValue: undefined,
  dir: undefined,
  class: undefined,
})
const model = defineModel<string>()

provide(tabsKey, { variant: toRef(props, 'variant'), orientation: toRef(props, 'orientation') })
</script>

<template>
  <TabsRoot
    v-model="model"
    :default-value="props.defaultValue"
    :orientation="props.orientation"
    :dir="props.dir"
    as-child
  >
    <!-- Reka writes dir="ltr" on its root unless an app sets a direction, and its ConfigProvider
         defaults to "ltr" too, so an RTL page's tabs would run left to right. Our element writes
         dir only when `dir` is passed, and otherwise follows the page. -->
    <div
      :dir="props.dir"
      :class="
        cn(
          'flex gap-gap-md',
          props.orientation === 'vertical'
            ? 'flex-col sm:flex-row sm:items-start sm:gap-gap-lg'
            : 'flex-col',
          props.class,
        )
      "
    >
      <slot />
    </div>
  </TabsRoot>
</template>
