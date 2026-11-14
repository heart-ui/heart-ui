import { join } from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { describe, expect, it } from 'vitest'
import { siteLinks } from '../.vitepress/links.ts'
import type { SitePage } from '../scripts/items.ts'

// Item and guide Markdown is written for its place in the repo and rendered at its site page.
const pages: SitePage[] = [
  {
    source: 'registry/ui/button/button.md',
    file: 'components/button.md',
    url: '/components/button',
  },
  {
    source: 'registry/ui/dialog/dialog.md',
    file: 'components/dialog.md',
    url: '/components/dialog',
  },
  { source: 'docs/layout-rules.md', file: 'guide/layout-rules.md', url: '/guide/layout-rules' },
  { source: 'docs/tokens.md', file: 'guide/tokens.md', url: '/guide/tokens' },
]
const md = await createMarkdownRenderer(join(import.meta.dirname, '..'), {
  config: (instance) => instance.use(siteLinks, { pages }),
})
const render = (source: string, relativePath = 'components/button.md') =>
  md.render(source, { relativePath })

// This renderer has no cleanUrls, so VitePress adds `.html`; the site's build leaves it off.
describe('site links', () => {
  it('turns a link to a published item or guide into its page, keeping the anchor', () => {
    expect(render('[dialog](../dialog/dialog.md)')).toContain(
      '<a href="/components/dialog.html">dialog</a>',
    )
    expect(render('[rules](../../../docs/layout-rules.md#detail-and-editing)')).toContain(
      '<a href="/guide/layout-rules.html#detail-and-editing">rules</a>',
    )
    expect(render('[tokens](tokens.md#knobs)', 'guide/layout-rules.md')).toContain(
      '<a href="/guide/tokens.html#knobs">tokens</a>',
    )
    expect(render('[button](../registry/ui/button/button.md)', 'guide/tokens.md')).toContain(
      '<a href="/components/button.html">button</a>',
    )
  })

  it('turns a link to the page itself into an anchor', () => {
    expect(render('[props](button.md#props)')).toContain('<a href="#props">props</a>')
    expect(render('[props](./button.md#props)')).toContain('<a href="#props">props</a>')
    expect(render('[top](layout-rules.md)', 'guide/layout-rules.md')).toContain(
      '<a href="#">top</a>',
    )
  })

  it('keeps only the text of a link to anything the site does not publish', () => {
    const forms = [
      'See [rules](../../../docs/conventions.md).',
      'See [rules](../input/input.md).',
      "See [rules](../../../docs/conventions.md 'Rules').",
      'See [rules](../../../docs/conventions.md (Rules)).',
      'See [rules][r].\n\n[r]: ../../../docs/conventions.md',
      'See [rules].\n\n[rules]: ../../../docs/conventions.md "Rules"',
      '> See [rules][q].\n>\n> [q]: ../../../docs/conventions.md',
    ]
    for (const form of forms) {
      const html = render(form)
      expect(html, form).not.toContain('<a ')
      expect(html, form).toContain('rules')
      expect(html, form).not.toContain('[')
    }
    expect(render('See [`code` label](../../../docs/registry.md).')).toBe(
      '<p>See <code>code</code> label.</p>\n',
    )
    expect(render('[tasks](../tasks/README.md)', 'guide/tokens.md')).not.toContain('<a ')
  })

  it('leaves code, images, anchors and external links alone', () => {
    expect(render('`handlers[name](event)`')).toContain('<code>handlers[name](event)</code>')
    expect(render('    indented [x](../../docs/a.md)')).toContain('indented [x](../../docs/a.md)')
    const fenced = render('```ts\nhandlers[name](../a.md)\n```').replace(/<[^>]+>/g, '')
    expect(fenced).toContain('handlers[name](../a.md)')
    expect(render('![Anatomy](./anatomy.png)')).toContain('<img src="./anatomy.png" alt="Anatomy"')
    expect(render('[up](#usage) [web](https://example.com)')).toMatch(
      /<a href="#usage">up<\/a> <a href="https:\/\/example.com"[^>]*>web/,
    )
  })

  it('touches only pages generated from a source', () => {
    expect(render('[rules](../docs/conventions.md)', 'index.md')).toContain('<a ')
  })
})
