<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { useDirection } from 'reka-ui'
import { computed, inject } from 'vue'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icon'
import { cn } from '@/lib/utils/utils'
import { sidebarKey } from './context'

interface SidebarTriggerProps {
  toggleLabel?: string
  class?: ClassValue
}

const props = withDefaults(defineProps<SidebarTriggerProps>(), {
  toggleLabel: 'Toggle sidebar',
  class: undefined,
})
// The sidebar's own state, not Reka's nearest collapsible, which an accordion or collapsible
// group inside the sidebar would provide.
const sidebar = inject(sidebarKey, undefined)
if (!sidebar) throw new Error('SidebarTrigger must be placed inside a Sidebar')

// The chevron points where the sidebar will move: to the start to collapse, to the end to
// expand. Direction comes from Reka's ConfigProvider, as breadcrumb's separator does.
const dir = useDirection()
const chevron = computed(() =>
  !sidebar.collapsed.value === (dir.value === 'rtl') ? 'chevron-right' : 'chevron-left',
)

function toggle() {
  sidebar!.collapsed.value = !sidebar!.collapsed.value
}
</script>

<template>
  <!-- The drawer's copy is always expanded and has its own close button. -->
  <Button
    v-if="!sidebar.drawer"
    variant="ghost"
    size="sm"
    :aria-label="props.toggleLabel"
    :aria-expanded="!sidebar.collapsed.value"
    :aria-controls="sidebar.navId()"
    :data-state="sidebar.collapsed.value ? 'closed' : 'open'"
    data-slot="sidebar-trigger"
    :class="cn('shrink-0', props.class)"
    @click="toggle"
  >
    <slot><Icon :name="chevron" class="size-4" /></slot>
  </Button>
</template>
