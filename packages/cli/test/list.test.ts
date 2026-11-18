import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { run } from '../src/cli.ts'
import { createList } from '../src/commands/list.ts'
import { DEFAULT_REGISTRY_URL } from '../src/registry.ts'
import { buildRegistry, capture, copyFixture } from './helpers/project.ts'

type IndexItem = { name: string; type: string; description?: string; categories?: string[] }
type Index = { items: IndexItem[] }

let out: string
let index: Index
beforeAll(() => {
  out = buildRegistry()
  index = JSON.parse(readFileSync(join(out, 'registry.json'), 'utf8')) as Index
}, 120_000)
afterAll(() => rmSync(dirname(out), { recursive: true, force: true }))

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(dirname(root), { recursive: true, force: true })
})

type Answer = unknown | Error
// Serves the index (or the given answers in turn) at any URL and records the URLs asked for.
function serve(...answers: Answer[]) {
  const calls: string[] = []
  const fetch = (async (input: string | URL | Request) => {
    calls.push(String(input))
    const answer = answers.length ? answers.shift() : index
    if (answer instanceof Error) throw answer
    if (answer instanceof Response) return answer
    return new Response(typeof answer === 'string' ? answer : JSON.stringify(answer))
  }) as typeof globalThis.fetch
  return { fetch, calls }
}

function project(withConfig = true) {
  const root = copyFixture('init-vite')
  roots.push(root)
  if (withConfig) {
    writeFileSync(
      join(root, 'heart-ui.json'),
      JSON.stringify({
        framework: 'vite',
        css: 'src/assets/css/theme.css',
        aliases: {
          ui: '@/components/ui',
          blocks: '@/components/blocks',
          layouts: '@/layouts',
          lib: '@/lib',
        },
        iconSet: 'fluent',
        registries: { '@heart-ui': 'https://registry.test/r/{name}.json' },
      }),
    )
  }
  return root
}

async function list(
  argv: string[],
  fetch: typeof globalThis.fetch,
  root = project(),
  cacheDir?: string,
) {
  const c = capture(root)
  const cache = cacheDir ?? mkdtempSync(join(dirname(out), 'cache-'))
  const code = await run(['list', ...argv], c.io, { list: createList({ fetch, cacheDir: cache }) })
  return { code, out: c.out(), err: c.err() }
}

describe('AC-001 the item table', () => {
  it('prints one line per item: name, type, description, in index order', async () => {
    const result = await list([], serve().fetch)
    expect(result.code).toBe(0)
    const lines = result.out.trimEnd().split('\n')
    expect(lines).toHaveLength(index.items.length)
    index.items.forEach((item, i) => {
      expect(lines[i]).toMatch(
        new RegExp(`^${item.name}\\s+${item.type.replace('registry:', '')}\\s+`),
      )
      expect(lines[i]).toContain(item.description ?? '')
    })
  })
})

describe('AC-002 JSON output', () => {
  it('prints the index items as JSON', async () => {
    const result = await list(['--json'], serve().fetch)
    expect(result.code).toBe(0)
    expect(JSON.parse(result.out)).toEqual(index.items)
  })
})

describe('AC-003 filters', () => {
  const sample: Index = {
    items: [
      { name: 'button', type: 'registry:ui', description: 'B', categories: ['actions'] },
      { name: 'utils', type: 'registry:lib', description: 'U' },
      {
        name: 'menu',
        type: 'registry:ui',
        description: 'M',
        categories: ['navigation', 'actions'],
      },
      { name: 'shell', type: 'registry:block', description: 'S', categories: ['layout'] },
    ],
  }
  const names = async (argv: string[]) => {
    const result = await list(['--json', ...argv], serve(sample).fetch)
    return (JSON.parse(result.out) as IndexItem[]).map((item) => item.name)
  }

  it.each([
    [
      ['--type', 'ui'],
      ['button', 'menu'],
    ],
    [['--type', 'registry:lib'], ['utils']],
    [
      ['--category', 'actions'],
      ['button', 'menu'],
    ],
    [['--type', 'block', '--category', 'layout'], ['shell']],
    [['--type', 'ui', '--category', 'navigation'], ['menu']],
    [['--type', 'theme'], []],
  ])('%j', async (argv, expected) => {
    expect(await names(argv)).toEqual(expected)
  })

  it('filters the text output and says when nothing matches', async () => {
    const some = await list(['--category', 'actions'], serve(sample).fetch)
    expect(
      some.out
        .trimEnd()
        .split('\n')
        .map((line) => line.split(/\s+/)[0]),
    ).toEqual(['button', 'menu'])
    const none = await list(['--type', 'theme'], serve(sample).fetch)
    expect(none.code).toBe(0)
    expect(none.out).toBe('No items match.\n')
  })
})

describe('AC-004 which registry', () => {
  it('reads the index beside the @heart-ui template in heart-ui.json', async () => {
    const { fetch, calls } = serve()
    await list([], fetch)
    expect(calls).toEqual(['https://registry.test/registry.json'])
  })

  it('reads the default registry without heart-ui.json', async () => {
    const { fetch, calls } = serve()
    const result = await list([], fetch, project(false))
    expect(result.code).toBe(0)
    expect(calls).toEqual([
      new URL('../registry.json', DEFAULT_REGISTRY_URL.replace('{name}', 'x')).href,
    ])
  })
})

describe('AC-005 failures and the cache', () => {
  it('uses the cached index with a warning when offline', async () => {
    const root = project()
    const cache = mkdtempSync(join(dirname(out), 'cache-'))
    expect((await list([], serve().fetch, root, cache)).code).toBe(0)
    const offline = await list(['--json'], serve(new TypeError('fetch failed')).fetch, root, cache)
    expect(offline.code).toBe(0)
    expect(JSON.parse(offline.out)).toEqual(index.items)
    expect(offline.err).toBe('heart-ui: Could not reach @heart-ui; using the cached index.\n')
  })

  it.each([
    [
      'offline',
      new TypeError('fetch failed'),
      'heart-ui: Could not reach @heart-ui (https://registry.test/registry.json). Check your connection.\n',
    ],
    [
      'a server error',
      new Response('down', { status: 503 }),
      'heart-ui: @heart-ui answered 503 for https://registry.test/registry.json.\n',
    ],
    ['not an index', { items: 'nope' }, 'heart-ui: @heart-ui sent an invalid index.\n'],
    ['items that are not a list', { items: null }, 'heart-ui: @heart-ui sent an invalid index.\n'],
    ['text', '<html>', 'heart-ui: @heart-ui sent an invalid index.\n'],
  ])('fails in one line with nothing cached: %s', async (_, answer, message) => {
    const result = await list([], serve(answer).fetch)
    expect(result.code).toBe(1)
    expect(result.err).toBe(message)
    expect(result.out).toBe('')
  })
})

describe('AC-006 control characters', () => {
  const hostile: Index = {
    items: [
      {
        name: 'button',
        type: 'registry:ui',
        description: 'Clicks\u001b]52;c;ZQ==\u0007 \u009b2Kok',
      },
    ],
  }

  it('drops them from the text output', async () => {
    const result = await list([], serve(hostile).fetch)
    expect(result.out).toMatch(/^button\s+ui\s+Clicks\]52;c;ZQ== 2Kok\n$/)
  })

  it('escapes them in JSON', async () => {
    const result = await list(['--json'], serve(hostile).fetch)
    const codes = [...result.out.trimEnd()].map((char) => char.charCodeAt(0))
    expect(codes.filter((code) => code < 0x20 || (code >= 0x7f && code <= 0x9f))).toEqual([])
    expect(JSON.parse(result.out)).toEqual(hostile.items)
  })
})

describe('AC-006 control characters in every printed field', () => {
  it('drops them from the name and type too', async () => {
    const hostile: Index = {
      items: [
        { name: 'butt\u001b[2Kon', type: 'registry:ui\u001b]52;c;ZQ==\u0007', description: 'd' },
      ],
    }
    const result = await list([], serve(hostile).fetch)
    const codes = [...result.out.trimEnd()].map((char) => char.charCodeAt(0))
    expect(codes.filter((code) => code < 0x20 || (code >= 0x7f && code <= 0x9f))).toEqual([])
  })
})

describe('AC-004 a template with a query string', () => {
  it('keeps the query on the index URL', async () => {
    const root = project()
    const config = JSON.parse(readFileSync(join(root, 'heart-ui.json'), 'utf8')) as {
      registries: Record<string, string>
    }
    config.registries['@heart-ui'] = 'https://registry.test/r/{name}.json?token=abc'
    writeFileSync(join(root, 'heart-ui.json'), JSON.stringify(config))
    const { fetch, calls } = serve()
    expect((await list([], fetch, root)).code).toBe(0)
    expect(calls).toEqual(['https://registry.test/registry.json?token=abc'])
  })
})

describe('AC-003 type values', () => {
  it('reads the type case-insensitively', async () => {
    const result = await list(['--json', '--type', 'UI'], serve().fetch)
    const items = JSON.parse(result.out) as IndexItem[]
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.type === 'registry:ui')).toBe(true)
  })

  it.each(['compnent', ''])('refuses the type %j as a usage mistake', async (type) => {
    const result = await list(['--type', type], serve().fetch)
    expect(result.code).toBe(2)
    expect(result.err).toBe('heart-ui: --type must be one of ui, lib, block, theme.\n')
  })
})

describe('AC-004 other template layouts', () => {
  const withTemplate = (template: string) => {
    const root = project()
    const config = JSON.parse(readFileSync(join(root, 'heart-ui.json'), 'utf8')) as {
      registries: Record<string, string>
    }
    config.registries['@heart-ui'] = template
    writeFileSync(join(root, 'heart-ui.json'), JSON.stringify(config))
    return root
  }

  it('reads registry.json beside the items when they are not in an r/ folder', async () => {
    const { fetch, calls } = serve()
    expect(
      (await list([], fetch, withTemplate('https://cdn.test/heart-ui/{name}.json'))).code,
    ).toBe(0)
    expect(calls).toEqual(['https://cdn.test/heart-ui/registry.json'])
  })

  it('refuses a template whose item name is not in the file name', async () => {
    const result = await list(
      [],
      serve().fetch,
      withTemplate('https://host.test/api/item.json?name={name}'),
    )
    expect(result.code).toBe(1)
    expect(result.err).toBe(
      'heart-ui: The @heart-ui template names items outside its file name, so list cannot find its index.\n',
    )
  })

  it('lists the default registry, with a warning, when heart-ui.json is invalid', async () => {
    const root = project()
    writeFileSync(join(root, 'heart-ui.json'), '{"framework": "react"}')
    const { fetch } = serve()
    const result = await list([], fetch, root)
    expect(result.code).toBe(0)
    expect(result.err).toMatch(
      /^heart-ui: .*heart-ui\.json: "framework" must be "nuxt" or "vite"\. Listing the default registry\.\n$/,
    )
  })
})

describe('AC-005 entries the index gets wrong', () => {
  it('skips an entry with malformed fields and lists the rest', async () => {
    const index = {
      items: [
        { name: 'button', type: 'registry:ui', description: 'B' },
        { name: 'bad', type: 'registry:ui', categories: 'forms' },
      ],
    }
    const result = await list(['--json'], serve(index).fetch)
    expect(result.code).toBe(0)
    expect((JSON.parse(result.out) as IndexItem[]).map((item) => item.name)).toEqual(['button'])
  })
})

describe('AC-006 bidi controls and wide characters', () => {
  it('drops bidi and zero-width controls', async () => {
    const hostile: Index = {
      items: [{ name: 'button', type: 'registry:ui', description: 'a‮b⁦c​d' }],
    }
    const result = await list([], serve(hostile).fetch)
    expect(result.out).toMatch(/^button\s+ui\s+abcd\n$/)
  })

  it('keeps the columns lined up after a name outside the BMP', async () => {
    const index: Index = {
      items: [
        { name: 'x\u{1F600}', type: 'registry:ui', description: 'one' },
        { name: 'abc', type: 'registry:ui', description: 'two' },
      ],
    }
    const result = await list([], serve(index).fetch)
    const [first = '', second = ''] = result.out.trimEnd().split('\n')
    expect([...first].indexOf('o')).toBe([...second].indexOf('t'))
  })
})
