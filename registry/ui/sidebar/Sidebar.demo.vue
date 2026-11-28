<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icon'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarTrigger,
} from '.'

const collapsed = ref(false)
const railCollapsed = ref(true)
const menuOpen = ref(false)
const sales = [
  { label: 'Invoices', icon: 'info', active: true },
  { label: 'Customers', icon: 'search', active: false },
  { label: 'Quotes', icon: 'add', active: false },
] as const
// More than fit, so the content scrolls between the header and footer.
const projects = Array.from({ length: 12 }, (_, index) => `Project ${index + 1}`)
</script>

<template>
  <div class="flex flex-col gap-gap-md p-4">
    <!-- Below 768 px the sidebar is a drawer, opened from the page's own button. -->
    <Button variant="outline" class="self-start md:hidden" @click="menuOpen = true">Menu</Button>
    <div class="flex h-96 gap-gap-lg">
      <Sidebar v-model:collapsed="collapsed" v-model:open="menuOpen" class="rounded-lg border">
        <SidebarHeader>
          <span class="truncate font-semibold">Acme</span>
          <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup heading="Sales">
            <SidebarItem
              v-for="entry in sales"
              :key="entry.label"
              :href="`#${entry.label.toLowerCase()}`"
              :active="entry.active"
            >
              <template #leading><Icon :name="entry.icon" class="size-4 shrink-0" /></template>
              {{ entry.label }}
            </SidebarItem>
          </SidebarGroup>
          <SidebarGroup heading="Projects">
            <SidebarItem v-for="project in projects" :key="project" href="#projects">
              <template #leading><Icon name="check" class="size-4 shrink-0" /></template>
              {{ project }}
            </SidebarItem>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>Signed in as Ada</SidebarFooter>
      </Sidebar>

      <Sidebar v-model:collapsed="railCollapsed" nav-label="Workspace" class="rounded-lg border">
        <SidebarHeader><SidebarTrigger /></SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarItem
              v-for="entry in sales"
              :key="entry.label"
              href="#workspace"
              :active="entry.active"
            >
              <template #leading><Icon :name="entry.icon" class="size-4 shrink-0" /></template>
              {{ entry.label }}
            </SidebarItem>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </div>
  </div>
</template>
