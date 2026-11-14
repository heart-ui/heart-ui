import { posix } from 'node:path'
import type { MarkdownOptions } from 'vitepress'
import type { SitePage } from '../scripts/items.ts'

type MarkdownIt = Parameters<NonNullable<MarkdownOptions['config']>>[0]
type Token = ReturnType<MarkdownIt['parse']>[number]

/**
 * Pages generated from repo Markdown (items, guides) keep links written for the repo. A relative link is
 * resolved against the page's source: another published source becomes its site URL, the source itself an
 * anchor, and anything else (a doc or item the site doesn't publish) keeps only its text. Working on parsed
 * link tokens covers every Markdown link form and leaves code and images alone.
 */
export function siteLinks(md: MarkdownIt, { pages }: { pages: SitePage[] }) {
  md.core.ruler.push('heart-ui-site-links', (state) => {
    const page = pages.find((entry) => entry.file === state.env?.relativePath)
    if (!page) return
    for (const token of state.tokens) {
      if (token.type === 'inline' && token.children) {
        token.children = rewrite(token.children, page, pages)
      }
    }
  })
}

function rewrite(tokens: Token[], page: SitePage, pages: SitePage[]) {
  const dropped = new Set<number>()
  tokens.forEach((token, index) => {
    if (token.type !== 'link_open') return
    const href = token.attrGet('href') ?? ''
    if (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(href)) return
    const [path = '', hash] = href.split('#', 2)
    const anchor = hash === undefined ? '' : `#${hash}`
    const source = posix.normalize(posix.join(posix.dirname(page.source), path))
    const target = pages.find((entry) => entry.source === source)
    if (target === page) return token.attrSet('href', anchor || '#')
    if (target) return token.attrSet('href', `${target.url}${anchor}`)
    dropped.add(index)
    let depth = 0
    for (let close = index + 1; close < tokens.length; close++) {
      const type = tokens[close]?.type
      if (type === 'link_open') depth++
      if (type === 'link_close' && depth-- === 0) {
        dropped.add(close)
        break
      }
    }
  })
  return tokens.filter((_, index) => !dropped.has(index))
}
