import { cva, type VariantProps } from 'class-variance-authority'

export const textareaVariants = cva(
  [
    'block w-full rounded-input border bg-background py-control-px-sm text-foreground',
    'resize-y transition-colors duration-fast outline-hidden placeholder:text-subtle-foreground',
    'focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-focus focus-visible:ring-offset-background',
    // data-readonly, not :read-only, which also matches a disabled field.
    'disabled:cursor-not-allowed disabled:opacity-50 data-readonly:bg-muted',
  ],
  {
    variants: {
      size: {
        sm: 'px-control-px-sm text-sm',
        md: 'px-control-px-md text-sm',
        lg: 'px-control-px-lg text-base',
      },
      invalid: {
        true: 'border-danger',
        false: 'border-border-control not-disabled:hover:border-muted-foreground',
      },
      // field-sizing is a progressive enhancement: without it the field keeps its height, so it
      // keeps the resize handle too.
      autoresize: {
        true: 'field-sizing-content supports-field-sizing:resize-none',
        false: '',
      },
    },
    defaultVariants: { size: 'md', invalid: false, autoresize: false },
  },
)

export type TextareaVariants = VariantProps<typeof textareaVariants>
