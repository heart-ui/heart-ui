<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '@/lib/utils/utils'

interface BreadcrumbLinkProps extends PrimitiveProps {
  /** The ancestor page's address. Ignored with `asChild`: the child's link applies. */
  href?: string
  class?: ClassValue
}

const props = withDefaults(defineProps<BreadcrumbLinkProps>(), {
  as: 'a',
  href: undefined,
  class: undefined,
})

// Never passed to an asChild child: a RouterLink applies fallthrough attributes after its own
// href, so ours, even undefined, would replace the route's address.
const link = () => (props.href === undefined || props.asChild ? {} : { href: props.href })
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    v-bind="link()"
    :class="
      cn(
        'rounded-sm text-muted-foreground transition-colors duration-fast outline-hidden hover:text-foreground',
        'focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-focus focus-visible:ring-offset-background',
        props.class,
      )
    "
  >
    <slot />
  </Primitive>
</template>
