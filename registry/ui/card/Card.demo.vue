<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '.'
</script>

<template>
  <div class="grid max-w-content-narrow gap-gap-lg p-4 sm:grid-cols-2">
    <Card as="section" aria-labelledby="revenue-title">
      <CardHeader>
        <CardTitle id="revenue-title" as="h2">Monthly revenue</CardTitle>
        <CardDescription>All workspaces, in euros.</CardDescription>
      </CardHeader>
      <CardContent class="text-2xl font-semibold">€48,210</CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">Open report</Button>
      </CardFooter>
    </Card>
    <Card variant="outline">
      <CardHeader>
        <CardTitle as="h2">Team plan</CardTitle>
        <CardDescription>Renews on 1 December for 12 members.</CardDescription>
      </CardHeader>
      <CardFooter class="justify-end">
        <Button variant="ghost" size="sm">Cancel plan</Button>
        <Button variant="primary" size="sm">Add members</Button>
      </CardFooter>
    </Card>
    <Card variant="outline">
      <CardContent class="text-sm"
        >A card with content only, for a short note in a grid.</CardContent
      >
    </Card>
  </div>
</template>
