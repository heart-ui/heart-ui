import { cva, type VariantProps } from 'class-variance-authority'

// The wrapper is the visible box; the native input inside it is unstyled and fills it.
export const inputVariants = cva(
  [
    'flex w-full items-center gap-gap-sm rounded-input border bg-background text-foreground',
    'transition-colors duration-fast',
    // The ring follows the input's own focus (data-focused), not a focused button in a slot.
    'data-focused:ring data-focused:ring-ring data-focused:ring-offset-focus data-focused:ring-offset-background',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
    'data-readonly:bg-muted',
  ],
  {
    variants: {
      size: {
        sm: 'h-control-sm px-control-px-sm text-sm',
        md: 'h-control-md px-control-px-md text-sm',
        lg: 'h-control-lg px-control-px-lg text-base',
      },
      invalid: {
        true: 'border-danger',
        false: 'border-border-control not-data-disabled:hover:border-muted-foreground',
      },
    },
    defaultVariants: { size: 'md', invalid: false },
  },
)

export type InputVariants = VariantProps<typeof inputVariants>
