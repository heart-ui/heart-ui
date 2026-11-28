<script setup lang="ts">
import { defineAsyncComponent, provide } from 'vue'
import { demoKind, demoStateKey, demos, galleryState } from '../../../../gallery-rules'

const route = useRoute()
const name = String(route.params.name)
provide(demoStateKey, galleryState(name, route.query))
const load = demos.get(name)
if (!load) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Demo not found',
    message: `No demo named "${name}"`,
  })
}
const Demo = defineAsyncComponent(load)
// A layout demo renders the page's main itself.
const wrapper = demoKind(name) === 'layouts' ? 'div' : 'main'
</script>

<template>
  <component :is="wrapper"><Demo /></component>
</template>
