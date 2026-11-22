<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '.'

const photo =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAIAAABt+uBvAAAC9UlEQVR42u3bbWvTUBgG4Pxs8Q1hIoJDVObL2BRZ52Y/VKxrU9qutHZ2L2VrbbCOtuvqxj4oU+ZP8IaDMBQ6XXKenCe54aaUNDnn6UWSnpyk3ufjn8yUeCQgEIEIRCACEYhABGIIRCACEYhABCIQgRgCEYhAqQFa350sl7oPV5szC+Vrc4Urj97hFe+xBMvxaUqBdgff8P1vzZcgMj1YB2ti/RQBrZR7F7r8HWyVfKAPwcm9pfoldEywLVpILFB5Z2zOMmGCFtBOAoHwrULSnI+YkSd2ZIXfd/7Yj2SONSGgMOedKeejhABd7jfLkd81T2C8Y0nHxPb4yDoQxnhWgdC+bqB/GSuHCdpXDIQrKas6Jlav1zzVx5fAUWYXCFfkAkDoRSvQzEJZAAi9aAWKdvQ8ZVStFUhAx4R7UEL3IJ6D+CvGcRBH0rwW49U854OSPB/EGUXOSfOuBu+L8c4q783z6Y60PN3B54P4hBmfUWQIRCACEYhABCIQgRgXgHb2v9b2JmutQa7ef10NVis9vOI9lmA5Pk0d0KcvZ5X2Ycbv3H/VuP64eOHFKtbBmlgfW2HbJAOVtg+e5bbCzJlhW7SAdhIF1Bt/z64HtxcrEU65ojW0iZbVA2Wrwc2nvqXbPmgZ7WsF8rdGd15UBe7Noxf0pQkoOPyxmG+LPV5mgh7RrwKg9x+P776sCeuYoF/07jSQvzm6OrcWi44JekcNjgK9be7HSHM+qMQ5oLwzOib5iIy8qEaATumYRDKejABoIzi58aToIBCq2gh9GzYsUP/obDZTd1DHBLWhwjiBlvyOszomqDA2oNrexHEdE9QZD9CDlaYKINQZA1ChNVChY4JqpYFmMw1FQKhWFKjSHivSMUHNckDzb7bVAaFmIaDuwanMH8Ei/1sZKpcAKrSG6nR+n6qHEkDPxSfDogoqlwCKaz4skhk160Cd0alSHRPUbxeo0T1SDYT67QIVN4eqgVC/XaBcva8aCPXbBcpWA9VA/3uj8ReL3tw/qJYW5gAAAABJRU5ErkJggg=='
const broken = 'data:image/png;base64,AAAA'
const sizes = ['sm', 'md', 'lg'] as const
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <div class="flex items-center gap-gap-md">
      <Avatar v-for="size in sizes" :key="size" :size="size">
        <AvatarImage :src="photo" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    </div>
    <div class="flex items-center gap-gap-md">
      <Avatar v-for="size in sizes" :key="size" :size="size">
        <AvatarImage :src="broken" alt="Grace Hopper" />
        <AvatarFallback>GH</AvatarFallback>
      </Avatar>
    </div>
    <div class="flex items-center gap-gap-sm">
      <Avatar aria-hidden="true">
        <AvatarImage :src="photo" alt="" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <div class="flex flex-col">
        <span class="text-sm font-medium text-foreground">Ada Lovelace</span>
        <span class="text-sm text-muted-foreground">ada@example.com</span>
      </div>
    </div>
    <div class="flex items-center gap-gap-sm">
      <Avatar aria-hidden="true">
        <AvatarFallback>KJ</AvatarFallback>
      </Avatar>
      <span class="text-sm font-medium text-foreground">Katherine Johnson</span>
    </div>
  </div>
</template>
