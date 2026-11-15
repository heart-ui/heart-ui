import { cva, type VariantProps } from 'class-variance-authority'

// Every item shares one row layout: an indicator or icon column at the inline start, the name, then
// a trailing hint. Checkbox and radio items put their mark in that same column.
export const dropdownMenuItemVariants = cva(
  [
    'relative flex cursor-default items-center gap-gap-sm rounded-sm py-1.5 ps-8 pe-control-px-sm text-sm outline-hidden select-none',
    'data-disabled:cursor-not-allowed data-disabled:text-disabled-foreground',
  ],
  {
    variants: {
      variant: {
        default: 'data-highlighted:bg-muted',
        danger: 'text-danger-subtle-foreground data-highlighted:bg-danger-subtle',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export const dropdownMenuContentClasses = [
  'z-popover min-w-48 overflow-y-auto rounded-md border border-border bg-surface-raised p-1 text-foreground shadow-md',
  'state-open:animate-fade-in state-closed:animate-fade-out',
]

// Capped at the room Reka measures beside the trigger; bound before the caller's style, which wins.
export const dropdownMenuContentStyle = {
  maxHeight: 'var(--reka-dropdown-menu-content-available-height)',
}

export type DropdownMenuItemVariants = VariantProps<typeof dropdownMenuItemVariants>
