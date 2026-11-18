import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CliError } from '../src/errors.ts'
import { createRegistryClient, defaultCacheDir } from '../src/registry.ts'

const registries = {
  '@heart-ui': 'https://ui.example.com/r/{name}.json',
  '@acme': 'https://acme.example.com/items/{name}.json',
}

const item = (name: string, content = '<template />') => ({
  name,
  type: 'registry:ui',
  files: [{ path: `registry/ui/${name}/X.vue`, type: 'registry:ui', content }],
})

type Answer = Response | Error | (() => Response)
function fakeFetch(answers: Answer[]) {
  const calls: string[] = []
  const fetch = async (input: string | URL | Request) => {
    calls.push(String(input))
    const answer = answers.shift()
    if (!answer) throw new Error(`unexpected fetch of ${String(input)}`)
    if (answer instanceof Error) throw answer
    return typeof answer === 'function' ? answer() : answer
  }
  return { fetch: fetch as typeof globalThis.fetch, calls }
}
const json = (value: unknown, status = 200) =>
  new Response(typeof value === 'string' ? value : JSON.stringify(value), { status })

let cacheDir: string
let warnings: string[]
beforeEach(() => {
  cacheDir = mkdtempSync(join(tmpdir(), 'heart-ui-cache-'))
  warnings = []
})
afterEach(() => rmSync(cacheDir, { recursive: true, force: true }))

const client = (fetch: typeof globalThis.fetch, dir = cacheDir) =>
  createRegistryClient({ registries, cacheDir: dir, fetch, onWarn: (m) => warnings.push(m) })

const failure = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('expected a failure')
    },
    (e: unknown) => {
      expect(e).toBeInstanceOf(CliError)
      return (e as Error).message
    },
  )

describe('AC-009 fetching items', () => {
  it('fetches an unscoped name from @heart-ui', async () => {
    const f = fakeFetch([json(item('button'))])
    expect(await client(f.fetch).fetchItem('button')).toEqual(item('button'))
    expect(f.calls).toEqual(['https://ui.example.com/r/button.json'])
  })

  it('fetches a scoped name from its registry', async () => {
    const f = fakeFetch([json(item('data-grid'))])
    expect((await client(f.fetch).fetchItem('@acme/data-grid')).name).toBe('data-grid')
    expect(f.calls).toEqual(['https://acme.example.com/items/data-grid.json'])
  })

  it('fetches a pinned version', async () => {
    const f = fakeFetch([json(item('button'))])
    await client(f.fetch).fetchItem('button', '0.1.0')
    expect(f.calls).toEqual(['https://ui.example.com/r/button@0.1.0.json'])
  })

  it('names an unknown registry', async () => {
    const f = fakeFetch([])
    expect(await failure(client(f.fetch).fetchItem('@nope/x'))).toBe(
      'Unknown registry "@nope". Add it under "registries" in heart-ui.json.',
    )
  })

  it('reports an item that does not exist', async () => {
    const f = fakeFetch([json('Not found', 404)])
    expect(await failure(client(f.fetch).fetchItem('buton'))).toBe(
      'Item "buton" not found in @heart-ui (https://ui.example.com/r/buton.json).',
    )
  })

  it('reports a client error status', async () => {
    const f = fakeFetch([json('nope', 403)])
    expect(await failure(client(f.fetch).fetchItem('button'))).toBe(
      '@heart-ui answered 403 for https://ui.example.com/r/button.json.',
    )
  })

  it.each([
    ['text that is not JSON', 'not json'],
    ['an array', []],
    ['another item', item('card')],
    ['an item without files', { name: 'button', type: 'registry:ui' }],
    [
      'a file without content',
      { ...item('button'), files: [{ path: 'a.vue', type: 'registry:ui' }] },
    ],
  ])('rejects %s', async (_, body) => {
    const f = fakeFetch([json(body)])
    const message = await failure(client(f.fetch).fetchItem('button'))
    expect(message).toBe('@heart-ui sent an invalid item for "button".')
  })

  it.each(['../etc/passwd', 'Button', '@acme/', '', 'a b', 'a/b', '@acme/a/b', 'x?y=1'])(
    'rejects the name %j',
    async (name) => {
      const f = fakeFetch([])
      expect(await failure(client(f.fetch).fetchItem(name))).toBe(
        `"${name}" is not a valid item name.`,
      )
      expect(f.calls).toEqual([])
    },
  )

  it.each(['1.0', 'latest', '1.0.0/../x', '../1.0.0'])(
    'rejects the version %j',
    async (version) => {
      const f = fakeFetch([])
      expect(await failure(client(f.fetch).fetchItem('button', version))).toBe(
        `"${version}" is not a valid version.`,
      )
      expect(f.calls).toEqual([])
    },
  )
})

describe('AC-010 the on-disk cache', () => {
  it('serves a cached item with a warning when the network fails', async () => {
    const f = fakeFetch([json(item('button')), new TypeError('fetch failed')])
    const c = client(f.fetch)
    await c.fetchItem('button')
    expect(await c.fetchItem('button')).toEqual(item('button'))
    expect(warnings).toEqual(['Could not reach @heart-ui; using the cached copy of "button".'])
  })

  it('serves a cached item when the server answers 5xx', async () => {
    const f = fakeFetch([json(item('button')), json('down', 503)])
    const c = client(f.fetch)
    await c.fetchItem('button')
    expect(await c.fetchItem('button')).toEqual(item('button'))
    expect(warnings).toHaveLength(1)
  })

  it('refreshes the cache on each fetch while online', async () => {
    const f = fakeFetch([
      json(item('button', 'v1')),
      json(item('button', 'v2')),
      new TypeError('fetch failed'),
    ])
    const c = client(f.fetch)
    await c.fetchItem('button')
    await c.fetchItem('button')
    expect((await c.fetchItem('button')).files[0]?.content).toBe('v2')
  })

  it('serves a pinned version from the cache without the network', async () => {
    const f = fakeFetch([json(item('button'))])
    const c = client(f.fetch)
    await c.fetchItem('button', '0.1.0')
    expect(await c.fetchItem('button', '0.1.0')).toEqual(item('button'))
    expect(f.calls).toHaveLength(1)
    expect(warnings).toEqual([])
  })

  it('keeps registries apart in the cache', async () => {
    const f = fakeFetch([json(item('button', 'ours')), json(item('button', 'theirs'))])
    const c = client(f.fetch)
    await c.fetchItem('button', '1.0.0')
    expect((await c.fetchItem('@acme/button', '1.0.0')).files[0]?.content).toBe('theirs')
  })

  it('fetches again over a corrupt cache entry', async () => {
    const f = fakeFetch([json(item('button')), json(item('button'))])
    const c = client(f.fetch)
    await c.fetchItem('button', '0.1.0')
    for (const file of readdirSync(cacheDir)) writeFileSync(join(cacheDir, file), '{ broken')
    expect(await c.fetchItem('button', '0.1.0')).toEqual(item('button'))
    expect(f.calls).toHaveLength(2)
  })

  it('does not fail the fetch when the cache cannot be written', async () => {
    const blocked = join(cacheDir, 'a-file')
    writeFileSync(blocked, '')
    const f = fakeFetch([json(item('button'))])
    expect(await client(f.fetch, blocked).fetchItem('button')).toEqual(item('button'))
    expect(warnings).toEqual([`Could not write the cache in ${blocked}.`])
  })

  it('fails clearly offline with nothing cached', async () => {
    const f = fakeFetch([new TypeError('fetch failed')])
    expect(await failure(client(f.fetch).fetchItem('button'))).toBe(
      'Could not reach @heart-ui (https://ui.example.com/r/button.json). Check your connection.',
    )
  })

  it('fails clearly on a 5xx with nothing cached', async () => {
    const f = fakeFetch([json('down', 502)])
    expect(await failure(client(f.fetch).fetchItem('button'))).toBe(
      '@heart-ui answered 502 for https://ui.example.com/r/button.json.',
    )
  })

  it('defaults to XDG_CACHE_HOME, else ~/.cache', () => {
    expect(defaultCacheDir({ XDG_CACHE_HOME: '/x/cache' })).toBe(join('/x/cache', 'heart-ui'))
    expect(defaultCacheDir({})).toBe(join(homedir(), '.cache', 'heart-ui'))
  })
})

describe('AC-009 untrusted items and URLs', () => {
  const file = (extra: Record<string, unknown>) => ({
    ...item('button'),
    files: [{ path: 'registry/ui/button/X.vue', type: 'registry:ui', content: '', ...extra }],
  })

  it.each([
    ['a path climbing out', file({ path: '../../.bashrc' })],
    ['a path climbing out with backslashes', file({ path: 'a\\..\\..\\b' })],
    ['an absolute path', file({ path: '/etc/passwd' })],
    ['a Windows absolute path', file({ path: 'C:\\x\\y.vue' })],
    ['an empty path', file({ path: '' })],
    ['a numeric target', file({ target: 1 })],
    ['a target climbing out', file({ target: 'app/../../x.vue' })],
    ['a numeric title', { ...item('button'), title: 1 }],
    ['a numeric description', { ...item('button'), description: [] }],
    ['a meta that is not an object', { ...item('button'), meta: 'x' }],
    ['dependencies that are not strings', { ...item('button'), dependencies: [1] }],
  ])('rejects %s', async (_, body) => {
    const f = fakeFetch([json(body)])
    expect(await failure(client(f.fetch).fetchItem('button'))).toBe(
      '@heart-ui sent an invalid item for "button".',
    )
  })

  it('accepts a target relative to the project root', async () => {
    const body = file({ target: '~/app/components/X.vue' })
    const f = fakeFetch([json(body)])
    expect(await client(f.fetch).fetchItem('button')).toEqual(body)
  })

  const redirect = (location: string, status = 302) =>
    new Response(null, { status, headers: { location } })

  it('refuses a redirect to plain http without requesting it', async () => {
    const f = fakeFetch([redirect('http://evil.example.com/button.json')])
    expect(await failure(client(f.fetch).fetchItem('button'))).toBe(
      '@heart-ui redirected to http://evil.example.com/button.json, which is not https.',
    )
    expect(f.calls).toEqual(['https://ui.example.com/r/button.json'])
  })

  it('follows https redirects, checking every hop', async () => {
    const f = fakeFetch([redirect('/v2/button.json', 301), json(item('button'))])
    expect(await client(f.fetch).fetchItem('button')).toEqual(item('button'))
    expect(f.calls).toEqual([
      'https://ui.example.com/r/button.json',
      'https://ui.example.com/v2/button.json',
    ])
  })

  it('stops after too many redirects', async () => {
    const f = fakeFetch(Array.from({ length: 6 }, () => redirect('/loop.json')))
    expect(await failure(client(f.fetch).fetchItem('button'))).toBe(
      '@heart-ui redirected too many times for https://ui.example.com/r/button.json.',
    )
  })

  it('hides query strings in messages', async () => {
    const f = fakeFetch([json('nope', 404)])
    const c = createRegistryClient({
      registries: { '@heart-ui': 'https://ui.example.com/r/{name}.json?token=abc' },
      cacheDir,
      fetch: f.fetch,
    })
    const message = await failure(c.fetchItem('button'))
    expect(message).toBe(
      'Item "button" not found in @heart-ui (https://ui.example.com/r/button.json).',
    )
    expect(f.calls).toEqual(['https://ui.example.com/r/button.json?token=abc'])
  })

  it('refuses a body larger than 5 MB', async () => {
    const f = fakeFetch([json('x'.repeat(5 * 1024 * 1024 + 1))])
    expect(await failure(client(f.fetch).fetchItem('button'))).toBe(
      '@heart-ui sent more than 5 MB for "button".',
    )
  })
})

describe('AC-010 cache fallbacks', () => {
  it('serves the cached copy when a 200 is not an item, as a captive portal sends', async () => {
    const f = fakeFetch([json(item('button')), json('<html>Sign in</html>')])
    const c = client(f.fetch)
    await c.fetchItem('button')
    expect(await c.fetchItem('button')).toEqual(item('button'))
    expect(warnings).toEqual([
      '@heart-ui sent an invalid item for "button"; using the cached copy.',
    ])
  })

  it('names the status in the warning for a 5xx', async () => {
    const f = fakeFetch([json(item('button')), json('down', 503)])
    const c = client(f.fetch)
    await c.fetchItem('button')
    await c.fetchItem('button')
    expect(warnings).toEqual(['@heart-ui answered 503; using the cached copy of "button".'])
  })

  it('ignores a relative XDG_CACHE_HOME', () => {
    expect(defaultCacheDir({ XDG_CACHE_HOME: 'cache' })).toBe(join(homedir(), '.cache', 'heart-ui'))
  })
})

describe('AC-009 sensitive targets and fetch errors', () => {
  it.each([
    ['the project root itself', '~/'],
    ['a git hook', '~/.git/hooks/post-checkout'],
    ['a nested .git folder', 'app/.git/config'],
    ['a package binary', '~/node_modules/.bin/vite'],
  ])('rejects a target that is %s', async (_, target) => {
    const body = {
      ...item('button'),
      files: [{ path: 'registry/ui/button/X.vue', type: 'registry:ui', content: '', target }],
    }
    const f = fakeFetch([json(body)])
    expect(await failure(client(f.fetch).fetchItem('button'))).toBe(
      '@heart-ui sent an invalid item for "button".',
    )
  })

  it('reports a fetch error that is not a network failure as unexpected, without the cache', async () => {
    const f = fakeFetch([json(item('button')), new RangeError('bad header')])
    const c = client(f.fetch)
    await c.fetchItem('button')
    await expect(c.fetchItem('button')).rejects.toThrow(RangeError)
    expect(warnings).toEqual([])
  })

  it('treats a timeout as a network failure', async () => {
    const timeout = new DOMException('The operation timed out.', 'TimeoutError')
    const f = fakeFetch([json(item('button')), timeout])
    const c = client(f.fetch)
    await c.fetchItem('button')
    expect(await c.fetchItem('button')).toEqual(item('button'))
    expect(warnings).toHaveLength(1)
  })

  it('names the size limit when it serves the cache for a large answer', async () => {
    const f = fakeFetch([json(item('button')), json('x'.repeat(5 * 1024 * 1024 + 1))])
    const c = client(f.fetch)
    await c.fetchItem('button')
    await c.fetchItem('button')
    expect(warnings).toEqual(['@heart-ui sent more than 5 MB for "button"; using the cached copy.'])
  })
})
