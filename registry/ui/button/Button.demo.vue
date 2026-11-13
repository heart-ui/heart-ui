<script setup lang="ts">
import { Icon } from '@/lib/icon'
import { Button } from '.'

const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'link'] as const
const sizes = ['sm', 'md', 'lg'] as const
</script>

<template>
  <div class="flex flex-col gap-gap-lg p-4">
    <div v-for="size in sizes" :key="size" class="flex flex-wrap items-center gap-gap-md">
      <Button v-for="variant in variants" :key="variant" :variant="variant" :size="size">
        {{ variant }} {{ size }}
      </Button>
    </div>
    <div class="flex flex-wrap items-center gap-gap-md">
      <Button variant="primary" disabled>Disabled</Button>
      <Button variant="primary" loading>Loading</Button>
      <Button variant="outline" loading>
        <template #leading><Icon name="add" class="size-4" /></template>
        Loading with icon
      </Button>
      <Button as="a" href="#" disabled>Disabled link</Button>
    </div>
    <div class="flex flex-wrap items-center gap-gap-md">
      <Button variant="primary">
        <template #leading><Icon name="add" class="size-4" /></template>
        Add
      </Button>
      <Button variant="secondary">
        Next
        <template #trailing><Icon name="chevron-right" class="size-4" /></template>
      </Button>
      <Button variant="ghost" aria-label="Close"><Icon name="close" class="size-4" /></Button>
    </div>
  </div>
</template>
