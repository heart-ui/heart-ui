<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { demoKind, demos } from '../../gallery-rules'

const props = defineProps<{ name?: string; path: string }>()

const demo = computed(() => {
  const load = props.name === undefined ? undefined : demos.get(props.name)
  return load ? defineAsyncComponent(load) : undefined
})
</script>

<template>
  <!-- A layout demo renders the page's main itself. -->
  <component :is="demoKind(name!) === 'layouts' ? 'div' : 'main'" v-if="demo">
    <component :is="demo" />
  </component>
  <p v-else>No demo at “{{ path }}”.</p>
</template>
