<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { computed, useAttrs } from 'vue'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'
import { buttonVariants, type ButtonVariants } from './button.variants'

interface ButtonProps extends PrimitiveProps {
  variant?: NonNullable<ButtonVariants['variant']>
  size?: NonNullable<ButtonVariants['size']>
  disabled?: boolean
  loading?: boolean
  /** Ignored when the rendered element is not a `button`. */
  type?: 'button' | 'submit' | 'reset'
  class?: ClassValue
}

// The caller's attributes are forwarded first, so the disabled and loading semantics below win.
defineOptions({ name: 'TrevButton', inheritAttrs: false })

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'secondary',
  size: 'md',
  as: 'button',
  type: 'button',
  class: undefined,
})
const attrs = useAttrs()

const isNativeButton = computed(() => props.as === 'button' && !props.asChild)
const inert = computed(() => props.disabled || props.loading)
// An inert `as="a"` link loses its href, so "open in new tab" can't bypass the blocked click.
// It keeps the link role and, while loading, its place in the tab order.
const dropsHref = computed(
  () => inert.value && props.as === 'a' && !props.asChild && 'href' in attrs,
)
const forwarded = computed(() =>
  dropsHref.value
    ? Object.fromEntries(Object.entries(attrs).filter(([name]) => name !== 'href'))
    : attrs,
)
const tabindex = computed(() => {
  if (props.disabled && !isNativeButton.value) return -1
  return dropsHref.value ? (attrs.tabindex ?? 0) : attrs.tabindex
})

function block(event: MouseEvent) {
  if (!inert.value) return
  event.preventDefault()
  event.stopImmediatePropagation()
}
</script>

<template>
  <Primitive
    v-bind="forwarded"
    :as="as"
    :as-child="asChild"
    :type="isNativeButton ? type : undefined"
    :disabled="isNativeButton && disabled ? true : undefined"
    :aria-disabled="inert && !(isNativeButton && disabled) ? 'true' : attrs['aria-disabled']"
    :aria-busy="loading ? 'true' : attrs['aria-busy']"
    :role="dropsHref ? (attrs.role ?? 'link') : attrs.role"
    :tabindex="tabindex"
    :data-disabled="disabled ? '' : attrs['data-disabled']"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    @click.capture="block"
  >
    <!-- asChild: the child is the button and brings its own content. -->
    <slot v-if="asChild" />
    <template v-else>
      <!-- While loading the content stays in place, transparent but readable, so the width holds. -->
      <span :class="cn('inline-flex items-center gap-gap-sm', loading && 'opacity-0')">
        <slot name="leading" />
        <slot />
        <slot name="trailing" />
      </span>
      <Icon
        v-if="loading"
        name="spinner"
        data-slot="spinner"
        class="absolute size-4 motion-safe:animate-spin"
      />
    </template>
  </Primitive>
</template>
