// Helpers for Reka controls (checkbox, radio, switch) wrapped in a label, with a hidden native input
// so the form sees a native control: submit, `required`, reset.

export type ControlRole = 'checkbox' | 'radio' | 'switch'

/**
 * Hands focus from the hidden input to the visible control beside it. Form validation focuses
 * the first invalid input; left there, keys would change the input behind `v-model`.
 */
export function handFocus(event: FocusEvent, role: ControlRole) {
  const input = event.target as HTMLElement
  input.parentElement?.querySelector<HTMLElement>(`[role="${role}"]`)?.focus()
}

/**
 * Fires `input` and `change` from the hidden input, as a user's change to a native control does,
 * so form-level listeners (dirty state, autosave) see it. Call it for user changes only.
 */
export function fireFormEvents(input: HTMLInputElement | undefined) {
  input?.dispatchEvent(new Event('input', { bubbles: true }))
  input?.dispatchEvent(new Event('change', { bubbles: true }))
}
