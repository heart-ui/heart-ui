import { cva, type VariantProps } from 'class-variance-authority'

export const tabsListVariants = cva('flex', {
  variants: {
    variant: {
      line: '',
      pill: 'gap-1 rounded-md bg-muted p-1',
    },
    orientation: {
      horizontal: 'flex-row flex-wrap',
      vertical: 'flex-col items-stretch',
    },
  },
  defaultVariants: { variant: 'line', orientation: 'horizontal' },
})

export const tabsTriggerVariants = cva(
  [
    'inline-flex items-center justify-center gap-gap-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap',
    'text-muted-foreground transition-colors duration-fast outline-hidden',
    'focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-focus',
    'not-disabled:hover:text-foreground not-disabled:aria-selected:text-foreground',
    'disabled:cursor-not-allowed disabled:text-disabled-foreground',
  ],
  {
    variants: {
      variant: {
        // Each tab draws its own stretch of the rule, so every row of wrapped tabs keeps one.
        line: 'border-border focus-visible:ring-offset-background not-disabled:aria-selected:border-primary',
        pill: 'rounded-sm focus-visible:ring-offset-muted not-disabled:aria-selected:bg-background not-disabled:aria-selected:shadow-sm',
      },
      orientation: {
        horizontal: '',
        vertical: 'justify-start',
      },
    },
    compoundVariants: [
      { variant: 'line', orientation: 'horizontal', class: 'border-b-2' },
      // Below sm the list stacks above the panels, so the rule runs under each tab there too.
      { variant: 'line', orientation: 'vertical', class: 'border-b-2 sm:border-e-2 sm:border-b-0' },
    ],
    defaultVariants: { variant: 'line', orientation: 'horizontal' },
  },
)

export type TabsListVariants = VariantProps<typeof tabsListVariants>
export type TabsTriggerVariants = VariantProps<typeof tabsTriggerVariants>
