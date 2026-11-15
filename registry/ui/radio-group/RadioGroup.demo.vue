<script setup lang="ts">
import { ref } from 'vue'
import { RadioGroup, RadioGroupItem } from '.'

const sizes = ['sm', 'md', 'lg'] as const
const plan = ref('team')
const billing = ref('yearly')
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <RadioGroup
      v-for="size in sizes"
      :key="size"
      :size="size"
      :model-value="size === 'sm' ? undefined : 'team'"
      :aria-label="`Plan (${size})`"
    >
      <RadioGroupItem value="free">Free ({{ size }})</RadioGroupItem>
      <RadioGroupItem value="team">Team ({{ size }})</RadioGroupItem>
      <RadioGroupItem value="enterprise" disabled>Enterprise (contact sales)</RadioGroupItem>
    </RadioGroup>
    <form @submit.prevent>
      <RadioGroup
        v-model="billing"
        name="billing"
        required
        orientation="horizontal"
        aria-label="Billing"
      >
        <RadioGroupItem value="monthly">Monthly</RadioGroupItem>
        <RadioGroupItem value="yearly">Yearly</RadioGroupItem>
      </RadioGroup>
    </form>
    <RadioGroup v-model="plan" disabled aria-label="Plan, locked by your admin">
      <RadioGroupItem value="free">Free</RadioGroupItem>
      <RadioGroupItem value="team">Team</RadioGroupItem>
    </RadioGroup>
    <RadioGroup class="max-w-80" model-value="all" aria-label="Notifications">
      <RadioGroupItem value="all">
        Every update on projects you own, including comments, mentions and status changes
      </RadioGroupItem>
      <RadioGroupItem value="none">Nothing</RadioGroupItem>
    </RadioGroup>
  </div>
</template>
