<script setup lang="ts">
import { computed, ref } from 'vue'
import { Checkbox } from '.'

const sizes = ['sm', 'md', 'lg'] as const
const reports = ref({ weekly: true, monthly: false })
const all = computed<boolean | 'indeterminate'>(() => {
  const values = Object.values(reports.value)
  if (values.every(Boolean)) return true
  return values.some(Boolean) ? 'indeterminate' : false
})
function setAll(next: boolean | 'indeterminate') {
  for (const key of Object.keys(reports.value) as (keyof typeof reports.value)[])
    reports.value[key] = next === true
}
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <div class="flex flex-col gap-gap-sm">
      <Checkbox v-for="size in sizes" :key="size" :size="size" :model-value="size !== 'sm'">
        Email me about new invoices ({{ size }})
      </Checkbox>
    </div>
    <fieldset class="flex flex-col gap-gap-sm">
      <legend class="mb-2 text-sm font-medium">Reports</legend>
      <Checkbox :model-value="all" @update:model-value="setAll">All reports</Checkbox>
      <div class="flex flex-col gap-gap-sm ps-6">
        <Checkbox v-model="reports.weekly">Weekly summary</Checkbox>
        <Checkbox v-model="reports.monthly">Monthly statement</Checkbox>
      </div>
    </fieldset>
    <div class="flex flex-col gap-gap-sm">
      <Checkbox disabled>Archived projects (unavailable on this plan)</Checkbox>
      <Checkbox disabled :model-value="true">Two-factor sign-in (required by your admin)</Checkbox>
    </div>
    <div class="max-w-80">
      <Checkbox :model-value="true">
        Share anonymous usage data so we can improve search, reports and the invoice editor
      </Checkbox>
    </div>
    <div class="flex items-center gap-gap-sm text-sm">
      <Checkbox aria-label="Select invoice 1042" />
      <span>Invoice 1042</span>
    </div>
  </div>
</template>
