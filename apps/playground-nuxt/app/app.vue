<script setup lang="ts">
import { galleryAttrs } from '../../gallery-rules'

const route = useRoute()

useHead({ htmlAttrs: computed(() => galleryAttrs(route.query)) })
</script>

<template>
  <!-- Keyed on the full path, so a client-side query change (?state=) remounts the demo. -->
  <NuxtPage :page-key="(route) => route.fullPath" />
</template>
