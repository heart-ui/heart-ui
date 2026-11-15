<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Toaster, toast, type ToastOptions } from '.'

const examples: ToastOptions[] = [
  { title: 'Draft saved', variant: 'neutral' },
  { title: 'Invoice sent', description: 'Ada Lovelace will get it by email.', variant: 'success' },
  { title: 'Card expires soon', description: 'Update it before 1 December.', variant: 'warning' },
  { title: 'Payment failed', description: 'The card was declined.', variant: 'danger' },
  { title: 'Export started', description: 'We will email you the file.', variant: 'info' },
]

function archive() {
  toast({
    title: 'Invoice archived',
    action: { label: 'Undo', altText: 'Restore it from the Archive page', onClick: () => {} },
  })
}
</script>

<template>
  <div class="flex flex-wrap gap-gap-sm p-4">
    <Button
      v-for="example in examples"
      :key="example.title"
      variant="outline"
      @click="toast(example)"
    >
      {{ example.title }}
    </Button>
    <Button variant="outline" @click="archive">Archive with undo</Button>
    <Button variant="ghost" @click="toast.dismiss()">Close all</Button>
  </div>
  <Toaster />
</template>
