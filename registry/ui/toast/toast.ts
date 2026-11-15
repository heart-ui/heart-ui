import { createToastManager } from 'reka-ui'
import type { ToastVariants } from './toast.variants'

export type ToastVariant = NonNullable<ToastVariants['variant']>

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  /** `altText` names another way to do the same thing, for screen reader users. */
  action?: { label: string; altText: string; onClick: (event: MouseEvent) => void }
  /** Milliseconds before it closes on its own; `0` or `Infinity` keeps it open. */
  duration?: number
  /** Adding a toast with an open toast's `id` replaces it. */
  id?: string
}

export interface ToastData {
  variant: ToastVariant
  /** Kept out of Reka, whose pausing loses track; `Toaster` times toasts itself. */
  duration?: number
}

/** The one manager `Toaster` listens to; toasts added before it mounts wait in its queue. */
export const toastManager = createToastManager<ToastData>()

function show({ title, description, variant = 'neutral', action, duration, id }: ToastOptions) {
  return toastManager.add({
    id,
    title,
    description,
    duration: Number.POSITIVE_INFINITY,
    data: { variant, duration },
    // Only warnings and errors interrupt a screen reader; the rest wait their turn.
    type: variant === 'warning' || variant === 'danger' ? 'foreground' : 'background',
    actionProps: action && { ...action, closeOnClick: true },
  })
}

/** Closes the toast with this `id`, or every toast. */
function dismiss(id?: string) {
  toastManager.close(id)
}

/** Shows a toast and returns its `id`. */
export const toast = Object.assign(show, { dismiss })

export function useToast() {
  return { toast, dismiss }
}
