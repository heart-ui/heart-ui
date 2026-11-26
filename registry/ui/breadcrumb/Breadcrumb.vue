<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils/utils'

interface BreadcrumbProps {
  /** The landmark's accessible name. */
  navLabel?: string
  class?: ClassValue
}

defineOptions({ name: 'HBreadcrumb' })

const props = withDefaults(defineProps<BreadcrumbProps>(), {
  navLabel: 'Breadcrumb',
  class: undefined,
})
</script>

<template>
  <!-- Text styles sit on the nav, where the caller's class can replace them; the list inherits. -->
  <nav
    :aria-label="props.navLabel"
    :class="cn('text-sm wrap-anywhere text-muted-foreground', props.class)"
  >
    <ol class="flex flex-wrap items-center gap-gap-sm">
      <slot />
    </ol>
  </nav>
</template>
