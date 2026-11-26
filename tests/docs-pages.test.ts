import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { docsItems, escapeHtml, markdownTitle } from '../apps/docs/scripts/items.ts'
import {
  type ApiComponent,
  componentExports,
  guidePage,
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
const row = (text: string, first: string) =>
  text.split('\n').find((line) => line.startsWith(`| ${first} |`)) ?? ''

describe('docs pages', () => {
  it('marks the preview of an item that opens an overlay, so its frame keeps room for it', () => {
    const overlays = pages
      .filter((entry) => /<DemoPreview [^>]* overlay \/>/.test(entry.item))
      .map((entry) => entry.name)
    expect(overlays).toEqual(['dialog', 'dropdown-menu', 'popover', 'select', 'toast', 'tooltip'])
  })

  it('turns the edit link off on the generated component index', () => {
    expect(indexPage(docsItems())).toMatch(/^---\ntitle: Components\neditLink: false\n---/)
  })

  it('button page: one merged table per section, types and defaults from code, notes from the spec', () => {
    const { item } = page('button')
    expect(item).toContain('# Button\n')
    expect(item).toContain('## Do not')
    expect(item).not.toContain('## API')
    const preview = item.indexOf('<DemoPreview name="button"')
    expect(preview).toBeGreaterThan(item.indexOf('# Button'))
    expect(preview).toBeLessThan(item.indexOf('## Usage'))

    const props = section(item, '## Props')
    expect(props.match(/^\| Prop \| Type \| Default \| Notes \|$/gm)).toHaveLength(1)
    const variant = row(props, '`variant`')
    for (const value of ['primary', 'secondary', 'outline', 'ghost', 'danger', 'link']) {
      expect(variant).toContain(`'${value}'`)
    }
    expect(variant).not.toContain('NonNullable')
    expect(variant).toContain("`'secondary'`")
    expect(row(props, '`size`')).toContain('Height from `control-*`')
    expect(row(props, '`loading`')).toMatch(/^\| `loading` \| `boolean` \| `false` \| A spinner/)
    expect(row(props, '`as`')).toContain('`AsTag \\| Component`')
    expect(row(props, '`class`')).toContain('Merged last')

    const slots = section(item, '## Slots')
    expect(slots.match(/^\| Slot \| Content \|$/gm)).toHaveLength(1)
    expect(row(slots, '`leading`')).toContain('Icon before the label')
    expect(slots).toContain('An icon-only button puts the icon in `default`')
  })

  it('dialog page: a Part column with every part, events merged, prose kept', () => {
    const { item } = page('dialog')
    const props = section(item, '## Props')
    expect(props.match(/^\| Part \| Prop \| Type \| Default \| Notes \|$/gm)).toHaveLength(1)
    for (const part of ['DialogTrigger', 'DialogClose', 'DialogTitle', 'DialogDescription']) {
      expect(row(props, `\`${part}\``)).not.toBe('')
      expect(props).toContain(`| \`${part}\` | \`asChild\` | \`boolean\` |`)
      expect(props).toContain(`| \`${part}\` | \`as\` |`)
    }
    expect(props).toContain("| `DialogContent` | `closeLabel` | `string` | `'Close'` |")
    expect(props).toContain('`DialogContent` renders the portal and the overlay.')
    const events = section(item, '## Events')
    expect(events).toContain('| `Dialog` | `update:open` |')
    expect(events).toContain('| `DialogContent` | `close` |')
    expect(events).toContain('After the close animation ends')
    const slots = section(item, '## Slots')
    expect(slots.match(/^\| `Dialog\w*` \| `default` \|/gm)).toHaveLength(8)
  })

  it('input page: model, invalid, slots and the update event', () => {
    const { item } = page('input')
    expect(row(section(item, '## Props'), '`modelValue`')).toMatch(/`string` \| `''` \| `v-model`/)
    expect(row(section(item, '## Props'), '`invalid`')).toContain('aria-invalid')
    expect(row(section(item, '## Slots'), '`trailing`')).toContain('a small button')
    expect(row(section(item, '## Events'), '`update:modelValue`')).toContain('On input')
  })

  it('demo pages: bare pages that mount the demo, only for items with Markdown', () => {
    expect(docsItems().map((item) => item.name)).toEqual([
      'accordion',
      'alert',
      'avatar',
      'badge',
      'button',
      'card',
      'checkbox',
      'dialog',
      'dropdown-menu',
      'input',
      'label',
      'popover',
      'progress',
      'radio-group',
      'select',
      'separator',
      'skeleton',
      'switch',
      'tabs',
      'textarea',
      'toast',
      'tooltip',
    ])
    expect(pages.map((entry) => entry.name)).not.toContain('placeholder')
    for (const [name, demo] of [
      ['accordion', 'Accordion.demo.vue'],
      ['alert', 'Alert.demo.vue'],
      ['avatar', 'Avatar.demo.vue'],
      ['badge', 'Badge.demo.vue'],
      ['button', 'Button.demo.vue'],
      ['card', 'Card.demo.vue'],
      ['checkbox', 'Checkbox.demo.vue'],
      ['dialog', 'Dialog.demo.vue'],
      ['dropdown-menu', 'DropdownMenu.demo.vue'],
      ['input', 'Input.demo.vue'],
      ['label', 'Label.demo.vue'],
      ['popover', 'Popover.demo.vue'],
      ['progress', 'Progress.demo.vue'],
      ['radio-group', 'RadioGroup.demo.vue'],
      ['select', 'Select.demo.vue'],
      ['separator', 'Separator.demo.vue'],
      ['skeleton', 'Skeleton.demo.vue'],
      ['switch', 'Switch.demo.vue'],
      ['tabs', 'Tabs.demo.vue'],
      ['textarea', 'Textarea.demo.vue'],
      ['toast', 'Toast.demo.vue'],
      ['tooltip', 'Tooltip.demo.vue'],
    ] as const) {
      const { demoPage } = page(name)
      expect(demoPage).toMatch(/^---\n(.*\n)*layout: false\n(.*\n)*---\n/)
      expect(demoPage).toContain(`import Demo from '@registry/ui/${name}/${demo}'`)
      expect(demoPage).toContain('<div class="heart-demo"><Demo /></div>')
    }
  })
})

// A spec and a component's metadata, as small as each case needs.
const prop = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  global: false,
  type: 'string | undefined',
  schema: 'string',
  default: undefined,
  description: '',
  ...extra,
})
const typesOf = (name: string, parts: Partial<Record<'props' | 'slots' | 'events', object[]>>) =>
  ({ name, props: [], slots: [], events: [], ...parts }) as unknown as ApiComponent
const spec = (props: string[], rest = '') =>
  [
    '# Sample',
    '',
    '## Props',
    '',
    '| Prop | Type | Default | Notes |',
    '| --- | --- | --- | --- |',
    ...props,
    '',
    rest,
  ].join('\n')
const sampleItem = { name: 'sample', title: 'Sample' }

describe('spec and types drift', () => {
  const sizeRow = '| `size` | `sm \\| md \\| lg` | `md` | Height |'
  const size = prop('size', {
    type: '"sm" | "md" | undefined',
    schema: { kind: 'enum', type: '', schema: ['undefined', '"sm"', '"md"'] },
    default: '"md"',
  })

  it('accepts the equivalent forms', () => {
    const markdown = spec(
      [
        sizeRow,
        '| `disabled` | `boolean` | `false` | |',
        '| `label` | `string` | none | |',
        '| `class` | `string` | none | Merged last |',
        "| `text` | `string` | `''` | |",
        "| `shadow` | `'none' \\| 'sm'` | `'none'` | |",
        '| `open` | `boolean` | none | Uncontrolled when unset |',
      ],
      [
        '## Slots',
        '',
        'Slot | Content',
        ':-- | :--',
        '`default` | Label',
        '',
        '## Events',
        '',
        '| Event | Payload | When |',
        '| --- | --- | --- |',
        '| — | — | None of its own |',
      ].join('\n'),
    )
    const types = typesOf('Sample', {
      props: [
        size,
        prop('disabled', {
          type: 'boolean | undefined',
          schema: { kind: 'enum', type: '', schema: ['undefined', 'false', 'true'] },
        }),
        prop('label'),
        prop('class', { global: true }),
        prop('text', { default: '""' }),
        prop('shadow', { default: '"none"' }),
        // `withDefaults({ open: undefined })` keeps a boolean unset rather than `false`.
        prop('open', {
          type: 'boolean | undefined',
          schema: { kind: 'enum', type: '', schema: ['undefined', 'false', 'true'] },
          default: 'undefined',
        }),
      ],
      slots: [{ name: 'default', type: '{}', description: '' }],
    })
    expect(() => itemPage(sampleItem, markdown, [types])).not.toThrow()
  })

  it('reports an empty string, a literal none and no default as different', () => {
    const cases: [string, string, string | undefined, RegExp][] = [
      [
        'spec empty string, types none',
        "`''`",
        undefined,
        /`text` defaults to nothing in the types but `''`/,
      ],
      [
        'spec none, types empty string',
        'none',
        '""',
        /`text` defaults to `''` in the types but none/,
      ],
      [
        'spec none, types literal none',
        'none',
        '"none"',
        /`text` defaults to `'none'` in the types but none/,
      ],
    ]
    for (const [name, cell, value, message] of cases) {
      const markdown = spec([`| \`text\` | \`string\` | ${cell} | |`])
      const types = typesOf('Sample', { props: [prop('text', { default: value })] })
      expect(() => itemPage(sampleItem, markdown, [types]), name).toThrow(message)
    }
  })

  it('checks every table GFM allows, and fails on a section with no table', () => {
    const loose = [
      '# Sample',
      '',
      '## Props',
      '',
      '   Prop | Type | Default | Notes',
      '   -|-|-|-',
      '   `size` | `sm \\| md` | `md` | |',
    ].join('\n')
    const types = typesOf('Sample', { props: [size, prop('extra')] })
    expect(() => itemPage(sampleItem, loose, [types])).toThrow(/`extra` is in the types/)

    const withSlot = typesOf('Sample', {
      props: [size],
      slots: [{ name: 'footer', type: '{}', description: '' }],
    })
    expect(() =>
      itemPage(sampleItem, spec([sizeRow], '## Slots\n\nOne slot.'), [withSlot]),
    ).toThrow(/sample: Slots: sample\.md has no Slots table, but the types have `footer`/)
    expect(() => itemPage(sampleItem, spec([sizeRow]), [withSlot])).toThrow(
      /sample: Slots: sample\.md has no Slots table, but the types have `footer`/,
    )
    const slots = '## Slots\n\n| Slot | Content |\n| --- | --- |\n| `default` | Body |'
    expect(() => itemPage(sampleItem, spec([sizeRow], slots), [withSlot])).toThrow(
      /sample: Slots: `default` is in sample\.md but not in the types[\s\S]*`footer` is in the types/,
    )
  })

  it('names a row listed twice, class included', () => {
    const markdown = spec([sizeRow, sizeRow])
    expect(() => itemPage(sampleItem, markdown, [typesOf('Sample', { props: [size] })])).toThrow(
      /sample: Props: `size` is listed twice in sample\.md/,
    )
    const classRow = '| `class` | `string` | none | Merged last |'
    expect(() =>
      itemPage(sampleItem, spec([sizeRow, classRow, classRow]), [
        typesOf('Sample', { props: [size] }),
      ]),
    ).toThrow(/sample: Props: `class` is listed twice in sample\.md/)
  })

  it('gives any boolean-typed prop the implicit false', () => {
    const checked = prop('checked', {
      type: 'boolean | "indeterminate" | undefined',
      schema: { kind: 'enum', type: '', schema: ['undefined', 'false', 'true', '"indeterminate"'] },
    })
    const page = itemPage(
      sampleItem,
      spec(["| `checked` | `boolean \\| 'indeterminate'` | `false` | |"]),
      [typesOf('Sample', { props: [checked] })],
    )
    expect(page).toContain("| `checked` | `false \\| true \\| 'indeterminate'` | `false` |")
  })

  it('reads tables and headings as GFM and CommonMark do', () => {
    const types = typesOf('Sample', { props: [size] })
    const ends = ['> Native attributes fall through.', '<!-- note -->', '- a list', 'more text']
    for (const end of ends) {
      const markdown = spec([sizeRow]).trimEnd() + `\n${end}\n`
      expect(() => itemPage(sampleItem, markdown, [types]), end).not.toThrow()
      expect(itemPage(sampleItem, markdown, [types]), end).toContain(`:::\n${end}`)
    }
    // A delimiter row with fewer cells than the header makes no table.
    const ragged = '# Sample\n\n## Props\n\n| Prop | Type |\n| --- |\n| `size` | x |\n'
    expect(() => itemPage(sampleItem, ragged, [types])).toThrow(/has no Props table/)
    // A closing sequence or a little indent still makes the heading.
    for (const heading of ['## Props ##', '  ## Props']) {
      const markdown = spec([sizeRow]).replace('## Props', heading)
      expect(() => itemPage(sampleItem, markdown, [types]), heading).not.toThrow()
    }
    // A fence line with an info string doesn't close a fence.
    const nested = [
      '# Sample',
      '',
      '````md',
      '```vue',
      '## Props',
      '| Prop | Type | Default | Notes |',
      '| --- | --- | --- | --- |',
      '| `other` | x | none | |',
      '````',
      '',
    ].join('\n')
    const page = itemPage(sampleItem, `${nested}\n${spec([sizeRow]).slice('# Sample\n'.length)}`, [
      types,
    ])
    expect(page).toContain('| `other` | x | none | |')
  })

  it('checks a section split over several tables as one', () => {
    const markdown = [
      spec([sizeRow]),
      '## Props',
      '',
      '| Prop | Type | Default | Notes |',
      '| --- | --- | --- | --- |',
      '| `extra` | `string` | none | Advanced |',
    ].join('\n')
    const types = typesOf('Sample', { props: [size, prop('extra')] })
    expect(() => itemPage(sampleItem, markdown, [types])).not.toThrow()
  })

  it('keeps the column alignment the spec sets', () => {
    const markdown = spec([sizeRow]).replace(
      '| --- | --- | --- | --- |',
      '| :-- | --- | --: | --- |',
    )
    const page = itemPage(sampleItem, markdown, [typesOf('Sample', { props: [size] })])
    expect(page).toContain('| :-- | --- | --: | --- |')
  })

  it('needs a Part column for a multi-part item', () => {
    const parts = [typesOf('Sample', { props: [size] }), typesOf('SampleItem', {})]
    expect(() => itemPage(sampleItem, spec([sizeRow]), parts)).toThrow(
      /sample: Props: the table needs a Part column/,
    )
  })

  it('names a member found in only one source, or a default that differs', () => {
    const cases: [string, string[], ApiComponent, RegExp][] = [
      [
        'in the types only',
        [sizeRow],
        typesOf('Sample', { props: [size, prop('extra')] }),
        /sample: Props: `extra` is in the types but not in sample\.md/,
      ],
      [
        'in the spec only',
        [sizeRow, '| `gone` | `string` | none | |'],
        typesOf('Sample', { props: [size] }),
        /sample: Props: `gone` is in sample\.md but not in the types/,
      ],
      [
        'a default',
        ['| `size` | `sm \\| md \\| lg` | `lg` | |'],
        typesOf('Sample', { props: [size] }),
        /sample: Props: `size` defaults to `'md'` in the types but `lg` in sample\.md/,
      ],
    ]
    for (const [name, rows, types, message] of cases) {
      expect(() => itemPage(sampleItem, spec(rows), [types]), name).toThrow(message)
    }
    const events = spec(
      [sizeRow],
      ['## Events', '', '| Event | Payload | When |', '| --- | --- | --- |'].join('\n'),
    )
    const emits = typesOf('Sample', {
      props: [size],
      events: [{ name: 'change', type: '[value: string]', description: '' }],
    })
    expect(() => itemPage(sampleItem, events, [emits])).toThrow(
      /sample: Events: `change` is in the types but not in sample\.md/,
    )
  })

  it('shows payloads as types, says none for no default, and fills notes only in a notes column', () => {
    const events = [
      '## Events',
      '',
      '| Event | Payload | When |',
      '| --- | --- | --- |',
      '| `update:open` | `boolean` | Open changes |',
      '| `close` | none | Closed |',
      '| `change` | object | Changed |',
    ].join('\n')
    const page = itemPage(
      sampleItem,
      [
        '# Sample',
        '',
        '## Props',
        '',
        '| Prop | Type | Default |',
        '| --- | --- | --- |',
        '| `label` | `string` | none |',
        '',
        events,
      ].join('\n'),
      [
        typesOf('Sample', {
          props: [prop('label', { description: 'The spoken name' })],
          events: [
            { name: 'update:open', type: '[value: boolean]', description: '' },
            { name: 'close', type: '[]', description: '' },
            { name: 'change', type: '[value: Record<string, number>]', description: '' },
          ],
        }),
      ],
    )
    expect(page).toContain('| `label` | `string` | none |\n')
    expect(page).not.toContain('The spoken name')
    expect(page).toContain('| `update:open` | `boolean` | Open changes |')
    expect(page).toContain('| `close` | none | Closed |')
    expect(page).toContain('| `change` | `Record<string, number>` | Changed |')
  })

  it('names the part in a multi-part item', () => {
    const markdown = [
      '# Sample',
      '',
      '## Props',
      '',
      '| Part | Prop | Type | Default | Notes |',
      '| --- | --- | --- | --- | --- |',
      '| `Sample` | `size` | `sm \\| md` | `md` | |',
    ].join('\n')
    const parts = [
      typesOf('Sample', { props: [size] }),
      typesOf('SampleItem', { props: [prop('value')] }),
    ]
    expect(() => itemPage(sampleItem, markdown, parts)).toThrow(
      /sample: Props: `SampleItem` `value` is in the types but not in sample\.md/,
    )
  })
})

describe('docs page generator edge cases', () => {
  it('places the preview and the merged table by headings outside code', () => {
    const markdown = [
      '# Sample {#sample}',
      '',
      'Intro.',
      '',
      '```md',
      '## Props',
      '',
      '| Prop | Type | Default | Notes |',
      '```',
      '',
      '## Usage',
      '',
      '## Props',
      '',
      '| Prop | Type | Default | Notes |',
      '| --- | --- | --- | --- |',
      '| `label` | `string` | none | Spoken name |',
      '',
    ].join('\n')
    expect(markdownTitle(markdown)).toBe('Sample')
    expect(markdownTitle('```sh\n# install\n```\n\n# Real title\n')).toBe('Real title')
    const page = itemPage(sampleItem, markdown, [typesOf('Sample', { props: [prop('label')] })])
    expect(page.indexOf('<DemoPreview')).toBeGreaterThan(page.indexOf('```md'))
    expect(page.indexOf('<DemoPreview')).toBeLessThan(page.indexOf('## Usage'))
    expect(page).toContain('```md\n## Props\n\n| Prop | Type | Default | Notes |\n```')
    expect(page).toContain('| `label` | `string` | none | Spoken name |')
  })

  it('fences types that hold backticks', () => {
    const page = itemPage(sampleItem, spec(['| `width` | template | none | |']), [
      typesOf('Sample', {
        props: [prop('width', { type: '`${number}px` | undefined', schema: '`${number}px`' })],
      }),
    ])
    expect(page).toContain('| `width` | `` `${number}px` `` |')
  })

  it('lists every item on the components index page, escaped', () => {
    const items = docsItems()
    const index = indexPage([...items, { ...(items[0] as (typeof items)[number]), title: 'A <b>' }])
    for (const item of items) expect(index).toContain(`- [${item.title}](./${item.name}): `)
    expect(index).toContain(`- [A &lt;b&gt;](./${items[0]!.name}): `)
    expect(escapeHtml('<x> & "y"')).toBe('&lt;x&gt; &amp; &quot;y&quot;')
  })

  it('escapes JSDoc notes and quotes the title', () => {
    const page = itemPage(
      { name: 'sample', title: 'Toggle: "on" #2' },
      spec(['| `href` | `string` | none | |']),
      [
        typesOf('Sample', {
          props: [prop('href', { description: 'Renders an <a> when set; use {{ x }} or `<b>`.' })],
        }),
      ],
    )
    expect(page).toMatch(/^---\ntitle: "Toggle: \\"on\\" #2"\n---\n/)
    expect(page).toContain('title="Toggle: &quot;on&quot; #2"')
    expect(page).toContain('Renders an &lt;a&gt; when set; use {{ x }} or `<b>`.')
    expect(page).toMatch(/::: v-pre\n\n\| Prop [\s\S]*\| `href` \|[\s\S]*\n\n:::\n/)
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

  it('keeps a guide as written, out of reach of the Vue template compiler', () => {
    // The container's marker outruns any `:::` inside, and frontmatter stays first.
    expect(guidePage('---\ntitle: T\n---\n# Tokens\n\n::: tip\nUse {{ x }}.\n:::\n')).toBe(
      '---\ntitle: T\n---\n\n:::: v-pre\n\n# Tokens\n\n::: tip\nUse {{ x }}.\n:::\n\n::::\n',
    )
  })

  it('takes the sidebar title from the Markdown heading', () => {
    expect(docsItems().map((entry) => entry.title)).toEqual([
      'Accordion',
      'Alert',
      'Avatar',
      'Badge',
      'Button',
      'Card',
      'Checkbox',
      'Dialog',
      'Dropdown Menu',
      'Input',
      'Label',
      'Popover',
      'Progress',
      'Radio Group',
      'Select',
      'Separator',
      'Skeleton',
      'Switch',
      'Tabs',
      'Textarea',
      'Toast',
      'Tooltip',
    ])
  })
})

describe('the get started pages', () => {
  const docs = join(import.meta.dirname, '../apps/docs')
  const start = [
    ['getting-started', 'Getting started'],
    ['installation-vite', 'Installation with Vite'],
    ['installation-nuxt', 'Installation with Nuxt'],
    ['theming', 'Theming'],
    ['dark-mode', 'Dark mode'],
  ] as const

  it.each(start)('start/%s.md exists and is in the sidebar as %s', (name, title) => {
    expect(markdownTitle(readFileSync(join(docs, 'start', `${name}.md`), 'utf8'))).toBe(title)
    const config = readFileSync(join(docs, '.vitepress/config.ts'), 'utf8')
    expect(config).toContain(`{ text: '${title}', link: '/start/${name}' }`)
  })

  // The end-to-end templates pin the TypeScript the items are tested with. An unpinned
  // `typescript` installs the newest major, which Vue's SFC compiler may not load (TypeScript 7
  // fails every `defineProps<ImportedType>()`), so the docs pin the same major.
  it('installs the TypeScript major the end-to-end templates test', () => {
    const templates = join(import.meta.dirname, 'cli-e2e/templates')
    for (const template of ['vite', 'nuxt']) {
      const pkg = JSON.parse(readFileSync(join(templates, template, 'package.json'), 'utf8')) as {
        devDependencies?: Record<string, string>
      }
      const major = pkg.devDependencies?.typescript?.match(/\d+/)?.[0]
      expect(major, `${template} template pins typescript`).toBeDefined()
      for (const [name] of start) {
        const page = readFileSync(join(docs, 'start', `${name}.md`), 'utf8')
        for (const line of page.split('\n').filter((l) => /^npm (install|i)\b/.test(l))) {
          const ts = line.split(/\s+/).find((word) => /^typescript(@|$)/.test(word))
          if (ts) expect(ts, `${name}: ${line}`).toBe(`typescript@${major}`)
        }
      }
    }
  })

  it('has a component page for every Tier 1 item', () => {
    const ui = join(import.meta.dirname, '../registry/ui')
    const tier1 = readdirSync(ui).filter((name) => {
      try {
        const item = JSON.parse(readFileSync(join(ui, name, 'item.json'), 'utf8')) as {
          meta?: { tier?: number }
        }
        return item.meta?.tier === 1
      } catch {
        return false
      }
    })
    expect(tier1.length).toBeGreaterThan(0)
    const documented = docsItems().map((item) => item.name)
    for (const name of tier1) expect(documented, name).toContain(name)
  })
})
