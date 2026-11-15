import { cva, type VariantProps } from 'class-variance-authority'

// Each status reads from its subtle pair: a label, not a button, and a checked text pair.
export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'bg-muted text-muted-foreground',
        primary: 'bg-primary-subtle text-primary-subtle-foreground',
        success: 'bg-success-subtle text-success-subtle-foreground',
        warning: 'bg-warning-subtle text-warning-subtle-foreground',
        danger: 'bg-danger-subtle text-danger-subtle-foreground',
        info: 'bg-info-subtle text-info-subtle-foreground',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-xs',
        md: 'px-2 py-0.5 text-sm',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'md' },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
