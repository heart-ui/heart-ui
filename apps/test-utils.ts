// Process helpers shared by the playground tests and the visual runner.
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

/** A free TCP port on 127.0.0.1 (another process can still take it before it's used). */
export function freePort() {
  return new Promise<number>((resolve, reject) => {
    const probe = createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address()
      probe.close(() => resolve(typeof address === 'object' && address ? address.port : 0))
    })
  })
}

/** Starts `node <entry>` on a free port and resolves once it answers HTTP; fails with its log. */
export async function startNodeServer(entry: string, timeout = 30_000) {
  const port = await freePort()
  const base = `http://127.0.0.1:${port}`
  const server = spawn(process.execPath, [entry], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let log = ''
  let spawnError: Error | undefined
  server.stdout.on('data', (chunk: Buffer) => (log += chunk))
  server.stderr.on('data', (chunk: Buffer) => (log += chunk))
  server.once('error', (error) => (spawnError = error))
  const deadline = Date.now() + timeout
  for (;;) {
    if (spawnError) throw spawnError
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`${entry} exited (${server.exitCode ?? server.signalCode}): ${log}`)
    }
    if (Date.now() > deadline) {
      server.kill()
      throw new Error(`${entry} did not answer in ${timeout / 1000} s: ${log}`)
    }
    try {
      await (await fetch(base, { signal: AbortSignal.timeout(2_000) })).body?.cancel()
      return { base, stop: () => server.kill() }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}
