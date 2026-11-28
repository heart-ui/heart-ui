<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { inject, useAttrs } from 'vue'
import { cn } from '@/lib/utils/utils'
import { sidebarKey } from './context'

interface SidebarItemProps extends PrimitiveProps {
  /** The page's address. Ignored with `asChild`: the child's link applies. */
  href?: string
  /** The current page: sets `aria-current="page"`. */
  active?: boolean
  class?: ClassValue
}

// The root is the list item; attributes belong on the link or button inside it.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<SidebarItemProps>(), {
  as: undefined,
  href: undefined,
  class: undefined,
})
const sidebar = inject(sidebarKey, undefined)
const attrs = useAttrs()

// Never passed to an asChild child: a RouterLink applies fallthrough attributes after its own
// href, so ours, even undefined, would replace the route's address.
const link = () => (props.href === undefined || props.asChild ? {} : { href: props.href })

// A link without an address takes no focus, so an item without one is a button.
const tag = () => props.as ?? (props.href === undefined ? 'button' : 'a')
const element = () => ({ ...(tag() === 'button' ? { type: 'button' } : link()), ...attrs })

// Never bound unset on an asChild child: a RouterLink sets its own aria-current.
const current = () => (props.active ? { 'aria-current': 'page' } : {})

// A modified or middle click opens the page elsewhere, so the drawer stays. A cancelled click
// still closes it: a RouterLink cancels every click it navigates.
function select(event: MouseEvent) {
  const elsewhere = event.ctrlKey || event.metaKey || event.shiftKey || event.altKey
  if (!sidebar?.drawer || event.button !== 0 || elsewhere) return
  sidebar.close()
}

// Collapsed, only the icon stays in flow and centres in the rail; an asChild child's content
// overflows from the start (safe centring) and is clipped. Relative, so the hidden text is placed
// here and the scrolling content clips it, instead of the page growing to hold it.
const classes = () =>
  cn(
    'relative flex h-control-md w-full min-w-0 items-center gap-gap-sm overflow-hidden rounded-md px-control-px-md',
    'text-sm whitespace-nowrap text-muted-foreground outline-hidden transition-colors duration-fast',
    'hover:bg-muted hover:text-foreground group-state-closed/sidebar:justify-center-safe group-state-closed/sidebar:px-0',
    'focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-focus focus-visible:ring-offset-background',
    props.active && 'bg-muted font-medium text-foreground',
    props.class,
  )
</script>

<template>
  <li class="flex">
    <Primitive
      v-if="props.asChild"
      v-bind="{ ...current(), ...attrs }"
      as-child
      data-slot="sidebar-item"
      :class="classes()"
      @click="select"
    >
      <slot />
    </Primitive>
    <Primitive
      v-else
      :as="tag()"
      v-bind="{ ...current(), ...element() }"
      data-slot="sidebar-item"
      :class="classes()"
      @click="select"
    >
      <slot name="leading" />
      <span
        data-slot="sidebar-item-text"
        class="min-w-0 flex-1 truncate group-state-closed/sidebar:sr-only"
      >
        <slot />
      </span>
    </Primitive>
  </li>
</template>
