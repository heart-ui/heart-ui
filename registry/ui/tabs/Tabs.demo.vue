<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '.'

const variants = ['line', 'pill'] as const
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <Tabs v-for="variant in variants" :key="variant" :variant="variant" default-value="overview">
      <TabsList :aria-label="`Project (${variant})`">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="billing" disabled>Billing</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" class="text-sm">
        Three tasks are due this week; the launch checklist is 80% done.
      </TabsContent>
      <TabsContent value="activity" class="text-sm">Ada commented on the launch plan.</TabsContent>
      <TabsContent value="billing" class="text-sm">Billing is on the Team plan.</TabsContent>
      <TabsContent value="settings" class="text-sm">Project settings.</TabsContent>
    </Tabs>
    <Tabs orientation="vertical" default-value="profile">
      <TabsList aria-label="Account">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="profile" class="text-sm">Name, email and avatar.</TabsContent>
      <TabsContent value="security" class="text-sm">Password and two-factor sign-in.</TabsContent>
      <TabsContent value="notifications" class="text-sm">Email and in-app alerts.</TabsContent>
    </Tabs>
  </div>
</template>
