<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { useDirection } from 'reka-ui'
import { computed } from 'vue'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'

interface BreadcrumbSeparatorProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<BreadcrumbSeparatorProps>(), { class: undefined })

// The chevron points the reading way. Direction comes from Reka's ConfigProvider, as the dropdown
// menu's sub trigger does; a CSS direction selector would break in production builds.
const dir = useDirection()
const chevron = computed(() => (dir.value === 'rtl' ? 'chevron-left' : 'chevron-right'))
</script>

<template>
  <li role="presentation" aria-hidden="true" :class="cn('inline-flex items-center', props.class)">
    <slot>
      <Icon :name="chevron" class="size-4" />
    </slot>
  </li>
</template>
