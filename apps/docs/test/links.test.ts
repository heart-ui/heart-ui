import { join } from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { describe, expect, it } from 'vitest'
import { itemLinks } from '../.vitepress/links.ts'

// Item Markdown is written for registry/ui/<name>/<name>.md and rendered at components/<name>.
const md = await createMarkdownRenderer(join(import.meta.dirname, '..'), {
  config: (instance) => instance.use(itemLinks),
})
const render = (source: string, relativePath = 'components/button.md') =>
  md.render(source, { relativePath })

describe('item links', () => {
  it('turns a link to another item into its page, with or without an anchor', () => {
    // This renderer has no cleanUrls, so VitePress adds `.html`; the site's build leaves it off.
    expect(render('[dialog](../dialog/dialog.md)')).toContain('<a href="./dialog.html">dialog</a>')
    expect(render('[dialog props](../dialog/dialog.md#props)')).toContain(
      '<a href="./dialog.html#props">dialog props</a>',
    )
  })

  it('turns a link to the page itself into an anchor', () => {
    expect(render('[props](button.md#props)')).toContain('<a href="#props">props</a>')
    expect(render('[props](./button.md#props)')).toContain('<a href="#props">props</a>')
  })

  it('keeps only the text of a link that leaves the site, in every link form', () => {
    const forms = [
      'See [rules](../../../docs/layout-rules.md).',
      "See [rules](../../../docs/layout-rules.md 'Rules').",
      'See [rules](../../../docs/layout-rules.md (Rules)).',
      'See [rules][r].\n\n[r]: ../../../docs/layout-rules.md',
      'See [rules].\n\n[rules]: ../../../docs/layout-rules.md "Rules"',
      '> See [rules][q].\n>\n> [q]: ../../../docs/layout-rules.md',
    ]
    for (const form of forms) {
      const html = render(form)
      expect(html, form).not.toContain('<a ')
      expect(html, form).toContain('rules')
      expect(html, form).not.toContain('[')
    }
    expect(render('See [`code` label](../../../docs/tokens.md).')).toBe(
      '<p>See <code>code</code> label.</p>\n',
    )
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

  it('touches only item pages', () => {
    expect(render('[rules](../docs/layout-rules.md)', 'index.md')).toContain('<a ')
  })
})
