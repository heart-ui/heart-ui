<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { CollapsibleRoot } from 'reka-ui'
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  provide,
  ref,
  useAttrs,
  useId,
  watch,
} from 'vue'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { cn } from '@/lib/utils/utils'
import { sidebarKey } from './context'

interface SidebarProps {
  /** Accessible name of the `nav` and of the drawer below 768 px. */
  navLabel?: string
  closeLabel?: string
  class?: ClassValue
}

// Two roots, the nav and the drawer: attributes go to the nav by hand.
defineOptions({ name: 'HSidebar', inheritAttrs: false })

const props = withDefaults(defineProps<SidebarProps>(), {
  navLabel: 'Navigation',
  closeLabel: 'Close',
  class: undefined,
})
const collapsed = defineModel<boolean>('collapsed', { default: false })
const open = defineModel<boolean>('open', { default: false })
const attrs = useAttrs()
const generatedId = useId()
// A caller's id stays on the nav, so the trigger's aria-controls names it. Attributes aren't
// reactive and compiled slots don't rerender the trigger, so a changed id goes through a ref.
const callerId = ref(attrs.id)
onBeforeUpdate(() => (callerId.value = attrs.id))
const navId = () =>
  typeof callerId.value === 'string' && callerId.value !== '' ? callerId.value : generatedId
// The nav's id is navId's alone, or an empty or non-string id would replace it.
const navAttrs = () => Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'id'))

// Reka's collapsible is open while the sidebar is expanded.
const expanded = computed({
  get: () => !collapsed.value,
  set: (value: boolean) => (collapsed.value = !value),
})

provide(sidebarKey, { navId, collapsed, drawer: false, close: () => {} })

// The drawer's copy of the slot: its parts render expanded, without the trigger, and an item
// click closes the drawer.
const DrawerScope = defineComponent({
  setup(_, { slots }) {
    provide(sidebarKey, { navId, collapsed, drawer: true, close: () => (open.value = false) })
    return () => slots.default?.()
  },
})

// The nav is hidden by CSS below 768 px. While it shows, the window is wide, and a modal drawer
// would keep the page inert behind its overlay: the drawer opens only on a narrow window, and
// `open` goes back to false on a wide one. Wide until measured, as on the server, so a drawer
// open at mount never shows on a wide window, even for its exit animation.
const root = ref<{ $el: HTMLElement }>()
const wide = ref(true)
let observer: ResizeObserver | undefined
let closedForWide = false
function measure() {
  const nav = root.value?.$el
  if (!nav) return
  const shown = open.value && !wide.value
  wide.value = nav.offsetWidth > 0
  if (!wide.value || !open.value) return
  closedForWide = shown
  open.value = false
}
onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(root.value!.$el)
})
onBeforeUnmount(() => observer?.disconnect())
watch(open, measure, { flush: 'post' })

// The drawer hands focus back to what opened it, which a wide window hides (a menu button shown
// only below 768 px; Safari never focuses a clicked button at all), so focus would fall to the
// page. The nav's current item takes it instead.
function restoreFocus() {
  const lost = closedForWide
  closedForWide = false
  const active = document.activeElement
  const nav = root.value?.$el
  if (!lost || !nav || (active && active !== document.body)) return
  const target =
    nav.querySelector<HTMLElement>('[aria-current="page"]') ??
    nav.querySelector<HTMLElement>('[data-slot="sidebar-item"]')
  target?.focus()
}
</script>

<template>
  <CollapsibleRoot
    :id="navId()"
    ref="root"
    v-model:open="expanded"
    as="nav"
    v-bind="navAttrs()"
    :aria-label="props.navLabel"
    data-slot="sidebar"
    :class="
      cn(
        'group/sidebar flex h-full w-sidebar-width shrink-0 flex-col border-e border-border bg-surface text-foreground',
        'transition-all duration-normal state-closed:w-sidebar-width-collapsed',
        // Hidden by a max-width variant, so a caller's display class (flex, md:grid) doesn't undo it.
        'max-md:hidden',
        props.class,
      )
    "
  >
    <slot />
  </CollapsibleRoot>
  <Drawer :open="open && !wide" @update:open="(value) => (open = value)">
    <DrawerContent
      side="start"
      size="sm"
      :close-label="props.closeLabel"
      class="w-sidebar-width"
      @close="restoreFocus"
    >
      <DrawerTitle class="sr-only">{{ props.navLabel }}</DrawerTitle>
      <nav :aria-label="props.navLabel" class="flex min-h-0 flex-1 flex-col">
        <DrawerScope><slot /></DrawerScope>
      </nav>
    </DrawerContent>
  </Drawer>
</template>
