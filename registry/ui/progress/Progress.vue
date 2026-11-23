<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils/utils'
import { progressVariants, type ProgressVariants } from './progress.variants'

type Size = NonNullable<ProgressVariants['size']>

interface ProgressProps {
  /** Current progress from 0 to `max`; `null` renders an indeterminate bar. */
  modelValue?: number | null
  max?: number
  size?: Size
  class?: ClassValue
}

defineOptions({ name: 'HProgress' })

const props = withDefaults(defineProps<ProgressProps>(), {
  modelValue: null,
  max: 100,
  size: 'md',
  class: undefined,
})

const sizes = { sm: true, md: true, lg: true } as const
const size = computed<Size>(() => (Object.hasOwn(sizes, props.size) ? props.size : 'md'))

const max = computed(() =>
  typeof props.max === 'number' && Number.isFinite(props.max) && props.max > 0 ? props.max : 100,
)

const value = computed<number | null>(() => {
  if (typeof props.modelValue !== 'number' || !Number.isFinite(props.modelValue)) return null
  return Math.min(max.value, Math.max(0, props.modelValue))
})

const indeterminate = computed(() => value.value === null)

const indicatorStyle = computed(() =>
  value.value === null ? undefined : { inlineSize: `${(value.value / max.value) * 100}%` },
)

// Reka's default getValueLabel sets a synthetic `aria-label="50%"` on determinate bars only;
// suppressing it keeps determinate and indeterminate bars on the same explicit-label contract.
const noSyntheticLabel = () => undefined
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    :model-value="value"
    :max="max"
    :get-value-label="noSyntheticLabel"
    :class="cn(progressVariants({ size }), props.class)"
  >
    <ProgressIndicator
      data-slot="progress-indicator"
      :style="indicatorStyle"
      :class="
        cn(
          'h-full rounded-full bg-primary',
          indeterminate
            ? 'heart-progress-indeterminate mx-auto w-2/5'
            : 'transition-all duration-normal ease-standard',
        )
      "
    />
  </ProgressRoot>
</template>

<style>
@keyframes heart-progress-indeterminate {
  0%,
  100% {
    margin-inline-start: 30%;
    margin-inline-end: 0;
    animation-timing-function: ease-out;
  }
  25% {
    margin-inline-start: 60%;
    margin-inline-end: 0;
    animation-timing-function: ease-in-out;
  }
  75% {
    margin-inline-start: 0%;
    margin-inline-end: 0;
    animation-timing-function: ease-in;
  }
}

/* Private layer: never reorders Tailwind's layers when bundled before theme.css, and survives
   revert-layer resets in layered demo iframes. */
@layer heart-progress {
  @media (prefers-reduced-motion: no-preference) {
    .heart-progress-indeterminate {
      animation: heart-progress-indeterminate 1.4s var(--h-ease) infinite;
    }
  }
}
</style>
