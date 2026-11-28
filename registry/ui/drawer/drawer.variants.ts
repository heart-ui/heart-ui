import { cva, type VariantProps } from 'class-variance-authority'

export const drawerVariants = cva(
  [
    // The layer around the panel ignores the pointer, so the panel takes it back.
    'heart-drawer group/drawer pointer-events-auto relative flex flex-col overflow-hidden',
    'border-border bg-surface-raised text-foreground shadow-lg outline-hidden',
  ],
  {
    variants: {
      side: {
        // The full window width, capped by the size: the layer shrinks to it, so the slide moves
        // the panel by its own width. The zero inset is what the slide eases to; from auto it
        // would jump.
        start: 'start-0 h-full w-screen border-e',
        end: 'end-0 h-full w-screen border-s',
        bottom: 'w-full rounded-t-lg border-t',
      },
      size: { sm: '', md: '', lg: '' },
    },
    compoundVariants: [
      { side: ['start', 'end'], size: 'sm', class: 'max-w-sm' },
      { side: ['start', 'end'], size: 'md', class: 'max-w-lg' },
      { side: ['start', 'end'], size: 'lg', class: 'max-w-3xl' },
      { side: 'bottom', size: 'sm', class: 'max-h-1/3' },
      { side: 'bottom', size: 'md', class: 'max-h-1/2' },
      { side: 'bottom', size: 'lg', class: 'max-h-3/4' },
    ],
    defaultVariants: { side: 'end', size: 'md' },
  },
)

export type DrawerVariants = VariantProps<typeof drawerVariants>
