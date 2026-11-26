<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@/lib/icon'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '.'

const width = ref('1280')
const height = ref('720')
</script>

<template>
  <div class="flex flex-wrap items-start gap-gap-lg p-4">
    <Popover>
      <PopoverTrigger as-child>
        <Button variant="outline">Dimensions</Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <div class="flex flex-col gap-gap-md">
          <div class="flex flex-col gap-gap-sm">
            <Label for="demo-popover-width">Width</Label>
            <Input id="demo-popover-width" v-model="width" inputmode="numeric" />
          </div>
          <div class="flex flex-col gap-gap-sm">
            <Label for="demo-popover-height">Height</Label>
            <Input id="demo-popover-height" v-model="height" inputmode="numeric" />
          </div>
          <PopoverClose as-child>
            <Button size="sm" class="self-end">Apply</Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
    <Popover>
      <PopoverTrigger as-child>
        <Button variant="ghost" aria-label="About this project">
          <Icon name="info" class="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right">
        <p class="text-sm">
          Archived projects stay readable for everyone in the workspace, and you can restore them
          from Settings at any time.
        </p>
      </PopoverContent>
    </Popover>
  </div>
</template>
