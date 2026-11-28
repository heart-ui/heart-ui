import { cva, type VariantProps } from 'class-variance-authority'

// The box around the field looks like an input: same radius, heights, padding and border states.
export const comboboxInputVariants = cva(
  [
    'flex w-full items-center gap-gap-sm rounded-input border bg-background text-foreground',
    'transition-colors duration-fast',
    'focus-within:ring focus-within:ring-ring focus-within:ring-offset-focus focus-within:ring-offset-background',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
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

export type ComboboxInputVariants = VariantProps<typeof comboboxInputVariants>
