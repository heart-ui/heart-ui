<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { demos } from '../../gallery-rules'

const props = defineProps<{ name?: string; path: string }>()

const demo = computed(() => {
  const load = props.name === undefined ? undefined : demos.get(props.name)
  return load ? defineAsyncComponent(load) : undefined
})
</script>

<template>
  <component :is="demo" v-if="demo" />
  <p v-else>No demo at “{{ path }}”.</p>
</template>
