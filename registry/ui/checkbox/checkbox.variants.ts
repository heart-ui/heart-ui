import { cva, type VariantProps } from 'class-variance-authority'

// The box. The label text's size is set on the wrapping label (see Checkbox.vue).
export const checkboxVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center rounded-sm border bg-background',
    'border-border-control text-primary-foreground transition-colors duration-fast outline-hidden',
    'focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-focus focus-visible:ring-offset-background',
    'not-disabled:state-unchecked:hover:border-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
    // Checked and indeterminate share the filled look.
    'not-state-unchecked:border-primary not-state-unchecked:bg-primary',
    'not-disabled:not-state-unchecked:hover:border-primary-hover not-disabled:not-state-unchecked:hover:bg-primary-hover',
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

export type CheckboxVariants = VariantProps<typeof checkboxVariants>
