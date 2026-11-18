// Uploads a fresh registry build to Cloudflare R2 (docs/registry.md, Hosting), including every
// item version at r/<name>@<version>.json, which is written once and never overwritten.
// Usage: node scripts/registry-publish.ts [--dry-run]
// Credentials come from R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET;
// R2_ENDPOINT overrides https://<account>.r2.cloudflarestorage.com (tests, other S3 stores).
import { spawnSync } from 'node:child_process'
import { createHash, createHmac } from 'node:crypto'
import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const marker = '.heart-ui-registry-build.json'
const contentTypes: Record<string, string> = {
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

class PublishError extends Error {}

type SignRequest = {
  method: string
  url: URL
  headers: Record<string, string>
  body: Buffer | string
}
type Keys = { accessKeyId: string; secretAccessKey: string }

const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex')
const hmac = (key: string | Buffer, data: string) => createHmac('sha256', key).update(data).digest()

/** AWS Signature Version 4 headers for one S3 request (with x-amz-date and the payload hash). */
export function sign(
  request: SignRequest,
  keys: Keys,
  region: string,
  date: Date,
): Record<string, string> {
  const amzDate = date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
  const day = amzDate.slice(0, 8)
  // The hash of the bytes as sent; a string is hashed as UTF-8, which is what fetch sends for it.
  const payload = sha256(request.body)
  const headers: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(request.headers).map(([name, value]) => [name.toLowerCase(), value]),
    ),
    host: request.url.host,
    'x-amz-content-sha256': payload,
    'x-amz-date': amzDate,
  }
  const names = Object.keys(headers).sort()
  const canonical = [
    request.method,
    // The path is sent already encoded once (objectPath), as S3's canonical form wants it.
    request.url.pathname,
    request.url.search.slice(1),
    names.map((name) => `${name}:${headers[name]?.trim()}\n`).join(''),
    names.join(';'),
    payload,
  ].join('\n')
  const scope = `${day}/${region}/s3/aws4_request`
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonical)].join('\n')
  let key: Buffer = hmac(`AWS4${keys.secretAccessKey}`, day)
  for (const part of [region, 's3', 'aws4_request']) key = hmac(key, part)
  const signature = createHmac('sha256', key).update(toSign).digest('hex')
  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${keys.accessKeyId}/${scope},SignedHeaders=${names.join(';')},Signature=${signature}`,
  }
}

/** A key as an S3 path: each segment encoded the way SigV4's UriEncode does it. */
export function objectPath(key: string): string {
  return key
    .split('/')
    .map((segment) =>
      encodeURIComponent(segment).replace(
        /[!'()*]/g,
        (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
      ),
    )
    .join('/')
}

type Upload = { key: string; body: Buffer; type: string; immutable: boolean }

// The CLI's own rule (packages/cli/src/registry.ts): a version the CLI can't fetch is useless.
const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

// The files the build says it wrote, plus each item again under its version; in upload order:
// versions, then the latest items (each after the items it depends on), then the rest, with the
// index last, so nothing ever lists what isn't there yet.
function plan(out: string): Upload[] {
  const recorded = JSON.parse(readFileSync(join(out, marker), 'utf8')) as { files?: unknown }
  if (!Array.isArray(recorded.files)) throw new PublishError(`${marker} lists no files.`)
  const files = (recorded.files as string[]).map((path) => path.split('\\').join('/')).sort()
  const upload = (key: string, body: Buffer, immutable: boolean): Upload => ({
    key,
    body,
    type: contentTypes[extname(key)] ?? 'application/octet-stream',
    immutable,
  })
  const versions: Upload[] = []
  const latest = new Map<string, { upload: Upload; needs: string[] }>()
  const rest: Upload[] = []
  let index: Upload | undefined
  for (const path of files) {
    const body = readFileSync(join(out, path))
    if (path === 'registry.json') index = upload(path, body, false)
    else if (/^r\/[^/@]+\.json$/.test(path)) {
      let item: { meta?: { version?: unknown }; registryDependencies?: unknown }
      try {
        item = JSON.parse(body.toString('utf8')) as typeof item
      } catch {
        throw new PublishError(`${path} is not valid JSON.`)
      }
      const version = item.meta?.version
      if (typeof version !== 'string' || !versionPattern.test(version)) {
        throw new PublishError(`${path} has no meta.version to publish it under.`)
      }
      versions.push(upload(path.replace(/\.json$/, `@${version}.json`), body, true))
      const needs = Array.isArray(item.registryDependencies)
        ? item.registryDependencies.filter((name): name is string => typeof name === 'string')
        : []
      latest.set(path, {
        upload: upload(path, body, false),
        needs: needs.map((n) => `r/${n}.json`),
      })
    } else rest.push(upload(path, body, false))
  }
  const ordered: Upload[] = []
  const placed = new Set<string>()
  const place = (path: string, chain: string[]) => {
    const entry = latest.get(path)
    if (!entry || placed.has(path) || chain.includes(path)) return
    for (const need of entry.needs) place(need, [...chain, path])
    placed.add(path)
    ordered.push(entry.upload)
  }
  for (const path of latest.keys()) place(path, [])
  return [...versions, ...ordered, ...rest, ...(index ? [index] : [])]
}

// Builds into a temp folder with an environment holding no R2 credentials: the build runs
// third-party code that has no use for them.
function build(): { out: string; cleanUp: () => void } {
  const parent = mkdtempSync(join(tmpdir(), 'heart-ui-publish-'))
  const out = join(parent, 'registry')
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.startsWith('R2_')),
  )
  const result = spawnSync(
    process.execPath,
    [join(repo, 'scripts/registry-build.ts'), '--out', out],
    { encoding: 'utf8', env },
  )
  const cleanUp = () => rmSync(parent, { recursive: true, force: true })
  if (result.status !== 0) {
    cleanUp()
    throw new PublishError(`the registry build failed:\n${result.stdout}${result.stderr}`.trimEnd())
  }
  return { out, cleanUp }
}

type Store = { endpoint: string; bucket: string; keys: Keys }

function storeFrom(env: NodeJS.ProcessEnv): Store {
  const names = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']
  const missing = names.filter((name) => !env[name])
  if (missing.length) {
    throw new PublishError(`set ${missing.join(', ')} to publish, or pass --dry-run.`)
  }
  // The id becomes part of the host, so anything else would send signed requests elsewhere.
  if (!/^[0-9a-f]{32}$/.test(env.R2_ACCOUNT_ID ?? '')) {
    throw new PublishError(
      'R2_ACCOUNT_ID must be the 32-character hex id from the Cloudflare dashboard.',
    )
  }
  const endpoint = env.R2_ENDPOINT || `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  return {
    endpoint: endpoint.replace(/\/+$/, ''),
    bucket: env.R2_BUCKET ?? '',
    keys: {
      accessKeyId: env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? '',
    },
  }
}

// The S3 error code (AccessDenied, SignatureDoesNotMatch) tells a signing bug from bad credentials.
async function errorCode(response: Response): Promise<string> {
  const text = await response.text().catch(() => '')
  const code = /<Code>([A-Za-z0-9]+)<\/Code>/.exec(text)?.[1]
  return code ? ` (${code})` : ''
}

async function upload(uploads: Upload[], store: Store) {
  // One request, signed afresh for each attempt; a network failure or a 5xx is tried three times
  // in all, and a request that hangs is cut off after a minute.
  const send = async (method: string, item: Upload, headers: Record<string, string>) => {
    const url = new URL(`${store.endpoint}/${objectPath(store.bucket)}/${objectPath(item.key)}`)
    const body = method === 'PUT' ? item.body : Buffer.alloc(0)
    for (let attempt = 1; ; attempt++) {
      const signed = sign({ method, url, headers, body }, store.keys, 'auto', new Date())
      // fetch sets Host itself from the URL (the value that was signed) and refuses it as a header.
      const sent = Object.fromEntries(Object.entries(signed).filter(([name]) => name !== 'host'))
      let response: Response | undefined
      let cause: unknown
      try {
        response = await fetch(url, {
          method,
          headers: sent,
          body: method === 'PUT' ? new Uint8Array(body) : undefined,
          signal: AbortSignal.timeout(60_000),
        })
      } catch (error) {
        cause =
          (error as { cause?: { code?: unknown } }).cause?.code ??
          (error as { name?: unknown }).name
      }
      if (response && (response.status < 500 || attempt === 3)) return response
      if (!response && attempt === 3) {
        throw new PublishError(
          `could not reach the store for ${item.key}${typeof cause === 'string' ? ` (${cause})` : ''}.`,
        )
      }
      await response?.body?.cancel()
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
    }
  }

  // Every version is checked before anything is written, so one forgotten version bump stops the
  // release before it freezes the others.
  const published = new Set<string>()
  for (const item of uploads.filter((upload) => upload.immutable)) {
    const stored = await send('GET', item, {})
    if (stored.status === 404) {
      await stored.body?.cancel()
      continue
    }
    if (!stored.ok) {
      throw new PublishError(
        `the store answered ${stored.status}${await errorCode(stored)} for ${item.key}.`,
      )
    }
    if (!Buffer.from(await stored.arrayBuffer()).equals(item.body)) {
      throw new PublishError(
        `${item.key} is already published with other content. Bump meta.version in the item's item.json.`,
      )
    }
    published.add(item.key)
  }

  for (const item of uploads) {
    if (published.has(item.key)) {
      process.stdout.write(`skip ${item.key} (already published)\n`)
      continue
    }
    const response = await send('PUT', item, {
      'content-type': item.type,
      // Versions never change; the latest items and the index are re-read soon after a release.
      'cache-control': item.immutable
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=300',
      ...(item.immutable ? { 'if-none-match': '*' } : {}),
    })
    if (response.status === 412 && item.immutable) {
      await response.body?.cancel()
      const stored = await send('GET', item, {})
      if (!stored.ok) {
        throw new PublishError(
          `the store answered ${stored.status}${await errorCode(stored)} for ${item.key}.`,
        )
      }
      // Byte for byte: any change to an item's built JSON, a dependency pin included, needs a
      // new version (docs/registry.md).
      if (!Buffer.from(await stored.arrayBuffer()).equals(item.body)) {
        throw new PublishError(
          `${item.key} is already published with other content. Bump meta.version in the item's item.json.`,
        )
      }
      process.stdout.write(`skip ${item.key} (already published)\n`)
      continue
    }
    if (!response.ok) {
      throw new PublishError(
        `the store answered ${response.status}${await errorCode(response)} for ${item.key}.`,
      )
    }
    await response.body?.cancel()
    process.stdout.write(`put ${item.key}\n`)
  }
}

async function main(args: string[]) {
  const unknown = args.filter((arg) => arg !== '--dry-run')
  if (unknown.length) throw new PublishError(`unknown argument ${unknown[0]}; use [--dry-run]`)
  const dryRun = args.includes('--dry-run')
  // Checked before the build, so a misconfigured publish fails at once.
  const store = dryRun ? undefined : storeFrom(process.env)
  const { out, cleanUp } = build()
  try {
    const uploads = plan(out)
    if (!store) {
      process.stdout.write(
        uploads
          .map(
            (item) =>
              `put ${item.key} ${item.body.length} bytes ${item.immutable ? 'immutable' : 'latest'}\n`,
          )
          .join(''),
      )
      return
    }
    await upload(uploads, store)
  } finally {
    cleanUp()
  }
}

// Compared as real paths: started through a link (a symlinked checkout, /tmp on macOS), the paths
// differ and the publish would silently do nothing.
const isEntry = (() => {
  try {
    return realpathSync(process.argv[1] ?? '') === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
})()

if (isEntry) {
  // A reader that stops early (`| head`) is done reading, not a failure.
  process.stdout.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EPIPE') process.exit(0)
    throw error
  })
  main(process.argv.slice(2)).catch((error: unknown) => {
    const message =
      error instanceof PublishError
        ? error.message
        : `unexpected error: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`
    process.stderr.write(`registry-publish: ${message}\n`)
    process.exitCode = 1
  })
}
