import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const timeout = 120_000

function run(script: string, args: string[]) {
  const result = spawnSync(process.execPath, [join(root, 'scripts', script), ...args], {
    cwd: root,
    encoding: 'utf8',
  })
  if (result.error) throw result.error
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

let out: string
beforeAll(() => {
  out = mkdtempSync(join(tmpdir(), 'heart-ui-agent-'))
  const built = run('registry-build.ts', ['--out', join(out, 'registry')])
  if (built.status !== 0) throw new Error(built.output)
}, timeout)
afterAll(() => rmSync(out, { recursive: true, force: true }))
const read = (path: string) => readFileSync(join(out, 'registry', path), 'utf8')

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('agent context', () => {
  it('AC-001 the API index', () => {
    const index = read('agents/api-index.md')
    const registry = JSON.parse(read('registry.json')) as { items: { name: string }[] }
    const lines = index.split('\n').filter((line) => line.startsWith('- '))
    expect(lines.map((line) => /^- ([\w-]+)/.exec(line)?.[1])).toEqual(
      registry.items.map((item) => item.name),
    )
    const line = (name: string) => lines.find((entry) => /^- ([\w-]+)/.exec(entry)?.[1] === name)!
    const section = (kind: string) => index.split(`## ${kind}: `)[1]?.split('\n## ')[0] ?? ''
    expect(section('ui')).toMatch(/^`@\/components\/ui`\n/)
    expect(section('ui')).toContain(line('button'))
    expect(line('button')).toMatch(/^- button: Button — Button variant: '[a-z]+'(\|'[a-z]+')+/)
    expect(line('button')).toContain('loading?')
    expect(section('lib')).toMatch(/^`@\/lib`\n/)
    expect(section('lib')).toContain('- utils/utils: cn\n')
    expect(line('icon')).toBe('- icon: Icon, fluent')
    expect(line('toast')).toBe('- toast: Toaster, toast, useToast')
    expect(line('checkbox')).toContain("modelValue: false|true|'indeterminate'")
    // Planned by the end of Phase 2 (tasks/phase-2.md): 18 items now, 61 then.
    const body = lines.reduce((sum, entry) => sum + Buffer.byteLength(entry) + 1, 0)
    expect(Buffer.byteLength(index) - body + (body / lines.length) * 61).toBeLessThanOrEqual(8192)
    expect(Buffer.byteLength(index)).toBeLessThanOrEqual(8192)
  })

  it('AC-002 the skill', () => {
    const skill = read('skills/heart-ui/SKILL.md')
    const front = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1] ?? ''
    expect(front).toMatch(/^name: heart-ui$/m)
    const description = /^description: (.+)$/m.exec(front)?.[1] ?? ''
    expect(description.length).toBeGreaterThan(0)
    expect(description.length).toBeLessThanOrEqual(1024)
    expect(skill.split('\n').length).toBeLessThan(500)
    expect(skill).toMatch(/token/i)
    const registry = JSON.parse(read('registry.json')) as {
      items: { name: string; description?: string }[]
    }
    for (const item of registry.items) expect(skill, item.name).toContain(`| \`${item.name}\` |`)
    const button = registry.items.find((item) => item.name === 'button')!
    expect(skill).toContain(`| ${button.description} | \`button\` |`)
  })

  it(
    'AC-003 a new item appears in both',
    () => {
      const dir = mkdtempSync(join(tmpdir(), 'heart-ui-agent-item-'))
      dirs.push(dir)
      const registry = join(dir, 'registry')
      cpSync(join(root, 'registry/lib/utils'), join(registry, 'lib/utils'), { recursive: true })
      const files: Record<string, string> = {
        'ui/sample/Sample.vue': '<template><p /></template>\n',
        'ui/sample/index.ts': "export { default as Sample } from './Sample.vue'\n",
        'ui/sample/item.json': JSON.stringify({
          name: 'sample',
          type: 'registry:ui',
          title: 'Sample',
          description: 'Shows a sample.',
          files: ['Sample.vue', 'index.ts'],
          meta: { version: '0.1.0', tier: 1 },
        }),
        'ui/sample/sample.api.json': `${JSON.stringify(
          {
            name: 'sample',
            version: '0.1.0',
            components: [
              {
                name: 'Sample',
                props: [{ name: 'tone', type: "'a' | 'b'", required: false, default: "'a'" }],
                slots: [],
                events: [],
              },
            ],
          },
          null,
          2,
        )}\n`,
      }
      for (const [file, text] of Object.entries(files)) {
        mkdirSync(dirname(join(registry, file)), { recursive: true })
        writeFileSync(join(registry, file), text)
      }
      const built = run('registry-build.ts', ['--registry', registry, '--out', join(dir, 'out')])
      expect(built.status, built.output).toBe(0)
      const index = readFileSync(join(dir, 'out/agents/api-index.md'), 'utf8')
      expect(index).toMatch(/^- sample: Sample — Sample tone: 'a'\|'b'$/m)
      const skill = readFileSync(join(dir, 'out/skills/heart-ui/SKILL.md'), 'utf8')
      expect(skill).toContain('| Shows a sample. | `sample` |')
    },
    timeout,
  )

  it(
    'AC-004 published with the registry',
    () => {
      const marker = JSON.parse(read('.heart-ui-registry-build.json')) as { files: string[] }
      expect(marker.files).toContain('agents/api-index.md')
      expect(marker.files).toContain('skills/heart-ui/SKILL.md')
      const publish = run('registry-publish.ts', ['--dry-run'])
      expect(publish.status, publish.output).toBe(0)
      expect(publish.output).toContain('agents/api-index.md')
      expect(publish.output).toContain('skills/heart-ui/SKILL.md')
    },
    timeout,
  )

  it(
    'AC-003 a snapshot that is not JSON fails the build by name',
    () => {
      const dir = mkdtempSync(join(tmpdir(), 'heart-ui-agent-bad-'))
      dirs.push(dir)
      const registry = join(dir, 'registry')
      cpSync(join(root, 'registry/lib/utils'), join(registry, 'lib/utils'), { recursive: true })
      cpSync(join(root, 'registry/ui/badge'), join(registry, 'ui/badge'), { recursive: true })
      writeFileSync(join(registry, 'ui/badge/badge.api.json'), '<<<<<<< HEAD\n')
      const built = run('registry-build.ts', ['--registry', registry, '--out', join(dir, 'out')])
      expect(built.status).not.toBe(0)
      expect(built.output).toContain('badge.api.json')
      expect(built.output).not.toContain('SyntaxError')
    },
    timeout,
  )

  it('AC-002 item text reaches the skill as written', async () => {
    const { skillMarkdown } = await import('../scripts/agent-context.ts')
    const item = {
      name: 'price',
      kind: 'ui',
      entry: '',
      exports: ['Price'],
      description: "Shows $$ amounts,\nand $' or $& stay.",
      components: [],
    }
    expect(skillMarkdown([item])).toContain("| Shows $$ amounts, and $' or $& stay. | `price` |")
    expect(skillMarkdown([{ ...item, useWhen: ' ' }])).toContain('| Shows $$ amounts')
    expect(() => skillMarkdown([item], '# No table\n')).toThrow(/\{\{items\}\}/)
  })

  it('AC-001 default exports are not listed as named imports', async () => {
    const { moduleExports } = await import('../scripts/agent-context.ts')
    const source = [
      "export { default } from './Foo.vue'",
      "export { default as Foo, fooVariants, type FooProps } from './Foo.vue'",
      'export default function make() {}',
      'export const useFoo = () => {}',
      'export type FooSize = string',
    ].join('\n')
    expect(moduleExports(source)).toEqual(['Foo', 'fooVariants', 'useFoo'])
  })

  it('AC-005 the 8 KB budget', async () => {
    const { apiIndex } = await import('../scripts/agent-context.ts')
    const items = Array.from({ length: 1000 }, (_, at) => ({
      name: `item-${at}`,
      kind: 'ui',
      entry: '',
      exports: ['Item'],
      description: 'A component with a long enough description to fill the budget quickly.',
      components: [],
    }))
    expect(() => apiIndex(items)).toThrow(/over 8 KB.*\d+ bytes/)
  })
})
