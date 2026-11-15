import { cva, type VariantProps } from 'class-variance-authority'

// The trigger looks like an input: same radius, heights, padding and border states.
export const selectTriggerVariants = cva(
  [
    'flex w-full items-center justify-between gap-gap-sm rounded-input border bg-background text-foreground',
    'transition-colors duration-fast outline-hidden',
    'focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-focus focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'data-placeholder:text-subtle-foreground',
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
        false: 'border-border-control not-disabled:hover:border-muted-foreground',
      },
    },
    defaultVariants: { size: 'md', invalid: false },
  },
)

export type SelectTriggerVariants = VariantProps<typeof selectTriggerVariants>
