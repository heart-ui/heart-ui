<script lang="ts">
import type { InjectionKey, Ref } from 'vue'

/** How many `DropdownMenuLabel`s sit inside the group; it names itself by them only then. */
export const groupLabelsKey: InjectionKey<Ref<number>> = Symbol('dropdown-menu-group-labels')
</script>

<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { DropdownMenuRadioGroup as RekaDropdownMenuRadioGroup } from 'reka-ui'
import { provide, ref, useAttrs } from 'vue'
import { cn } from '@/lib/utils/utils'

interface DropdownMenuRadioGroupProps {
  class?: ClassValue
}

// Attributes go to our own group element (below).
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<DropdownMenuRadioGroupProps>(), { class: undefined })
const model = defineModel<string>()
const attrs = useAttrs()

const labels = ref(0)
provide(groupLabelsKey, labels)
// Reka always points aria-labelledby at a label id that exists only with a label inside the group.
// Without one, keep the caller's own naming (aria-label or aria-labelledby) instead. Read in the
// render, since a computed doesn't track a spread.
function naming() {
  return labels.value > 0
    ? {}
    : { 'aria-labelledby': attrs['aria-labelledby'] as string | undefined }
}
</script>

<template>
  <RekaDropdownMenuRadioGroup v-model="model" as-child>
    <div v-bind="{ ...$attrs, ...naming() }" :class="cn(props.class)">
      <slot />
    </div>
  </RekaDropdownMenuRadioGroup>
</template>
