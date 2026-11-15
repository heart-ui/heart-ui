import { cva, type VariantProps } from 'class-variance-authority'

// The card spaces its parts with the density gap; each part pads only its sides, so a caller's
// padding on a part wins and any part may come first.
export const cardVariants = cva(
  'flex flex-col gap-gap-lg rounded-card border border-border py-gap-lg text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-surface-raised shadow-sm',
        // Border only: the page shows through, so it reads apart from `default` even without shadows.
        outline: 'bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type CardVariants = VariantProps<typeof cardVariants>
