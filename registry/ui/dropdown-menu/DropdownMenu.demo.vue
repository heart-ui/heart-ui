<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icon'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '.'

const showArchived = ref(false)
const compact = ref(true)
const sort = ref('updated')
</script>

<template>
  <div class="flex flex-wrap items-start gap-gap-lg p-4">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button aria-label="Project actions">
          <Icon name="chevron-down" class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Project</DropdownMenuLabel>
        <DropdownMenuItem>
          <template #leading><Icon name="add" class="size-4" /></template>
          New task
          <template #trailing>N</template>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Rename
          <template #trailing>R</template>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Export (Business plan)</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Marketing</DropdownMenuItem>
            <DropdownMenuItem>Engineering</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger">Delete project</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline">View</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuCheckboxItem v-model="showArchived">Show archived</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem v-model="compact">Compact rows</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup v-model="sort">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="updated">Last updated</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
