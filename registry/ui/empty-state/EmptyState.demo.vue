<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icon'
import { EmptyState } from '.'
</script>

<template>
  <div class="flex flex-col gap-gap-lg p-4">
    <EmptyState
      title="No invoices yet"
      description="Invoices you send show up here, with their status and due date."
    >
      <template #icon>
        <Icon name="add" />
      </template>
      <template #actions>
        <Button variant="primary">Create invoice</Button>
        <Button variant="outline">Import from CSV</Button>
      </template>
    </EmptyState>
    <EmptyState
      title="No matches for “acme”"
      description="Check the spelling or clear the filters."
    >
      <template #icon>
        <Icon name="search" />
      </template>
      <template #actions>
        <Button variant="outline">Clear filters</Button>
      </template>
    </EmptyState>
    <div class="w-48 self-center">
      <EmptyState
        title="No matches for “e2f1c9a07b4d4e53a1f0c6e2b8d7f4a95c3e1b0d”"
        description="Search by name instead."
      />
    </div>
    <EmptyState
      title="Nothing to review"
      description="Pull requests that ask for your review land here. When a teammate adds you as a reviewer, you also get an email, and the request stays in this list until you approve it, ask for changes or someone removes you from it."
    />
  </div>
</template>
