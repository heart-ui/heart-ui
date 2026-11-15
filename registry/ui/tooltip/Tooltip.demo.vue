<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icon'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '.'

const sides = ['top', 'right', 'bottom', 'left'] as const
</script>

<template>
  <TooltipProvider>
    <div class="flex flex-wrap items-center gap-gap-lg p-16">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="ghost" aria-label="Search"><Icon name="search" class="size-4" /></Button>
        </TooltipTrigger>
        <TooltipContent>Search (/)</TooltipContent>
      </Tooltip>
      <Tooltip v-for="side in sides" :key="side">
        <TooltipTrigger as-child>
          <Button variant="outline">{{ side }}</Button>
        </TooltipTrigger>
        <TooltipContent :side="side">Opens on the {{ side }}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="outline">Long hint</Button>
        </TooltipTrigger>
        <TooltipContent>
          Archived projects stay readable for everyone in the workspace, and you can restore them
          from Settings at any time.
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
</template>
