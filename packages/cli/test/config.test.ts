import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readConfig, writeConfig, type Config } from '../src/config.ts'
import { CliError } from '../src/errors.ts'

const valid: Config = {
  $schema: 'https://ui.example.com/schema/config.json',
  framework: 'nuxt',
  css: 'app/assets/css/heart-ui.css',
  aliases: {
    ui: '@/components/ui',
    blocks: '@/components/blocks',
    layouts: '@/layouts',
    lib: '@/lib',
  },
  iconSet: 'fluent',
  registries: {
    '@heart-ui': 'https://ui.example.com/r/{name}.json',
    '@acme': 'https://acme.example.com/items/{name}.json',
  },
}

let tmp: string
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'heart-ui-config-'))
})
afterEach(() => rmSync(tmp, { recursive: true, force: true }))

const put = (value: unknown) =>
  writeFileSync(
    join(tmp, 'heart-ui.json'),
    typeof value === 'string' ? value : JSON.stringify(value),
  )

describe('AC-005 reading heart-ui.json', () => {
  it('reads a valid file', async () => {
    put(valid)
    expect(await readConfig(tmp)).toEqual(valid)
  })

  it('reads a file without $schema', async () => {
    const rest: Config = { ...valid }
    delete rest.$schema
    put(rest)
    expect(await readConfig(tmp)).toEqual(rest)
  })

  it('returns null when the file is missing', async () => {
    expect(await readConfig(tmp)).toBeNull()
  })

  it('names the file when it is not valid JSON', async () => {
    put('{ "framework": "nuxt", ')
    const error = await readConfig(tmp).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(CliError)
    expect((error as Error).message).toMatch(/heart-ui\.json is not valid JSON\.$/)
    expect((error as Error).message).not.toMatch(/position|Unexpected|token/i)
  })

  const broken = (change: (config: Record<string, unknown>) => void) => {
    const config = structuredClone(valid) as unknown as Record<string, unknown>
    change(config)
    return config
  }

  it.each([
    ['an array', [], /heart-ui\.json must hold a JSON object\./],
    ['null', null, /heart-ui\.json must hold a JSON object\./],
    [
      'a wrong framework',
      broken((c) => (c.framework = 'react')),
      /"framework" must be "nuxt" or "vite"/,
    ],
    ['a missing css', broken((c) => delete c.css), /"css" must be a non-empty string/],
    ['a null css', broken((c) => (c.css = null)), /"css" must be a non-empty string/],
    ['an empty iconSet', broken((c) => (c.iconSet = '')), /"iconSet" must be a non-empty string/],
    ['aliases not an object', broken((c) => (c.aliases = 'x')), /"aliases" must be an object/],
    [
      'a missing alias',
      broken((c) => delete (c.aliases as Record<string, string>).ui),
      /"aliases\.ui" must be an import path/,
    ],
    [
      'an alias with a trailing slash',
      broken((c) => ((c.aliases as Record<string, string>).lib = '@/lib/')),
      /"aliases\.lib" must be an import path/,
    ],
    [
      'an alias with a quote',
      broken((c) => ((c.aliases as Record<string, string>).blocks = "@/x'")),
      /"aliases\.blocks" must be an import path/,
    ],
    [
      'an unknown alias',
      broken((c) => ((c.aliases as Record<string, string>).hooks = '@/hooks')),
      /Unknown key "aliases\.hooks"/,
    ],
    [
      'registries not an object',
      broken((c) => (c.registries = [])),
      /"registries" must be an object/,
    ],
    [
      'a template without {name}',
      broken(
        (c) => ((c.registries as Record<string, string>)['@heart-ui'] = 'https://x.com/r/a.json'),
      ),
      /"registries\.@heart-ui" must be an https URL \(http only for localhost\) containing \{name\}/,
    ],
    [
      'a template that is not http',
      broken(
        (c) => ((c.registries as Record<string, string>)['@heart-ui'] = 'file:///r/{name}.json'),
      ),
      /"registries\.@heart-ui" must be an https URL \(http only for localhost\) containing \{name\}/,
    ],
    [
      'a registry name without @',
      broken((c) => ((c.registries as Record<string, string>).acme = 'https://x.com/{name}.json')),
      /"registries\.acme" is not a registry name/,
    ],
    ['an unknown key', broken((c) => (c.alias = {})), /Unknown key "alias"/],
  ])('names the field for %s', async (_, value, message) => {
    put(value)
    const error = await readConfig(tmp).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(CliError)
    expect((error as Error).message).toMatch(message)
    expect((error as Error).message).toContain('heart-ui.json')
  })
})

describe('AC-006 writing heart-ui.json', () => {
  it('writes two-space JSON with a final newline that reads back equal', async () => {
    await writeConfig(tmp, valid)
    expect(readFileSync(join(tmp, 'heart-ui.json'), 'utf8')).toBe(
      `${JSON.stringify(valid, null, 2)}\n`,
    )
    expect(await readConfig(tmp)).toEqual(valid)
  })

  it('replaces an existing file', async () => {
    put({ old: true })
    await writeConfig(tmp, valid)
    expect(await readConfig(tmp)).toEqual(valid)
    expect(readdirSync(tmp)).toEqual(['heart-ui.json'])
  })

  it('refuses an invalid config before writing anything', async () => {
    const error = await writeConfig(tmp, {
      ...valid,
      framework: 'react',
    } as unknown as Config).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(CliError)
    expect((error as Error).message).toMatch(/"framework"/)
    expect(readdirSync(tmp)).toEqual([])
  })

  it('leaves no temporary file when the write fails', async () => {
    // A folder in the file's place makes the final rename fail.
    mkdirSync(join(tmp, 'heart-ui.json'))
    writeFileSync(join(tmp, 'heart-ui.json', 'keep'), '')
    const error = await writeConfig(tmp, valid).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(CliError)
    expect((error as Error).message).toMatch(/^Could not write .*heart-ui\.json\.$/)
    expect(readdirSync(tmp)).toEqual(['heart-ui.json'])
  })
})

describe('AC-005 registry URLs', () => {
  const withTemplate = (template: string) => ({
    ...valid,
    registries: { '@heart-ui': template },
  })

  it.each([
    'http://localhost:4321/r/{name}.json',
    'http://127.0.0.1:4321/r/{name}.json',
    'http://[::1]:4321/r/{name}.json',
  ])('accepts plain http on loopback: %s', async (template) => {
    put(withTemplate(template))
    expect((await readConfig(tmp))?.registries['@heart-ui']).toBe(template)
  })

  it('refuses plain http to another host', async () => {
    put(withTemplate('http://ui.example.com/r/{name}.json'))
    const error = await readConfig(tmp).catch((e: unknown) => e)
    expect((error as Error).message).toMatch(
      /"registries\.@heart-ui" must be an https URL \(http only for localhost\) containing \{name\}/,
    )
  })

  it('reads a file that starts with a byte order mark', async () => {
    put(`\uFEFF${JSON.stringify(valid)}`)
    expect(await readConfig(tmp)).toEqual(valid)
  })
})

describe('AC-005 credentials in registry URLs', () => {
  it('refuses a template with a user name and password', async () => {
    put({
      ...valid,
      registries: { '@heart-ui': 'https://user:token@ui.example.com/r/{name}.json' },
    })
    const error = await readConfig(tmp).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(CliError)
    expect((error as Error).message).toMatch(
      /"registries\.@heart-ui" must not hold a user name or password\./,
    )
  })
})
