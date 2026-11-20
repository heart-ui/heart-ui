<script setup lang="ts">
import { Separator } from '.'
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <section class="flex flex-col gap-gap-md">
      <div class="flex flex-col gap-gap-sm">
        <h2 class="text-sm font-medium text-foreground">Account</h2>
        <p class="text-sm text-muted-foreground">Name, email and sign-in methods.</p>
      </div>
      <Separator />
      <div class="flex flex-col gap-gap-sm">
        <h2 class="text-sm font-medium text-foreground">Billing</h2>
        <p class="text-sm text-muted-foreground">Plan, invoices and payment details.</p>
      </div>
      <Separator :decorative="false" />
      <div class="flex flex-col gap-gap-sm">
        <h2 class="text-sm font-medium text-foreground">Danger zone</h2>
        <p class="text-sm text-muted-foreground">Delete this workspace and all its data.</p>
      </div>
    </section>
    <div class="flex items-center gap-gap-sm text-sm text-muted-foreground">
      <span>Docs</span>
      <Separator orientation="vertical" />
      <span>Blog</span>
      <Separator orientation="vertical" :decorative="false" />
      <span>Changelog</span>
    </div>
  </div>
</template>
