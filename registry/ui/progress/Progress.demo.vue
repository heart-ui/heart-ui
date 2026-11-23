<script setup lang="ts">
import { Progress } from '.'
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <section class="flex flex-col gap-gap-md">
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-sm">
          <span id="progress-empty" class="font-medium text-foreground">Queued export</span>
          <span class="text-muted-foreground">0%</span>
        </div>
        <Progress :model-value="0" aria-labelledby="progress-empty" />
      </div>
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-sm">
          <span id="progress-upload" class="font-medium text-foreground">Uploading report</span>
          <span class="text-muted-foreground">65%</span>
        </div>
        <Progress :model-value="65" aria-labelledby="progress-upload" />
      </div>
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-sm">
          <span id="progress-done" class="font-medium text-foreground">Backup complete</span>
          <span class="text-muted-foreground">100%</span>
        </div>
        <Progress :model-value="100" aria-labelledby="progress-done" />
      </div>
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-sm">
          <span id="progress-indeterminate" class="font-medium text-foreground">
            Syncing workspace
          </span>
          <span class="text-muted-foreground">Indeterminate</span>
        </div>
        <Progress :model-value="null" aria-labelledby="progress-indeterminate" />
      </div>
    </section>

    <section class="flex flex-col gap-gap-sm">
      <Progress :model-value="45" size="sm" aria-label="Small progress" />
      <Progress :model-value="45" size="md" aria-label="Medium progress" />
      <Progress :model-value="45" size="lg" aria-label="Large progress" />
    </section>
  </div>
</template>
