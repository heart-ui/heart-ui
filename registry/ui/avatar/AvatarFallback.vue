<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { AvatarFallback as RekaAvatarFallback } from 'reka-ui'
import { inject, ref } from 'vue'
import { cn } from '@/lib/utils/utils'
import { avatarKey } from './Avatar.vue'

interface AvatarFallbackProps {
  /** Waits this long before showing, so a fast load shows no flash of initials. */
  delayMs?: number
  class?: ClassValue
}

defineOptions({ name: 'HAvatarFallback' })

const props = withDefaults(defineProps<AvatarFallbackProps>(), {
  delayMs: undefined,
  class: undefined,
})
const name = inject(avatarKey, { name: ref(''), images: ref(0) }).name
</script>

<template>
  <!-- Reka decides once, at setup, to wait, and waits only on a truthy delay: a delay of 0, or
       one that drops to 0, remounts it so it shows at once. -->
  <RekaAvatarFallback
    :key="props.delayMs ? 'delayed' : 'now'"
    data-slot="avatar-fallback"
    :delay-ms="props.delayMs || undefined"
    :class="
      cn(
        'flex size-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground',
        props.class,
      )
    "
  >
    <template v-if="name">
      <span aria-hidden="true"><slot /></span>
      <span class="sr-only">{{ name }}</span>
    </template>
    <slot v-else />
  </RekaAvatarFallback>
</template>
