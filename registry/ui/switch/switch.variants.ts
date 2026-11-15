import { cva, type VariantProps } from 'class-variance-authority'

// The track. The thumb and the label text take their sizes from the same `size` (see Switch.vue).
export const switchVariants = cva(
  [
    'inline-flex shrink-0 items-center rounded-full border-2 border-transparent bg-border-control',
    'transition-colors duration-fast outline-hidden',
    'focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-focus focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'state-checked:bg-primary not-disabled:state-checked:hover:bg-primary-hover',
    'not-disabled:state-unchecked:hover:bg-muted-foreground',
  ],
  {
    variants: {
      size: {
        sm: 'h-4 w-7',
        md: 'h-5 w-9',
        lg: 'h-6 w-11',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export const switchThumbVariants = cva(
  [
    // The transparent border shows only when colours are forced, where backgrounds vanish.
    'pointer-events-none block rounded-full border border-transparent bg-background shadow-sm',
    'transition-all duration-fast state-checked:bg-primary-foreground',
  ],
  {
    // A logical margin slides the thumb to the inline end, following the element's own direction
    // (an LTR island in an RTL page too); a direction selector would be rewritten by the build.
    variants: {
      size: {
        sm: 'size-3 state-checked:ms-3',
        md: 'size-4 state-checked:ms-4',
        lg: 'size-5 state-checked:ms-5',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export type SwitchVariants = VariantProps<typeof switchVariants>
