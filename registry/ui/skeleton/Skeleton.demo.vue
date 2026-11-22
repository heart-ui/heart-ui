<script setup lang="ts">
import { Skeleton } from '.'
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <section aria-busy="true" aria-label="Team members" class="flex flex-col gap-gap-md">
      <div v-for="row in 3" :key="row" class="flex items-center gap-gap-sm">
        <Skeleton class="size-control-md shrink-0 rounded-full" />
        <div class="flex flex-col gap-gap-sm">
          <Skeleton class="h-4 w-40" />
          <Skeleton class="h-3 w-56" />
        </div>
      </div>
    </section>
    <section
      aria-busy="true"
      aria-label="Latest report"
      class="flex flex-col gap-gap-sm rounded-lg border border-border p-4"
    >
      <Skeleton class="h-32 w-full" />
      <Skeleton class="h-4 w-3/4" />
      <Skeleton class="h-4 w-1/2" />
    </section>
  </div>
</template>
