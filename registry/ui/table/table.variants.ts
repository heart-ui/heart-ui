import { cva, type VariantProps } from 'class-variance-authority'

// A cell is at least a control tall, so a control in it lines up with the row and the density
// knob sets row height as it does control height.
export const tableCellVariants = cva('py-1 align-middle', {
  variants: {
    size: {
      sm: 'h-control-sm px-control-px-sm',
      md: 'h-control-md px-control-px-md',
      lg: 'h-control-lg px-control-px-lg',
    },
  },
  defaultVariants: { size: 'md' },
})

export type TableCellVariants = VariantProps<typeof tableCellVariants>
