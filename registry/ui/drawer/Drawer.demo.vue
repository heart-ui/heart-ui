<script setup lang="ts">
import { ref, useId } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '.'

const sizes = ['sm', 'md', 'lg'] as const
// Open on load so the visual baseline and axe see the drawer, not only its trigger.
const editOpen = ref(true)
const customer = ref('Northwind Traders')
const customerId = useId()
const history = Array.from(
  { length: 40 },
  (_, line) => `Day ${line + 1}. Reminder sent to the billing contact.`,
)
</script>

<template>
  <div class="flex flex-wrap items-center gap-gap-md p-4">
    <Drawer v-model:open="editOpen">
      <DrawerTrigger as-child><Button>Edit invoice</Button></DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit invoice</DrawerTitle>
          <DrawerDescription>Changes save when you press Save.</DrawerDescription>
        </DrawerHeader>
        <div class="flex flex-col gap-gap-sm">
          <label :for="customerId" class="text-sm font-medium">Customer</label>
          <Input :id="customerId" v-model="customer" />
        </div>
        <DrawerFooter>
          <DrawerClose as-child><Button variant="ghost">Cancel</Button></DrawerClose>
          <Button variant="primary" @click="editOpen = false">Save</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    <Drawer>
      <DrawerTrigger as-child><Button variant="outline">Filters</Button></DrawerTrigger>
      <DrawerContent side="start" size="sm">
        <DrawerHeader><DrawerTitle>Filters</DrawerTitle></DrawerHeader>
        <p class="text-sm">Status: open, overdue.</p>
        <DrawerFooter>
          <DrawerClose as-child><Button variant="ghost">Close</Button></DrawerClose>
          <Button variant="primary">Apply</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    <Drawer>
      <DrawerTrigger as-child><Button variant="outline">Share</Button></DrawerTrigger>
      <DrawerContent side="bottom">
        <DrawerHeader>
          <DrawerTitle>Share invoice</DrawerTitle>
          <DrawerDescription>Anyone with the link can view it.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose as-child><Button variant="ghost">Cancel</Button></DrawerClose>
          <Button variant="primary">Copy link</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    <Drawer v-for="size in sizes" :key="size">
      <DrawerTrigger as-child>
        <Button variant="outline">Size {{ size }}</Button>
      </DrawerTrigger>
      <DrawerContent :size="size">
        <DrawerHeader>
          <DrawerTitle>Invoice 1042</DrawerTitle>
          <DrawerDescription>Paid on 12 March.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose as-child><Button variant="ghost">Close</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    <Drawer>
      <DrawerTrigger as-child><Button variant="outline">Long content</Button></DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Payment history</DrawerTitle>
          <DrawerDescription>Every reminder for this invoice.</DrawerDescription>
        </DrawerHeader>
        <p v-for="entry in history" :key="entry" class="text-sm">{{ entry }}</p>
        <DrawerFooter>
          <DrawerClose as-child><Button variant="primary">Done</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    <Drawer>
      <DrawerTrigger as-child><Button variant="outline">Not dismissible</Button></DrawerTrigger>
      <DrawerContent :dismissible="false" :show-close="false">
        <DrawerHeader>
          <DrawerTitle>Finish the import</DrawerTitle>
          <DrawerDescription>Map the last column to continue.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose as-child><Button variant="primary">Continue</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </div>
</template>
