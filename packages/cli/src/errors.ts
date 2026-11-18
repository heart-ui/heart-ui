/** A failure the CLI reports as one line, with its exit code. */
export class CliError extends Error {
  readonly exitCode: number

  constructor(message: string, exitCode = 1) {
    super(message)
    this.name = 'CliError'
    this.exitCode = exitCode
  }
}

/** A terminal control character (C0, DEL or C1), which could rewrite the user's terminal. */
export function isControl(char: string): boolean {
  const code = char.charCodeAt(0)
  return code < 0x20 || (code >= 0x7f && code <= 0x9f)
}

/** `text` in double quotes with every control character escaped, safe to print. */
export function quoted(text: string): string {
  return [...JSON.stringify(text)]
    .map((char) =>
      isControl(char) ? `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}` : char,
    )
    .join('')
}
