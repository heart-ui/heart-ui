<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { demos } from '../../../../gallery-rules'

const name = String(useRoute().params.name)
const load = demos.get(name)
if (!load) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Demo not found',
    message: `No demo named "${name}"`,
  })
}
const Demo = defineAsyncComponent(load)
</script>

<template>
  <Demo />
</template>
