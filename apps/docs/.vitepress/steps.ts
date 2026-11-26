import type { MarkdownOptions } from 'vitepress'

type MarkdownIt = Parameters<NonNullable<MarkdownOptions['config']>>[0]
type Token = ReturnType<MarkdownIt['parse']>[number]

const numbered = /^\d+\.\s+/

// A run of `## 1. …`, `## 2. …` sections becomes a list of steps: each section in a `.step`, the run in a
// `.steps`, and the number moves from the heading's text to the step's marker (style.css). The heading keeps
// the id it was given from its full text, so links to it still land.
export function steps(md: MarkdownIt) {
  md.core.ruler.push('steps', (state) => {
    const html = (content: string) => {
      const token = new state.Token('html_block', '', 0)
      token.content = content
      return token
    }
    const out: Token[] = []
    let inRun = false
    let inStep = false
    for (let at = 0; at < state.tokens.length; at++) {
      const token = state.tokens[at]!
      const h2 = token.type === 'heading_open' && token.tag === 'h2' && token.level === 0
      const inline = h2 ? state.tokens[at + 1] : undefined
      const isStep = h2 && numbered.test(inline?.content ?? '')
      if (h2 || (token.type === 'heading_open' && token.tag === 'h1')) {
        if (inStep) out.push(html('</div>\n'))
        inStep = false
        if (inRun && !isStep) out.push(html('</div>\n'))
        if (!isStep) inRun = false
      }
      if (isStep && inline) {
        if (!inRun) out.push(html('<div class="steps">\n'))
        inRun = true
        inStep = true
        out.push(html('<div class="step">\n'))
        inline.content = inline.content.replace(numbered, '')
        const first = inline.children?.find((child) => child.type === 'text')
        if (first) first.content = first.content.replace(numbered, '')
      }
      out.push(token)
    }
    if (inStep) out.push(html('</div>\n'))
    if (inRun) out.push(html('</div>\n'))
    state.tokens = out
  })
}
