<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DemoStates from '../_fixtures/DemoStates.vue'
import { customers } from '../_fixtures'
</script>

<template>
  <div class="p-page-px">
    <DemoStates v-slot="{ state }">
      <Card as="section" aria-labelledby="customers-title" class="max-w-content-narrow">
        <CardHeader>
          <CardTitle id="customers-title" as="h2">Customers</CardTitle>
          <CardDescription>People with an account in this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            v-if="state === 'loading'"
            role="status"
            aria-busy="true"
            aria-label="Loading customers"
            class="flex flex-col gap-gap-sm"
          >
            <div v-for="row in 5" :key="row" class="h-control-md rounded-md bg-muted" />
          </div>
          <div v-else-if="state === 'empty'" class="flex flex-col items-start gap-gap-sm">
            <p class="text-sm text-muted-foreground">No customers yet.</p>
            <Button variant="primary">Add customer</Button>
          </div>
          <div
            v-else-if="state === 'error'"
            role="alert"
            class="flex flex-col items-start gap-gap-sm"
          >
            <p class="text-sm">Customers couldn't load. Check your connection.</p>
            <Button variant="outline">Retry</Button>
          </div>
          <ul v-else class="flex flex-col divide-y divide-border">
            <li
              v-for="customer in state === 'long' ? customers : customers.slice(0, 5)"
              :key="customer.id"
              class="flex flex-wrap items-baseline justify-between gap-x-gap-md py-2"
            >
              <span class="font-medium">{{ customer.name }}</span>
              <span class="min-w-0 break-all text-sm text-muted-foreground">{{
                customer.email
              }}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </DemoStates>
  </div>
</template>
