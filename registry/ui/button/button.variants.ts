import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center gap-gap-sm whitespace-nowrap',
    'rounded-button font-medium select-none',
    'transition-colors duration-fast',
    // outline-hidden keeps a transparent outline that forced-colors mode makes visible.
    'outline-hidden focus-visible:ring focus-visible:ring-ring',
    'focus-visible:ring-offset-focus focus-visible:ring-offset-background',
    // Disabled looks disabled; loading (also aria-disabled) keeps full opacity. Clicks are
    // blocked in Button.vue, not with pointer-events, so they never reach the parent.
    'disabled:cursor-not-allowed disabled:opacity-50',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
  ],
  {
    // Hover and pressed styles apply only while clickable: not disabled (native or aria) or loading.
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground not-disabled:not-aria-disabled:hover:bg-primary-hover not-disabled:not-aria-disabled:active:bg-primary-active',
        secondary:
          'bg-muted text-foreground not-disabled:not-aria-disabled:hover:bg-muted-hover not-disabled:not-aria-disabled:active:bg-muted-hover',
        outline:
          'border border-border-control bg-background text-foreground not-disabled:not-aria-disabled:hover:bg-muted not-disabled:not-aria-disabled:active:bg-muted-hover',
        ghost:
          'bg-transparent text-foreground not-disabled:not-aria-disabled:hover:bg-muted not-disabled:not-aria-disabled:active:bg-muted-hover',
        // No danger-hover token yet (docs/questions.md): an opaque filter, never a translucent fill.
        danger:
          'bg-danger text-danger-foreground not-disabled:not-aria-disabled:hover:brightness-95 not-disabled:not-aria-disabled:active:brightness-90',
        link: 'bg-transparent text-link underline-offset-4 not-disabled:not-aria-disabled:hover:underline',
      },
      size: {
        sm: 'h-control-sm px-control-px-sm text-sm',
        md: 'h-control-md px-control-px-md text-sm',
        lg: 'h-control-lg px-control-px-lg text-base',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
