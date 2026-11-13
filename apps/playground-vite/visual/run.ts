// Runs the visual tests against a browser in the official Playwright container, so screenshots
// match on every machine and in CI. `--update` regenerates baselines (human approval required).
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'
import { freePort } from '../../test-utils.ts'

// The image is pinned by digest: a re-pushed tag must not change how baselines render.
// Upgrading Playwright means pulling the new tag and copying its digest here.
const pinned = {
  version: '1.65.0',
  digest: 'sha256:9beb546099e11f52d62e505537914870e01a67e0e6b00ae41da4775324e73dbe',
}

const app = join(import.meta.dirname, '..')
const require = createRequire(join(app, 'package.json'))
const corePackage = createRequire(require.resolve('playwright/package.json')).resolve(
  'playwright-core/package.json',
)
const { version } = JSON.parse(readFileSync(corePackage, 'utf8')) as { version: string }
const args = process.argv.slice(2).map((arg) => (arg === '--update' ? '--update-snapshots' : arg))

function fail(message: string): never {
  console.error(`test:visual: ${message}`)
  process.exit(1)
}

function docker(...dockerArgs: string[]) {
  return execFileSync('docker', dockerArgs, { encoding: 'utf8' }).trim()
}

if (version !== pinned.version) {
  fail(`Playwright is ${version} but run.ts pins the ${pinned.version} image; update its digest`)
}
try {
  docker('info', '--format', '{{.ServerVersion}}')
} catch {
  fail('Docker is not running; start it, then run pnpm test:visual again')
}

// Docker Desktop forwards host.docker.internal to the host's loopback; on Linux it is the
// bridge gateway. Preview binds there only, not to every interface.
const previewHost =
  process.platform === 'linux'
    ? docker('network', 'inspect', 'bridge', '--format', '{{(index .IPAM.Config 0).Gateway}}')
    : '127.0.0.1'

// The container runs the lockfile's playwright-core, mounted read-only: nothing is fetched.
const container = docker(
  'run',
  '-d',
  '--rm',
  '--init',
  // Chromium needs a larger /dev/shm than Docker's 64 MB; this avoids sharing the host's IPC.
  '--shm-size=1g',
  // One platform for every machine: an arm Mac would otherwise render the arm64 image.
  '--platform',
  'linux/amd64',
  '-p',
  '127.0.0.1::3000',
  '--add-host=host.docker.internal:host-gateway',
  '-v',
  `${dirname(corePackage)}:/playwright-core:ro`,
  `mcr.microsoft.com/playwright@${pinned.digest}`,
  'node',
  '/playwright-core/cli.js',
  'run-server',
  '--port',
  '3000',
  '--host',
  '0.0.0.0',
)
let status = 1
const stopContainer = () => spawnSync('docker', ['stop', '-t', '1', container], { stdio: 'ignore' })
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    stopContainer()
    process.exit(130)
  })
}
try {
  const browserPort = docker('port', container, '3000/tcp').split('\n')[0]!.split(':').pop()
  const wsEndpoint = `ws://127.0.0.1:${browserPort}/`
  // Docker's port proxy accepts TCP before the server inside listens, so wait for a real connect.
  const deadline = Date.now() + 60_000
  for (;;) {
    try {
      await (await chromium.connect(wsEndpoint, { timeout: 5_000 })).close()
      break
    } catch (error) {
      const running = spawnSync('docker', ['inspect', '-f', '{{.State.Running}}', container], {
        encoding: 'utf8',
      }).stdout.trim()
      if (running !== 'true')
        throw new Error('the browser container stopped before it served', { cause: error })
      if (Date.now() > deadline)
        throw new Error(`no browser server in the container: ${(error as Error).message}`, {
          cause: error,
        })
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  const result = spawnSync(
    'pnpm',
    ['exec', 'playwright', 'test', '-c', 'visual/playwright.config.ts', ...args],
    {
      cwd: app,
      stdio: 'inherit',
      env: {
        ...process.env,
        TREVUI_VISUAL_WS: wsEndpoint,
        TREVUI_VISUAL_HOST: previewHost,
        TREVUI_VISUAL_PORT: String(await freePort()),
      },
    },
  )
  status = result.status ?? 1
} catch (error) {
  console.error(`test:visual: ${(error as Error).message}`)
} finally {
  stopContainer()
}
process.exit(status)
