import { Icon as IconifyIcon } from '@iconify/vue'
import type { ClassValue } from 'clsx'
import { defineComponent, h, type PropType } from 'vue'
import { cn } from '@/lib/utils/utils'
import { fluent, type IconName } from './sets/fluent'

/** Renders an internal icon name. Decorative: the control holding it supplies the accessible name. */
export const Icon = defineComponent({
  name: 'HIcon',
  props: {
    name: { type: String as PropType<IconName>, required: true },
    // Any ClassValue, `false` included: cn() drops what it doesn't need.
    class: { type: null as unknown as PropType<ClassValue>, default: undefined },
  },
  setup(props) {
    return () => {
      const { body, width, height } = fluent[props.name]
      return h(IconifyIcon, {
        icon: { body, width, height },
        // The data is bundled, so render on the server too instead of waiting for mount.
        ssr: true,
        'aria-hidden': 'true',
        class: cn('shrink-0', props.class),
      })
    }
  },
})
