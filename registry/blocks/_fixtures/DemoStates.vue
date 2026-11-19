<script setup lang="ts">
import { inject, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { demoStateKey, type DemoState, type ProvidedDemoState } from './demo-state'

// The states come from the gallery, which reads them from the item's meta.states, so the switch
// and the visual, axe and SSR runners always agree.
export type DemoStatesProps = { groupLabel?: string }

const props = withDefaults(defineProps<DemoStatesProps>(), { groupLabel: 'Demo state' })
defineSlots<{ default(props: { state: DemoState }): unknown }>()

const provided = inject<ProvidedDemoState>(demoStateKey, { state: undefined, states: ['default'] })
const offered = provided.states
const state = ref<DemoState>(offered.find((name) => name === provided.state) ?? 'default')
</script>

<template>
  <div class="flex flex-col gap-gap-lg">
    <div role="group" :aria-label="props.groupLabel" class="flex flex-wrap gap-gap-sm">
      <Button
        v-for="name in offered"
        :key="name"
        :variant="name === state ? 'outline' : 'ghost'"
        :aria-pressed="name === state"
        @click="state = name"
      >
        {{ name }}
      </Button>
    </div>
    <slot :state="state" />
  </div>
</template>
