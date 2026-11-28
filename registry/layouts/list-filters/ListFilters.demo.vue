<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Icon } from '@/lib/icon'
import DemoStates from '../../blocks/_fixtures/DemoStates.vue'
import { customers, type Customer } from '../../blocks/_fixtures'
import { AppShell } from '../app-shell'
import { ListFilters } from '.'

const nav = [
  { label: 'Orders', icon: 'info', active: false },
  { label: 'Customers', icon: 'search', active: true },
  { label: 'New quote', icon: 'add', active: false },
] as const
const pageSize = 10
const page = ref(1)
const search = ref('')
const matching = computed(() => {
  const query = search.value.trim().toLowerCase()
  return customers.filter((customer) => customer.name.toLowerCase().includes(query))
})
// A new search starts from its first page: the old page may hold no matching rows.
watch(search, () => {
  page.value = 1
})
// `default` pages the sample to show the pagination region; a real list pages past 50 rows
// (layout-rules.md). `long` shows every row, unpaged.
const shown = (state: string) =>
  state === 'long'
    ? matching.value
    : matching.value.slice((page.value - 1) * pageSize, page.value * pageSize)
const statusVariant: Record<Customer['status'], 'success' | 'info' | 'neutral'> = {
  active: 'success',
  trial: 'info',
  churned: 'neutral',
}
</script>

<template>
  <AppShell>
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
      <span class="truncate font-medium">Customers</span>
    </template>

    <DemoStates v-slot="{ state }">
      <ListFilters :loading="state === 'loading'">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-gap-md">
            <h1 class="text-2xl font-semibold">Customers</h1>
            <Button variant="primary">Add customer</Button>
          </div>
        </template>
        <template #filters>
          <Input
            v-model="search"
            type="search"
            aria-label="Search customers"
            placeholder="Search by name"
            class="w-full md:max-w-sm"
          />
        </template>
        <template #data>
          <!-- Shaped like the table: a header row, then rows of its four columns. -->
          <div v-if="state === 'loading'" class="flex flex-col gap-gap-sm">
            <div v-for="row in 7" :key="row" class="grid grid-cols-4 gap-gap-md">
              <Skeleton
                v-for="column in 4"
                :key="column"
                :class="row === 1 ? 'h-control-sm' : 'h-control-md'"
              />
            </div>
          </div>
          <div v-else-if="state === 'error'" class="flex flex-col items-start gap-gap-md">
            <Alert variant="danger">
              <AlertTitle>Customers couldn't load</AlertTitle>
              <AlertDescription>Check your connection, then try again.</AlertDescription>
            </Alert>
            <Button variant="outline">Retry</Button>
          </div>
          <EmptyState
            v-else-if="state === 'empty'"
            title="No customers yet"
            description="Customers you add or import show up here."
          >
            <template #actions>
              <Button variant="outline">Import customers</Button>
            </template>
          </EmptyState>
          <EmptyState
            v-else-if="matching.length === 0"
            title="No customers match"
            description="Try another name, or clear the search."
          >
            <template #actions>
              <Button variant="outline" @click="search = ''">Clear search</Button>
            </template>
          </EmptyState>
          <Table v-else>
            <TableCaption>Customers in this workspace</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="customer in shown(state)" :key="customer.id">
                <TableHead scope="row">{{ customer.name }}</TableHead>
                <TableCell>{{ customer.email }}</TableCell>
                <TableCell class="capitalize">{{ customer.plan }}</TableCell>
                <TableCell>
                  <Badge :variant="statusVariant[customer.status]" class="capitalize">
                    {{ customer.status }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>
        <template v-if="state === 'default' && matching.length > 0" #pagination>
          <Pagination v-model:page="page" :total="matching.length" :page-size="pageSize" />
        </template>
      </ListFilters>
    </DemoStates>
  </AppShell>
</template>
