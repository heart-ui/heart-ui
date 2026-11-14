import { cva, type VariantProps } from 'class-variance-authority'

export const dialogVariants = cva(
  [
    // The centering layer around the content ignores the pointer, so the content takes it back.
    'group/dialog pointer-events-auto relative flex max-h-full w-full flex-col overflow-hidden',
    'rounded-dialog border border-border bg-surface-raised text-foreground shadow-lg',
    'outline-hidden state-open:animate-pop-in state-closed:animate-pop-out',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-3xl',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export type DialogVariants = VariantProps<typeof dialogVariants>
