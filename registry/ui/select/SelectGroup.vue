<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { SelectGroup as RekaSelectGroup } from 'reka-ui'

interface SelectGroupProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<SelectGroupProps>(), { class: undefined })
</script>

<template>
  <RekaSelectGroup :class="props.class">
    <slot />
  </RekaSelectGroup>
</template>
