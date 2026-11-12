<script setup lang="ts">
import { galleryAttrs } from '../../gallery-rules'

const route = useRoute()

useHead({ htmlAttrs: computed(() => galleryAttrs(route.query)) })
</script>

<template>
  <NuxtPage />
</template>
