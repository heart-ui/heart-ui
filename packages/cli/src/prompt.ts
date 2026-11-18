import { createInterface } from 'node:readline/promises'

/** Asks `question`; anything but y or yes, Ctrl+C and the end of input (Ctrl+D) mean no. */
export async function askYesNo(
  question: string,
  input: NodeJS.ReadableStream,
  output: NodeJS.WritableStream,
): Promise<boolean> {
  const prompt = createInterface({ input, output })
  const cancel = new AbortController()
  prompt.on('SIGINT', () => cancel.abort())
  prompt.on('close', () => cancel.abort())
  try {
    const answer = await prompt.question(`${question} (y/N) `, { signal: cancel.signal })
    return /^y(es)?$/i.test(answer.trim())
  } catch {
    return false
  } finally {
    prompt.close()
  }
}
