import type { MarkdownOptions } from 'vitepress'

type MarkdownIt = Parameters<NonNullable<MarkdownOptions['config']>>[0]
type Token = ReturnType<MarkdownIt['parse']>[number]

/**
 * Item pages render Markdown written for `registry/ui/<name>/<name>.md`. On those pages a link to another
 * item becomes its page, a link to the item itself becomes an anchor, and any other relative link (repo docs
 * the site doesn't publish) keeps only its text. It works on parsed link tokens, so every Markdown link form
 * is covered, code and images are untouched, and links in the generated API tables follow the same rules.
 */
export function itemLinks(md: MarkdownIt) {
  md.core.ruler.push('heart-ui-item-links', (state) => {
    const page = /^components\/([a-z0-9-]+)\.md$/.exec(String(state.env?.relativePath ?? ''))?.[1]
    if (!page) return
    for (const token of state.tokens) {
      if (token.type === 'inline' && token.children) token.children = rewrite(token.children, page)
    }
  })
}

function rewrite(tokens: Token[], page: string) {
  const dropped = new Set<number>()
  tokens.forEach((token, index) => {
    if (token.type !== 'link_open') return
    const href = token.attrGet('href') ?? ''
    if (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(href)) return
    const [path = '', hash] = href.split('#', 2)
    const anchor = hash === undefined ? '' : `#${hash}`
    const other = /^\.\.\/([a-z0-9-]+)\/\1\.md$/.exec(path)?.[1]
    if (other) return token.attrSet('href', `./${other}${anchor}`)
    if (path === `${page}.md` || path === `./${page}.md`)
      return token.attrSet('href', anchor || '#')
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
