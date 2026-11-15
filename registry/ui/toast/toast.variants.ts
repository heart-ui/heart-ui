import { cva, type VariantProps } from 'class-variance-authority'

export const toastVariants = cva(
  [
    'pointer-events-auto relative flex w-full items-start gap-gap-sm rounded-md border p-4 shadow-lg',
    'outline-hidden focus-visible:ring focus-visible:ring-ring',
    'not-state-closed:animate-fade-in state-closed:animate-fade-out',
  ],
  {
    variants: {
      variant: {
        neutral: 'border-border bg-surface-raised text-foreground',
        success: 'border-success bg-success-subtle text-success-subtle-foreground',
        warning: 'border-warning bg-warning-subtle text-warning-subtle-foreground',
        danger: 'border-danger bg-danger-subtle text-danger-subtle-foreground',
        info: 'border-info bg-info-subtle text-info-subtle-foreground',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

export type ToastVariants = VariantProps<typeof toastVariants>
