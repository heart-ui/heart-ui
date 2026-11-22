<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { injectAvatarRootContext, AvatarImage as RekaAvatarImage } from 'reka-ui'
import { computed, inject, onBeforeUnmount, ref, watchEffect } from 'vue'
import { cn } from '@/lib/utils/utils'
import { avatarKey } from './Avatar.vue'

interface AvatarImageProps {
  src: string
  /** The person's name, or `''` when their name is next to the avatar. */
  alt: string
  class?: ClassValue
}

defineOptions({ name: 'HAvatarImage' })

const props = withDefaults(defineProps<AvatarImageProps>(), { class: undefined })
const root = injectAvatarRootContext()
const avatar = inject(avatarKey, { name: ref(''), images: ref(0) })
const label = computed(() => props.alt.trim())

avatar.images.value++
watchEffect(() => {
  avatar.name.value = label.value
})
// Reka keeps the root's status at `loaded` after the image goes, which would leave the
// fallback hidden in an empty circle. Another image still mounted (a keyed swap) keeps it.
onBeforeUnmount(() => {
  if (--avatar.images.value > 0) return
  root.imageLoadingStatus.value = 'idle'
  avatar.name.value = ''
})
</script>

<template>
  <!-- Reka fixes role="img", which needs a name; an empty alt means the image is decorative. -->
  <RekaAvatarImage
    data-slot="avatar-image"
    :src="props.src"
    :alt="label"
    :role="label === '' ? 'presentation' : 'img'"
    :class="cn('aspect-square size-full object-cover', props.class)"
  />
</template>
