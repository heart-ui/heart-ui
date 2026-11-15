<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { DropdownMenuSeparator as RekaDropdownMenuSeparator } from 'reka-ui'
import { cn } from '@/lib/utils/utils'

interface DropdownMenuSeparatorProps {
  class?: ClassValue
}

const props = withDefaults(defineProps<DropdownMenuSeparatorProps>(), { class: undefined })
</script>

<template>
  <RekaDropdownMenuSeparator :class="cn('-mx-1 my-1 h-px bg-border', props.class)" />
</template>
