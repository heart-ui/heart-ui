<script lang="ts">
import type { InjectionKey, Ref } from 'vue'

export interface AvatarContext {
  /** The image's name, so the fallback can read it while the image is not shown. */
  name: Ref<string>
  /** How many images are mounted; only the last one to go resets the loading status. */
  images: Ref<number>
}
export const avatarKey: InjectionKey<AvatarContext> = Symbol('avatar')
</script>

<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { AvatarRoot } from 'reka-ui'
import { provide, ref } from 'vue'
import { cn } from '@/lib/utils/utils'
import { avatarVariants, type AvatarVariants } from './avatar.variants'

interface AvatarProps {
  size?: NonNullable<AvatarVariants['size']>
  class?: ClassValue
}

defineOptions({ name: 'HAvatar' })

const props = withDefaults(defineProps<AvatarProps>(), { size: 'md', class: undefined })
provide(avatarKey, { name: ref(''), images: ref(0) })
</script>

<template>
  <AvatarRoot data-slot="avatar" :class="cn(avatarVariants({ size: props.size }), props.class)">
    <slot />
  </AvatarRoot>
</template>
