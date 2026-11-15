<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '.'
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <div class="flex flex-col gap-gap-sm">
      <Label for="name">Full name</Label>
      <Input id="name" placeholder="Ada Lovelace" />
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="email" required>Email</Label>
      <Input id="email" type="email" required />
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="vat" required required-label="obligatoire">Numéro de TVA</Label>
      <Input id="vat" required />
    </div>
    <div class="flex max-w-80 flex-col gap-gap-sm">
      <Label for="billing" required>
        Billing contact who receives every invoice, receipt and payment reminder for this workspace
      </Label>
      <Input id="billing" type="email" required />
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="company">Company</Label>
      <Input id="company" model-value="Analytical Engines" disabled />
    </div>
  </div>
</template>
