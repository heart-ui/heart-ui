import { cva, type VariantProps } from 'class-variance-authority'

// The radio circle. The label text's size is set on the wrapping label (see RadioGroupItem.vue).
export const radioGroupItemVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center rounded-full border bg-background',
    'border-border-control transition-colors duration-fast outline-hidden',
    'focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-focus focus-visible:ring-offset-background',
    'not-disabled:state-unchecked:hover:border-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
    'state-checked:border-primary state-checked:bg-primary',
    'not-disabled:state-checked:hover:border-primary-hover not-disabled:state-checked:hover:bg-primary-hover',
  ],
  {
    variants: {
      size: {
        sm: 'size-3.5',
        md: 'size-4',
        lg: 'size-5',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export type RadioGroupItemVariants = VariantProps<typeof radioGroupItemVariants>
