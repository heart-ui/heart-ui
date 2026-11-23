import { cva, type VariantProps } from 'class-variance-authority'

// A progress bar is thinner than an interactive control, so sizes step along the spacing scale.
export const progressVariants = cva('relative w-full overflow-hidden rounded-full bg-muted', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    },
  },
  defaultVariants: { size: 'md' },
})

export type ProgressVariants = VariantProps<typeof progressVariants>
