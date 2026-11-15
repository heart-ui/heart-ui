<script setup lang="ts">
import { Icon } from '@/lib/icon'
import { Badge } from '.'

const variants = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const
const sizes = ['sm', 'md'] as const
const labels = {
  neutral: 'Draft',
  primary: 'New',
  success: 'Paid',
  warning: 'Overdue',
  danger: 'Failed',
  info: 'Scheduled',
} as const
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <div v-for="size in sizes" :key="size" class="flex flex-wrap items-center gap-gap-sm">
      <Badge v-for="variant in variants" :key="variant" :variant="variant" :size="size">
        {{ labels[variant] }}
      </Badge>
    </div>
    <div class="flex flex-wrap items-center gap-gap-sm">
      <Badge variant="warning">
        <template #leading><Icon name="warning" class="size-3.5" /></template>
        Overdue
      </Badge>
      <Badge variant="info">
        <template #leading><Icon name="info" class="size-3.5" /></template>
        Scheduled
      </Badge>
    </div>
    <h2 class="flex items-center gap-gap-sm text-lg font-semibold">
      Invoice 1042 <Badge variant="success">Paid</Badge>
    </h2>
    <table class="text-sm">
      <caption class="sr-only">
        Invoices
      </caption>
      <thead>
        <tr class="text-muted-foreground">
          <th scope="col" class="pe-6 text-start font-medium">Invoice</th>
          <th scope="col" class="text-start font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="pe-6 py-1">1041</td>
          <td><Badge variant="danger" size="sm">Failed</Badge></td>
        </tr>
        <tr>
          <td class="pe-6 py-1">1042</td>
          <td><Badge variant="success" size="sm">Paid</Badge></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
