<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Icon } from '@/lib/icon'
import DemoStates from '../../blocks/_fixtures/DemoStates.vue'
import { AppShell } from '.'

const collapsed = ref(false)
const nav = [
  { label: 'Orders', icon: 'info', active: true },
  { label: 'Customers', icon: 'search', active: false },
  { label: 'New quote', icon: 'add', active: false },
] as const
// The shell holds no data of its own, so its page is fixed text; `long` adds sections until
// the page scrolls under the sticky sidebar and topbar.
const sections = [
  { id: 'payment', title: 'Payment terms', body: 'Invoices are due 30 days after they are sent.' },
  { id: 'refunds', title: 'Refunds', body: 'Refunds go back to the card that paid the order.' },
] as const
const moreSections = [
  { id: 'tax', title: 'Tax', body: 'Prices include tax for customers in the EU.' },
  { id: 'currency', title: 'Currencies', body: 'Orders are charged in euros or US dollars.' },
  { id: 'reminders', title: 'Reminders', body: 'A reminder goes out 3 days before the due date.' },
  { id: 'late', title: 'Late payment', body: 'An order unpaid after 60 days is put on hold.' },
  { id: 'credit', title: 'Credit notes', body: 'A credit note cancels all or part of an invoice.' },
  { id: 'exports', title: 'Exports', body: 'Orders export as CSV from the orders list.' },
  { id: 'access', title: 'Access', body: 'Only billing admins can issue refunds.' },
  { id: 'contact', title: 'Contact', body: 'Questions about an order go to the billing team.' },
] as const
</script>

<template>
  <AppShell v-model:collapsed="collapsed">
    <template #sidebar>
      <SidebarHeader>
        <span class="truncate font-semibold">Acme</span>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup heading="Sales">
          <SidebarItem
            v-for="entry in nav"
            :key="entry.label"
            :href="`#${entry.label.toLowerCase().replaceAll(' ', '-')}`"
            :active="entry.active"
          >
            <template #leading><Icon :name="entry.icon" class="size-4 shrink-0" /></template>
            {{ entry.label }}
          </SidebarItem>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>Ada Lovelace</SidebarFooter>
    </template>
    <template #topbar>
      <span class="truncate font-medium">Billing policy</span>
    </template>

    <div class="flex flex-col gap-section-gap">
      <div class="flex flex-wrap items-center justify-between gap-gap-md">
        <h1 class="text-2xl font-semibold">Billing policy</h1>
        <Button variant="primary">Edit policy</Button>
      </div>
      <DemoStates v-slot="{ state }">
        <div class="flex flex-col gap-section-gap">
          <Card
            v-for="section in sections"
            :key="section.id"
            as="section"
            :aria-labelledby="section.id"
          >
            <CardHeader>
              <CardTitle :id="section.id" as="h2">{{ section.title }}</CardTitle>
            </CardHeader>
            <CardContent class="text-sm">{{ section.body }}</CardContent>
          </Card>
          <template v-if="state === 'long'">
            <Card
              v-for="section in moreSections"
              :key="section.id"
              as="section"
              :aria-labelledby="section.id"
            >
              <CardHeader>
                <CardTitle :id="section.id" as="h2">{{ section.title }}</CardTitle>
              </CardHeader>
              <CardContent class="text-sm">{{ section.body }}</CardContent>
            </Card>
          </template>
        </div>
      </DemoStates>
    </div>
  </AppShell>
</template>
