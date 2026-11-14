import { describe, expect, it } from 'vitest'
import { docsItems, escapeHtml, markdownTitle } from '../apps/docs/scripts/items.ts'
import {
  type ApiComponent,
  componentExports,
  indexPage,
  itemPage,
  renderPages,
} from '../apps/docs/scripts/pages.ts'

// The page generator for apps/docs, run against the real registry.
const pages = renderPages()
const page = (name: string) => {
  const found = pages.find((entry) => entry.name === name)
  if (!found) throw new Error(`no page for ${name}`)
  return found
}
const section = (markdown: string, heading: string) => {
  const start = markdown.indexOf(`\n${heading}\n`)
  if (start < 0) return ''
  const next = markdown.indexOf('\n## ', start + heading.length + 2)
  return markdown.slice(start, next < 0 ? undefined : next)
}

describe('docs pages', () => {
  it('button page: Markdown, preview before Usage, API from the types', () => {
    const { item } = page('button')
    expect(item).toContain('# Button\n')
    expect(item).toContain('## Do not')
    const preview = item.indexOf('<DemoPreview name="button"')
    expect(preview).toBeGreaterThan(item.indexOf('# Button'))
    expect(preview).toBeLessThan(item.indexOf('## Usage'))
    const api = section(item, '## API')
    expect(item.indexOf('## API')).toBeLessThan(item.indexOf('## Props'))
    expect(api).toContain('### Button')
    const variant = api.split('\n').find((line) => line.startsWith('| `variant` |'))
    for (const value of ['primary', 'secondary', 'outline', 'ghost', 'danger', 'link']) {
      expect(variant).toContain(`'${value}'`)
    }
    expect(variant).not.toContain('NonNullable')
    expect(variant).toContain("`'secondary'`")
    expect(api).toContain('Ignored when the rendered element is not a `button`.')
    expect(api).toContain('| `loading` | `boolean` |')
    expect(api).toContain('| `as` | `AsTag \\| Component` |')
    for (const slot of ['default', 'leading', 'trailing']) expect(api).toContain(`| \`${slot}\` |`)
  })

  it('dialog page: a subsection per exported part', () => {
    const { item } = page('dialog')
    const api = section(item, '## API')
    const parts = [
      'Dialog',
      'DialogClose',
      'DialogContent',
      'DialogDescription',
      'DialogFooter',
      'DialogHeader',
      'DialogTitle',
      'DialogTrigger',
    ]
    for (const part of parts) expect(api).toContain(`\n### ${part}\n`)
    expect(api.match(/\n### /g)).toHaveLength(parts.length)
    const content = api.slice(
      api.indexOf('### DialogContent'),
      api.indexOf('### DialogDescription'),
    )
    expect(content).toContain('| `closeLabel` |')
    const root = api.slice(api.indexOf('### Dialog\n'), api.indexOf('### DialogClose'))
    expect(root).toContain('| `update:open` |')
  })

  it('input page: model, invalid, slots and the update event', () => {
    const api = section(page('input').item, '## API')
    for (const row of [
      '`modelValue`',
      '`invalid`',
      '`leading`',
      '`trailing`',
      '`update:modelValue`',
    ]) {
      expect(api).toContain(`| ${row} |`)
    }
  })

  it('demo pages: bare pages that mount the demo, only for items with Markdown', () => {
    expect(docsItems().map((item) => item.name)).toEqual(['button', 'dialog', 'input'])
    expect(pages.map((entry) => entry.name)).not.toContain('placeholder')
    for (const [name, demo] of [
      ['button', 'Button.demo.vue'],
      ['dialog', 'Dialog.demo.vue'],
      ['input', 'Input.demo.vue'],
    ] as const) {
      const { demoPage } = page(name)
      expect(demoPage).toMatch(/^---\n(.*\n)*layout: false\n(.*\n)*---\n/)
      expect(demoPage).toContain(`import Demo from '@registry/ui/${name}/${demo}'`)
      expect(demoPage).toContain('<div class="tre-demo"><Demo /></div>')
    }
  })
})

describe('docs page generator edge cases', () => {
  const sample = (props: object[] = []) =>
    ({ name: 'Sample', props, slots: [], events: [] }) as unknown as ApiComponent

  it('places the preview and the API section by headings outside code', () => {
    const markdown = [
      '# Sample {#sample}',
      '',
      'Intro.',
      '',
      '```md',
      '## Props',
      '```',
      '',
      '## Usage',
      '',
      '## Props',
      '',
    ].join('\n')
    expect(markdownTitle(markdown)).toBe('Sample')
    expect(markdownTitle('```sh\n# install\n```\n\n# Real title\n')).toBe('Real title')
    const page = itemPage({ name: 'sample', title: 'Sample' }, markdown, [sample()])
    expect(page.indexOf('<DemoPreview')).toBeGreaterThan(page.indexOf('```md'))
    expect(page.indexOf('<DemoPreview')).toBeLessThan(page.indexOf('## Usage'))
    expect(page).toContain('```md\n## Props\n```')
    expect(page.indexOf('## API')).toBeGreaterThan(page.indexOf('## Usage'))
    expect(page.indexOf('## API')).toBeLessThan(page.lastIndexOf('## Props'))
  })

  it('fences types that hold backticks', () => {
    const page = itemPage({ name: 'sample', title: 'Sample' }, '# Sample\n', [
      sample([
        {
          name: 'width',
          global: false,
          type: '`${number}px` | undefined',
          schema: '`${number}px`',
          default: undefined,
          description: '',
        },
      ]),
    ])
    expect(page).toContain('| `width` | `` `${number}px` `` |')
  })

  it('lists every item on the components index page, escaped', () => {
    const items = docsItems()
    const index = indexPage([...items, { ...(items[0] as (typeof items)[number]), title: 'A <b>' }])
    for (const item of items) expect(index).toContain(`- [${item.title}](./${item.name}): `)
    expect(index).toContain('- [A &lt;b&gt;](./button): ')
    expect(escapeHtml('<x> & "y"')).toBe('&lt;x&gt; &amp; &quot;y&quot;')
  })

  it('escapes descriptions and quotes the title', () => {
    const page = itemPage({ name: 'sample', title: 'Toggle: "on" #2' }, '# Toggle\n\n## Usage\n', [
      {
        name: 'Sample',
        props: [
          {
            name: 'href',
            global: false,
            type: 'string | undefined',
            schema: 'string',
            default: undefined,
            description: 'Renders an <a> when set; use {{ x }} or `<b>`.',
          },
        ],
        slots: [],
        events: [],
      } as unknown as ApiComponent,
    ])
    expect(page).toMatch(/^---\ntitle: "Toggle: \\"on\\" #2"\n---\n/)
    expect(page).toContain('title="Toggle: &quot;on&quot; #2"')
    expect(page).toContain('Renders an &lt;a&gt; when set; use {{ x }} or `<b>`.')
    expect(page).toMatch(/::: v-pre\n[\s\S]*\| `href` \|[\s\S]*\n:::\n/)
  })

  it('finds every component the index re-exports, however it is wrapped', () => {
    const index = [
      "export { default as Sample } from './Sample.vue'",
      'export {',
      '  default as SampleWithAVeryLongPartName,',
      "} from './parts/SampleWithAVeryLongPartName.vue'",
      "export { sampleVariants } from './sample.variants'",
    ].join('\n')
    expect(componentExports(index)).toEqual([
      { name: 'Sample', file: 'Sample.vue' },
      { name: 'SampleWithAVeryLongPartName', file: 'parts/SampleWithAVeryLongPartName.vue' },
    ])
    expect(componentExports("export { sampleVariants } from './sample.variants'")).toEqual([])
    expect(
      componentExports(
        [
          "export { default as Typed, type TypedProps } from './Typed.vue'",
          "// export { default as Old } from './Old.vue'",
          "/* export { default as Older } from './Older.vue' */",
        ].join('\n'),
      ),
    ).toEqual([{ name: 'Typed', file: 'Typed.vue' }])
  })

  it('takes the sidebar title from the Markdown heading', () => {
    expect(docsItems().map((entry) => entry.title)).toEqual(['Button', 'Dialog', 'Input'])
  })
})
