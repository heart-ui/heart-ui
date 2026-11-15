<script setup lang="ts">
import { ref } from 'vue'
import { Switch } from '.'

const sizes = ['sm', 'md', 'lg'] as const
const alerts = ref(true)
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <div class="flex flex-col gap-gap-sm">
      <Switch v-for="size in sizes" :key="size" :size="size" :model-value="size !== 'sm'">
        Email notifications ({{ size }})
      </Switch>
    </div>
    <form class="flex flex-col gap-gap-sm" @submit.prevent>
      <Switch v-model="alerts" name="alerts">Security alerts</Switch>
      <Switch disabled>Beta features (unavailable on this plan)</Switch>
      <Switch disabled :model-value="true">Audit log (required by your admin)</Switch>
    </form>
    <div class="max-w-80">
      <Switch :model-value="true">
        Show a preview of each invoice before it is sent to the customer
      </Switch>
    </div>
    <div class="flex items-center gap-gap-sm text-sm">
      <Switch aria-label="Publish the pricing page" />
      <span>Pricing page</span>
    </div>
    <div dir="rtl">
      <Switch :model-value="true">الإشعارات</Switch>
    </div>
  </div>
</template>
