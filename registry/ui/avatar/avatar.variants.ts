import { cva, type VariantProps } from 'class-variance-authority'

// An avatar matches the control height of its size, so it lines up in a row of controls.
export const avatarVariants = cva(
  'relative inline-flex shrink-0 overflow-hidden rounded-full select-none',
  {
    variants: {
      size: {
        sm: 'size-control-sm text-xs',
        md: 'size-control-md text-sm',
        lg: 'size-control-lg text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export type AvatarVariants = VariantProps<typeof avatarVariants>
