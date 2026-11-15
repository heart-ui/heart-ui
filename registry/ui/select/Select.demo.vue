<script setup lang="ts">
import { ref } from 'vue'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from '.'

const sizes = ['sm', 'md', 'lg'] as const
const role = ref('editor')
const timezones = [
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Atlantic/Azores',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Athens',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <div v-for="size in sizes" :key="size" class="flex flex-col gap-gap-sm">
      <Label :for="`country-${size}`">Country ({{ size }})</Label>
      <Select :model-value="size === 'sm' ? undefined : 'de'">
        <SelectTrigger :id="`country-${size}`" :size="size" placeholder="Choose a country" />
        <SelectContent>
          <SelectItem value="de">Germany</SelectItem>
          <SelectItem value="fr">France</SelectItem>
          <SelectItem value="it">Italy</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="plan">Plan</Label>
      <Select>
        <SelectTrigger
          id="plan"
          invalid
          aria-describedby="plan-error"
          placeholder="Choose a plan"
        />
        <SelectContent>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="team">Team</SelectItem>
        </SelectContent>
      </Select>
      <p id="plan-error" class="text-sm text-muted-foreground">Choose a plan to continue.</p>
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="currency">Currency</Label>
      <Select model-value="eur" disabled>
        <SelectTrigger id="currency" />
        <SelectContent>
          <SelectItem value="eur">Euro</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="timezone">Time zone</Label>
      <Select model-value="Europe/Berlin">
        <SelectTrigger id="timezone" />
        <SelectContent>
          <SelectItem v-for="zone in timezones" :key="zone" :value="zone">{{ zone }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <form class="flex flex-col gap-gap-sm" @submit.prevent>
      <Label for="role">Role</Label>
      <Select v-model="role" name="role" required>
        <SelectTrigger id="role" />
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Staff</SelectLabel>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Guests</SelectLabel>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="billing" disabled>Billing (owner only)</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </form>
  </div>
</template>
