import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createServer, type IncomingHttpHeaders, type Server } from 'node:http'
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { objectPath, sign } from '../scripts/registry-publish.ts'

const root = join(import.meta.dirname, '..')
const script = join(root, 'scripts/registry-publish.ts')
// Placeholders: the fake store below checks the header's shape, not the signature.
const credentials = {
  R2_ACCOUNT_ID: '0123456789abcdef0123456789abcdef',
  R2_ACCESS_KEY_ID: 'test-access-key',
  R2_SECRET_ACCESS_KEY: 'test-secret-value',
  R2_BUCKET: 'heart-ui',
}

// Async: the fake store runs in this process and must keep answering.
function publish(args: string[], env: Record<string, string | undefined> = {}, entry = script) {
  return new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(process.execPath, [entry, ...args], {
      cwd: root,
      env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env },
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk))
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk))
    child.once('close', (status) => resolve({ status, stdout, stderr }))
  })
}

type Stored = { body: string; type: string | undefined }
// An S3-compatible store: path-style keys, conditional PUT with If-None-Match: *, GET.
function store(refuse?: (key: string, method: string) => number | undefined) {
  const objects = new Map<string, Stored>()
  const requests: { method: string; key: string; headers: IncomingHttpHeaders }[] = []
  const server: Server = createServer((request, response) => {
    const key = decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname).replace(
      /^\/heart-ui\//,
      '',
    )
    requests.push({ method: request.method ?? '', key, headers: request.headers })
    const refused = refuse?.(key, request.method ?? '')
    if (refused) {
      return response
        .writeHead(refused, { 'content-type': 'application/xml' })
        .end('<?xml version="1.0"?><Error><Code>AccessDenied</Code><Message>no</Message></Error>')
    }
    if (request.method === 'GET') {
      const object = objects.get(key)
      if (!object) return response.writeHead(404).end()
      return response.writeHead(200).end(object.body)
    }
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const bytes = Buffer.concat(chunks)
      const body = bytes.toString('utf8')
      // As S3 does: the signed payload hash must be the hash of the bytes received.
      if (
        request.headers['x-amz-content-sha256'] !== createHash('sha256').update(bytes).digest('hex')
      ) {
        return response.writeHead(400).end('<Error><Code>XAmzContentSHA256Mismatch</Code></Error>')
      }
      if (request.headers['if-none-match'] === '*' && objects.has(key)) {
        return response.writeHead(412).end()
      }
      objects.set(key, { body, type: request.headers['content-type'] })
      response.writeHead(200).end()
    })
  })
  return new Promise<{
    objects: typeof objects
    requests: typeof requests
    endpoint: string
    server: Server
  }>((resolve) =>
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({ objects, requests, endpoint: `http://127.0.0.1:${port}`, server })
    }),
  )
}

const servers: Server[] = []
afterEach(() => {
  for (const server of servers.splice(0)) server.close()
})

type Line = { key: string; bytes: number; kind: string }
const parse = (stdout: string): Line[] =>
  stdout
    .trimEnd()
    .split('\n')
    .map((line) => {
      const [, key = '', bytes = '0', kind = ''] = /^put (\S+) (\d+) bytes (\w+)$/.exec(line) ?? []
      return { key, bytes: Number(bytes), kind }
    })

describe('AC-001 dry run', () => {
  it('lists every object in upload order and needs no credentials', async () => {
    const result = await publish(['--dry-run'])
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    const lines = parse(result.stdout)
    const keys = lines.map((line) => line.key)
    expect(keys.every(Boolean)).toBe(true)
    const versioned = keys.filter((key) =>
      /^r\/[^/]+@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\.json$/.test(key),
    )
    const latest = keys.filter((key) => /^r\/[^@/]+\.json$/.test(key))
    expect(versioned.length).toBeGreaterThan(0)
    expect(versioned.length).toBe(latest.length)
    expect(keys.slice(0, versioned.length)).toEqual(versioned)
    expect(keys.slice(versioned.length, versioned.length + latest.length)).toEqual(latest)
    expect(keys.at(-1)).toBe('registry.json')
    expect(keys).toContain('r/button.json')
    expect(keys.some((key) => key.includes('.heart-ui-registry-build'))).toBe(false)
    for (const line of lines) {
      expect(line.kind).toBe(versioned.includes(line.key) ? 'immutable' : 'latest')
      expect(line.bytes).toBeGreaterThan(0)
    }
  })
})

describe('AC-002 upload', () => {
  it('stores every listed object with its content type, and each version beside its item', async () => {
    const s3 = await store()
    servers.push(s3.server)
    const listed = parse((await publish(['--dry-run'])).stdout).map((line) => line.key)
    const result = await publish([], { ...credentials, R2_ENDPOINT: s3.endpoint })
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    expect([...s3.objects.keys()].sort()).toEqual([...listed].sort())
    const button = JSON.parse(s3.objects.get('r/button.json')?.body ?? '{}') as {
      meta: { version: string }
    }
    expect(s3.objects.get(`r/button@${button.meta.version}.json`)?.body).toBe(
      s3.objects.get('r/button.json')?.body,
    )
    expect(s3.objects.get('registry.json')?.type).toBe('application/json')
    const puts = s3.requests.filter((request) => request.method === 'PUT').map((r) => r.key)
    expect(puts.at(-1)).toBe('registry.json')
    for (const request of s3.requests) {
      expect(request.headers.authorization).toMatch(
        /^AWS4-HMAC-SHA256 Credential=test-access-key\/\d{8}\/auto\/s3\/aws4_request,SignedHeaders=[a-z0-9;-]+,Signature=[0-9a-f]{64}$/,
      )
    }
    expect(`${result.stdout}${result.stderr}`).not.toContain(credentials.R2_SECRET_ACCESS_KEY)
  })
})

describe('AC-003 immutable versions', () => {
  it('skips a version already published with the same content', async () => {
    const s3 = await store()
    servers.push(s3.server)
    const env = { ...credentials, R2_ENDPOINT: s3.endpoint }
    expect((await publish([], env)).status).toBe(0)
    const again = await publish([], env)
    expect(again.stderr).toBe('')
    expect(again.status).toBe(0)
    expect(again.stdout).toMatch(/^skip r\/button@\S+\.json \(already published\)$/m)
  })

  it('refuses a version published with other content and leaves it alone', async () => {
    const s3 = await store()
    servers.push(s3.server)
    const env = { ...credentials, R2_ENDPOINT: s3.endpoint }
    expect((await publish([], env)).status).toBe(0)
    const key = [...s3.objects.keys()].find((name) => /^r\/button@/.test(name)) ?? ''
    s3.objects.set(key, { body: '{"tampered":true}', type: 'application/json' })
    const result = await publish([], env)
    expect(result.status).toBe(1)
    expect(result.stderr).toBe(
      `registry-publish: ${key} is already published with other content. Bump meta.version in the item's item.json.\n`,
    )
    expect(s3.objects.get(key)?.body).toBe('{"tampered":true}')
  })
})

describe('AC-004 signing', () => {
  const request = {
    method: 'PUT',
    url: new URL('https://account.r2.cloudflarestorage.com/heart-ui/r/button%400.1.0.json'),
    headers: { 'content-type': 'application/json', 'if-none-match': '*' },
    body: '{"name":"button"}',
  }
  const keys = { accessKeyId: 'test-access-key', secretAccessKey: 'test-secret-value' }
  const date = new Date('2026-11-19T04:00:00Z')
  const signature = (headers: Record<string, string>) =>
    /Signature=([0-9a-f]+)$/.exec(headers.authorization ?? '')?.[1]

  it('names the key, date, region, service and signed headers', () => {
    const headers = sign(request, keys, 'auto', date)
    expect(headers.authorization).toBe(
      `AWS4-HMAC-SHA256 Credential=test-access-key/20261119/auto/s3/aws4_request,SignedHeaders=content-type;host;if-none-match;x-amz-content-sha256;x-amz-date,Signature=${signature(headers)}`,
    )
    expect(signature(headers)).toMatch(/^[0-9a-f]{64}$/)
    expect(headers['x-amz-date']).toBe('20261119T040000Z')
    expect(headers['x-amz-content-sha256']).toMatch(/^[0-9a-f]{64}$/)
  })

  it('signs the same request the same, and changes with every signed input', () => {
    const base = signature(sign(request, keys, 'auto', date))
    expect(signature(sign(request, keys, 'auto', date))).toBe(base)
    const variants = [
      sign(request, { ...keys, secretAccessKey: 'other' }, 'auto', date),
      sign({ ...request, body: '{}' }, keys, 'auto', date),
      sign(
        {
          ...request,
          url: new URL('https://account.r2.cloudflarestorage.com/heart-ui/r/card.json'),
        },
        keys,
        'auto',
        date,
      ),
      sign(
        { ...request, headers: { ...request.headers, 'content-type': 'text/plain' } },
        keys,
        'auto',
        date,
      ),
      sign(request, keys, 'auto', new Date('2026-11-20T04:00:00Z')),
    ]
    for (const headers of variants) expect(signature(headers)).not.toBe(base)
  })
})

describe('AC-005 failures', () => {
  it('names the missing variables before any upload', async () => {
    const result = await publish([], { R2_BUCKET: 'heart-ui' })
    expect(result.status).toBe(1)
    expect(result.stderr).toBe(
      'registry-publish: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY to publish, or pass --dry-run.\n',
    )
  })

  it('names the key and status a store refuses', async () => {
    const s3 = await store((key) => (key === 'r/card.json' ? 403 : undefined))
    servers.push(s3.server)
    const result = await publish([], { ...credentials, R2_ENDPOINT: s3.endpoint })
    expect(result.status).toBe(1)
    expect(result.stderr).toBe(
      'registry-publish: the store answered 403 (AccessDenied) for r/card.json.\n',
    )
    expect(s3.objects.has('registry.json')).toBe(false)
  })
})

describe('AC-004 bytes, keys and endpoints', () => {
  it('hashes the exact bytes it sends, not a re-encoding', () => {
    const body = Buffer.from('{"label":"Close — ×"}', 'utf8')
    const headers = sign(
      {
        method: 'PUT',
        url: new URL('https://account.r2.cloudflarestorage.com/heart-ui/x.json'),
        headers: {},
        body,
      },
      { accessKeyId: 'test-access-key', secretAccessKey: 'test-secret-value' },
      'auto',
      new Date('2026-11-19T04:00:00Z'),
    )
    expect(headers['x-amz-content-sha256']).toBe(createHash('sha256').update(body).digest('hex'))
  })

  it.each([
    ['r/button@0.1.0.json', 'r/button%400.1.0.json'],
    ["r/a(b)*!'.json", 'r/a%28b%29%2A%21%27.json'],
    ['docs/a b.md', 'docs/a%20b.md'],
  ])('encodes the key %s as S3 does', (key, path) => {
    expect(objectPath(key)).toBe(path)
  })
})

describe('AC-005 configuration and network failures', () => {
  it('refuses an account id that is not one', async () => {
    const result = await publish([], { ...credentials, R2_ACCOUNT_ID: 'evil.example/' })
    expect(result.status).toBe(1)
    expect(result.stderr).toBe(
      'registry-publish: R2_ACCOUNT_ID must be the 32-character hex id from the Cloudflare dashboard.\n',
    )
  })

  it('names the cause when the store cannot be reached', async () => {
    // A port just freed, so nothing answers (fetch refuses well-known ports such as 1 outright).
    const closed = await new Promise<number>((resolve) => {
      const probe = createServer().listen(0, '127.0.0.1', () => {
        const address = probe.address()
        probe.close(() => resolve(typeof address === 'object' && address ? address.port : 0))
      })
    })
    const result = await publish([], { ...credentials, R2_ENDPOINT: `http://127.0.0.1:${closed}` })
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(
      /^registry-publish: could not reach the store for r\/\S+ \(ECONNREFUSED\)\.\n$/,
    )
  })

  it('accepts an endpoint with a trailing slash', async () => {
    const s3 = await store()
    servers.push(s3.server)
    const result = await publish([], { ...credentials, R2_ENDPOINT: `${s3.endpoint}/` })
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    expect(s3.objects.has('registry.json')).toBe(true)
  })
})

describe('AC-001 run through a link', () => {
  it('still runs when started through a symlinked path', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'heart-ui-publish-link-'))
    try {
      const link = join(dir, 'registry-publish.ts')
      symlinkSync(script, link)
      const result = await publish(['--dry-run'], {}, link)
      expect(result.status).toBe(0)
      expect(result.stdout).toContain('put registry.json')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('AC-003 conflicts before any write', () => {
  it('writes nothing when one version conflicts, even ones that come before it', async () => {
    const s3 = await store()
    servers.push(s3.server)
    const env = { ...credentials, R2_ENDPOINT: s3.endpoint }
    const keys = parse((await publish(['--dry-run'])).stdout).map((line) => line.key)
    const last = keys.filter((key) => key.includes('@')).at(-1) ?? ''
    s3.objects.set(last, { body: '{"other":true}', type: 'application/json' })
    const result = await publish([], env)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(`${last} is already published with other content`)
    expect([...s3.objects.keys()]).toEqual([last])
  })
})

describe('AC-002 order and retries', () => {
  it('uploads latest items after the items they depend on', async () => {
    const s3 = await store()
    servers.push(s3.server)
    expect((await publish([], { ...credentials, R2_ENDPOINT: s3.endpoint })).status).toBe(0)
    const puts = s3.requests.filter((r) => r.method === 'PUT').map((r) => r.key)
    const at = (key: string) => puts.indexOf(key)
    for (const dependency of ['r/utils.json', 'r/icon.json']) {
      expect(at(dependency)).toBeGreaterThan(-1)
      expect(at(dependency)).toBeLessThan(at('r/button.json'))
    }
    expect(at('r/button.json')).toBeLessThan(at('r/dialog.json'))
  })

  it('retries a request the store answers with 503 once', async () => {
    let failed = false
    const s3 = await store((key, method) => {
      if (key === 'r/card.json' && method === 'PUT' && !failed) {
        failed = true
        return 503
      }
      return undefined
    })
    servers.push(s3.server)
    const result = await publish([], { ...credentials, R2_ENDPOINT: s3.endpoint })
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    expect(s3.objects.has('r/card.json')).toBe(true)
  })
})
