import { cva, type VariantProps } from 'class-variance-authority'

// A vertical rule stretches with its flex row rather than taking `h-full`, which needs a set
// height on the row.
export const separatorVariants = cva('shrink-0 bg-border', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'w-px self-stretch',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})

export type SeparatorVariants = VariantProps<typeof separatorVariants>
