<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '.'

const invoices = [
  {
    id: '1042',
    customer: 'Northwind Traders',
    status: 'Paid',
    due: '30 Nov 2026',
    amount: '€1,200.00',
  },
  {
    id: '1043',
    customer: 'Contoso Pharmaceuticals',
    status: 'Overdue',
    due: '12 Nov 2026',
    amount: '€380.50',
  },
  {
    id: '1044',
    customer: 'Fabrikam Residences',
    status: 'Draft',
    due: '15 Dec 2026',
    amount: '€9,410.00',
  },
] as const
const variant = { Paid: 'success', Overdue: 'danger', Draft: 'neutral' } as const

const members = [
  { name: 'Ana Lima', role: 'Owner' },
  { name: 'Kenji Sato', role: 'Admin' },
  { name: 'Leah Brown', role: 'Member' },
]
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <Table>
      <TableCaption>Open invoices</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due</TableHead>
          <TableHead class="text-end">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="invoice in invoices" :key="invoice.id">
          <TableHead scope="row" class="text-foreground">{{ invoice.id }}</TableHead>
          <TableCell class="whitespace-nowrap">{{ invoice.customer }}</TableCell>
          <TableCell>
            <Badge :variant="variant[invoice.status]" size="sm">{{ invoice.status }}</Badge>
          </TableCell>
          <TableCell class="whitespace-nowrap">{{ invoice.due }}</TableCell>
          <TableCell class="text-end whitespace-nowrap tabular-nums">{{
            invoice.amount
          }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
    <Table size="sm">
      <TableCaption>Team members</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="member in members" :key="member.name">
          <TableHead scope="row" class="text-foreground">{{ member.name }}</TableHead>
          <TableCell>{{ member.role }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
