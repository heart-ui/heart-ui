import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// The token utilities theme.css adds. tailwind-merge doesn't read the Tailwind theme, so without
// these it treats `h-control-md` and `h-control-lg` as unrelated, or drops `ring-offset-focus`.
const sizes = ['sm', 'md', 'lg']
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: [
        ...sizes.flatMap((size) => [`control-${size}`, `control-px-${size}`, `gap-${size}`]),
        'sidebar-width',
        'sidebar-width-collapsed',
        'topbar-height',
        'page-px',
        'section-gap',
      ],
      // Component radius tokens (`rounded-button`, `rounded-dialog`): any single word.
      radius: [(value: string) => /^[a-z]+$/.test(value)],
      container: ['content-max', 'content-narrow'],
      ease: ['standard'],
      // Overlay animations (`animate-fade-in`, `animate-pop-out`): any kebab-case name.
      animate: [(value: string) => /^[a-z]+(-[a-z]+)*$/.test(value)],
    },
    classGroups: {
      'ring-offset-w': [{ 'ring-offset': ['focus'] }],
      duration: [{ duration: ['fast', 'normal', 'slow'] }],
      z: [{ z: ['sticky', 'overlay', 'modal', 'popover', 'toast', 'tooltip'] }],
    },
  },
})

/** Joins class values and resolves Tailwind conflicts: the later class wins. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
