<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { computed } from 'vue'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'
import { alertVariants, type AlertVariants } from './alert.variants'

type Variant = NonNullable<AlertVariants['variant']>

interface AlertProps {
  variant?: Variant
  class?: ClassValue
}

defineOptions({ name: 'HAlert' })

const props = withDefaults(defineProps<AlertProps>(), { variant: 'info', class: undefined })

// Icons the published `icon` helper already has, so adding alert needs no update to it.
const icons = { info: 'info', success: 'check', warning: 'warning', danger: 'error' } as const
// An unknown variant from untyped code (an inherited name such as `constructor` included) falls
// back to info for its colours, icon and role, rather than breaking the render.
const variant = computed<Variant>(() =>
  Object.hasOwn(icons, props.variant) ? props.variant : 'info',
)
// Only a danger alert interrupts; the rest are read when the reader is free.
const role = computed(() => (variant.value === 'danger' ? 'alert' : 'status'))
</script>

<template>
  <div data-slot="alert" :role="role" :class="cn(alertVariants({ variant }), props.class)">
    <Icon data-slot="alert-icon" :name="icons[variant]" class="size-5" />
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <slot />
    </div>
  </div>
</template>
