<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from '.'
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-md p-4">
    <Alert>
      <AlertTitle>Usage resets on the 1st</AlertTitle>
      <AlertDescription>These numbers cover the current billing month.</AlertDescription>
    </Alert>
    <Alert variant="success">
      <AlertTitle>Domain verified</AlertTitle>
      <AlertDescription>Email from acme.com now passes sender checks.</AlertDescription>
    </Alert>
    <Alert variant="warning">
      <AlertTitle>Your trial ends in 3 days</AlertTitle>
      <AlertDescription>
        Add a payment method to keep your projects. Without one, the workspace becomes read-only and
        new members can't join until billing is set up again.
      </AlertDescription>
    </Alert>
    <Alert variant="danger">
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>The card was declined. Try another card.</AlertDescription>
    </Alert>
    <Alert variant="info">
      <AlertTitle>Read-only while the import runs</AlertTitle>
    </Alert>
  </div>
</template>
