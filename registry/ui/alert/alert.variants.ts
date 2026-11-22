import { cva, type VariantProps } from 'class-variance-authority'

// Each status is its subtle pair with a border in the status colour, as in `toast`.
export const alertVariants = cva(
  'flex w-full items-start gap-gap-sm rounded-md border p-4 text-sm',
  {
    variants: {
      variant: {
        info: 'border-info bg-info-subtle text-info-subtle-foreground',
        success: 'border-success bg-success-subtle text-success-subtle-foreground',
        warning: 'border-warning bg-warning-subtle text-warning-subtle-foreground',
        danger: 'border-danger bg-danger-subtle text-danger-subtle-foreground',
      },
    },
    defaultVariants: { variant: 'info' },
  },
)

export type AlertVariants = VariantProps<typeof alertVariants>
