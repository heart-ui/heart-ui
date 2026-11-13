<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@/lib/icon'
import { Button } from '@/components/ui/button'
import { Input } from '.'

const sizes = ['sm', 'md', 'lg'] as const
const query = ref('')
const email = ref('ada@example')
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <div v-for="size in sizes" :key="size" class="flex flex-col gap-gap-sm">
      <label :for="`name-${size}`" class="text-sm font-medium">Name ({{ size }})</label>
      <Input :id="`name-${size}`" :size="size" placeholder="Ada Lovelace" />
    </div>
    <div class="flex flex-col gap-gap-sm">
      <label for="search" class="text-sm font-medium">Search</label>
      <Input id="search" v-model="query" type="search" placeholder="Search customers">
        <template #leading><Icon name="search" class="size-4" /></template>
        <template #trailing>
          <Button variant="ghost" size="sm" aria-label="Clear search" @click="query = ''">
            <Icon name="close" class="size-4" />
          </Button>
        </template>
      </Input>
    </div>
    <div class="flex flex-col gap-gap-sm">
      <label for="email" class="text-sm font-medium">Email</label>
      <Input id="email" v-model="email" type="email" invalid aria-describedby="email-error" />
      <p id="email-error" class="text-sm text-muted-foreground">
        Enter a full address, like name@example.com.
      </p>
    </div>
    <div class="flex flex-col gap-gap-sm">
      <label for="plan" class="text-sm font-medium">Plan</label>
      <Input id="plan" model-value="Team" readonly />
    </div>
    <div class="flex flex-col gap-gap-sm">
      <label for="company" class="text-sm font-medium">Company</label>
      <Input id="company" model-value="Analytical Engines" disabled />
    </div>
  </div>
</template>
