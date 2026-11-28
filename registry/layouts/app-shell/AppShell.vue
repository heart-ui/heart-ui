<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils/utils'

interface AppShellProps {
  /** Accessible name of the navigation. */
  navLabel?: string
  /** Text of the menu button that opens the navigation below 768 px. */
  menuLabel?: string
  /** Accessible name of the navigation drawer's close button. */
  closeLabel?: string
  class?: ClassValue
}

defineOptions({ name: 'HAppShell' })

const props = withDefaults(defineProps<AppShellProps>(), {
  navLabel: 'Navigation',
  menuLabel: 'Menu',
  closeLabel: 'Close',
  class: undefined,
})
const collapsed = defineModel<boolean>('collapsed', { default: false })
defineSlots<{ sidebar(): unknown; topbar(): unknown; default(): unknown }>()

// The drawer below 768 px; the sidebar closes it on an item click and on a wide window.
const open = ref(false)
const menuButton = ref<{ $el: HTMLElement }>()

// The drawer hands focus back to what had it when it opened. Safari never focuses a clicked
// button, so the menu button takes focus first, or focus would fall to the page on close.
function openMenu() {
  menuButton.value?.$el.focus()
  open.value = true
}

// The page scrolls under the sticky topbar, so a link target or a focused element scrolled to
// the top would sit behind it (WCAG 2.4.11). The document's scroll padding keeps it clear; it is
// set after mount, since the server renders no document, and put back on unmount.
let scrollPadding = ''
onMounted(() => {
  const root = document.documentElement
  scrollPadding = root.style.scrollPaddingTop
  root.style.scrollPaddingTop = 'var(--h-topbar-height)'
})
onBeforeUnmount(() => {
  document.documentElement.style.scrollPaddingTop = scrollPadding
})
</script>

<template>
  <div :class="cn('flex min-h-dvh bg-background text-foreground', props.class)">
    <Sidebar
      v-model:collapsed="collapsed"
      v-model:open="open"
      :nav-label="props.navLabel"
      :close-label="props.closeLabel"
      class="sticky top-0 h-dvh"
    >
      <slot name="sidebar" />
    </Sidebar>
    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="sticky top-0 z-sticky flex h-topbar-height shrink-0 items-center gap-gap-md border-b border-border bg-background px-page-px"
      >
        <!-- Default size: touch targets are control-md tall below 768 px (layout-rules.md). -->
        <Button
          ref="menuButton"
          variant="ghost"
          aria-haspopup="dialog"
          :aria-expanded="open"
          data-slot="app-shell-menu"
          class="md:hidden"
          @click="openMenu"
        >
          {{ props.menuLabel }}
        </Button>
        <slot name="topbar" />
      </header>
      <main class="flex-1 px-page-px py-section-gap">
        <div data-slot="app-shell-content" class="mx-auto w-full max-w-content-max">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
