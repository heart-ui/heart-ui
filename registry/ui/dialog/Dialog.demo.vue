<script setup lang="ts">
import { ref, useId } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '.'

const sizes = ['sm', 'md', 'lg'] as const
// Open on load so the visual baseline and axe see the dialog, not only its trigger.
const renameOpen = ref(true)
const name = ref('Website redesign')
const nameId = useId()
const terms = Array.from(
  { length: 40 },
  (_, line) => `Clause ${line + 1}. The service is provided as is, without warranty of any kind.`,
)
</script>

<template>
  <div class="flex flex-wrap items-center gap-gap-md p-4">
    <Dialog v-model:open="renameOpen">
      <DialogTrigger as-child><Button>Rename</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
          <DialogDescription>The URL does not change.</DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-gap-sm">
          <label :for="nameId" class="text-sm font-medium">Name</label>
          <Input :id="nameId" v-model="name" />
        </div>
        <DialogFooter>
          <DialogClose as-child><Button variant="ghost">Cancel</Button></DialogClose>
          <Button variant="primary" @click="renameOpen = false">Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-for="size in sizes" :key="size">
      <DialogTrigger as-child>
        <Button variant="outline">Size {{ size }}</Button>
      </DialogTrigger>
      <DialogContent :size="size">
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription
            >This removes the project and its files for everyone.</DialogDescription
          >
        </DialogHeader>
        <DialogFooter>
          <DialogClose as-child><Button variant="ghost">Cancel</Button></DialogClose>
          <Button variant="danger">Delete project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog>
      <DialogTrigger as-child><Button variant="outline">Without description</Button></DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader><DialogTitle>Sign out?</DialogTitle></DialogHeader>
        <DialogFooter>
          <DialogClose as-child><Button variant="ghost">Stay</Button></DialogClose>
          <Button variant="primary">Sign out</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog>
      <DialogTrigger as-child><Button variant="outline">Long content</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms of service</DialogTitle>
          <DialogDescription>Read the terms before you accept them.</DialogDescription>
        </DialogHeader>
        <p v-for="term in terms" :key="term" class="text-sm">{{ term }}</p>
        <DialogFooter>
          <DialogClose as-child><Button variant="primary">Accept</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog>
      <DialogTrigger as-child><Button variant="outline">Not dismissible</Button></DialogTrigger>
      <DialogContent :dismissible="false" :show-close="false">
        <DialogHeader>
          <DialogTitle>Finish setup</DialogTitle>
          <DialogDescription>Choose a workspace name to continue.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose as-child><Button variant="primary">Continue</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
