/** A failure the CLI reports as one line, with its exit code. */
export class CliError extends Error {
  readonly exitCode: number

  constructor(message: string, exitCode = 1) {
    super(message)
    this.name = 'CliError'
    this.exitCode = exitCode
  }
}

/**
 * A character that can change what the terminal shows: C0, DEL, C1, and the bidi and zero-width
 * controls that reorder or hide text.
 */
export function isControl(char: string): boolean {
  const code = char.charCodeAt(0)
  return (
    code < 0x20 ||
    (code >= 0x7f && code <= 0x9f) ||
    code === 0x061c ||
    (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2060 && code <= 0x2069) ||
    code === 0xfeff
  )
}

/** `text` without control characters, safe to print. */
export function printable(text: string): string {
  return [...text].filter((char) => !isControl(char)).join('')
}

/** JSON text with every control character JSON.stringify left raw (DEL, C1, bidi) escaped. */
export function escapeControls(json: string): string {
  return [...json]
    .map((char) =>
      isControl(char) ? `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}` : char,
    )
    .join('')
}

/** `text` in double quotes with every control character escaped, safe to print. */
export function quoted(text: string): string {
  return escapeControls(JSON.stringify(text))
}
