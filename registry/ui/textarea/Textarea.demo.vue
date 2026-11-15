<script setup lang="ts">
import { ref } from 'vue'
import { Label } from '@/components/ui/label'
import { Textarea } from '.'

const sizes = ['sm', 'md', 'lg'] as const
const message = ref('Thanks for the quick reply.\nCould we move the call to Thursday?\nBest, Ada')
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <div v-for="size in sizes" :key="size" class="flex flex-col gap-gap-sm">
      <Label :for="`notes-${size}`">Notes ({{ size }})</Label>
      <Textarea :id="`notes-${size}`" :size="size" rows="2" placeholder="Anything we should know" />
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="reply-empty">Reply</Label>
      <Textarea id="reply-empty" autoresize placeholder="Write a reply" />
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="reply">Reply (several lines)</Label>
      <Textarea id="reply" v-model="message" autoresize class="max-h-60" />
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="summary" required>Summary</Label>
      <Textarea
        id="summary"
        rows="2"
        required
        invalid
        aria-describedby="summary-error"
        model-value="Too short"
      />
      <p id="summary-error" class="text-sm text-muted-foreground">Write at least two sentences.</p>
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="terms">Terms</Label>
      <Textarea id="terms" rows="2" readonly model-value="Net 30, invoiced monthly." />
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="archived">Archived note</Label>
      <Textarea id="archived" rows="2" disabled model-value="Closed in March." />
    </div>
  </div>
</template>
