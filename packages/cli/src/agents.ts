import type { Config } from './config.ts'

/** Starts the Heart UI block in AGENTS.md, so `init` adds it once. */
export const AGENTS_MARKER = '<!-- heart-ui:start -->'

/** The Heart UI section of AGENTS.md (docs/agent-support.md, Project rule files). */
export function agentsBlock(config: Config, folder: (alias: string) => string): string {
  const { ui, blocks, layouts, lib } = config.aliases
  return `${AGENTS_MARKER}
# Heart UI

This project builds its UI from Heart UI: Vue components copied in as source you own.

- Components: \`${ui}\` (${folder(ui)})
- Blocks: \`${blocks}\` (${folder(blocks)})
- Layouts: \`${layouts}\` (${folder(layouts)})
- Helpers: \`${lib}\` (${folder(lib)})
- Theme: ${config.css}, which imports tokens.css

## Building a screen

1. Write a brief: the user, the one primary task, content ranked by importance, the primary action.
2. Pick one layout from the catalog. Justify it against its \`useWhen\`.
3. Fill each region with blocks. Add bare components only where no block fits.
4. Build the empty, loading, error, and long-content states.
5. Screenshot at 375, 768, and 1280 px. Run \`heart-ui audit\`. Fix findings.

Use \`heart-ui list\` or the MCP \`search_items\` tool before writing new UI.

## Rules

- Semantic token utilities only: \`bg-primary\`, \`text-muted-foreground\`, \`h-control-md\`.
- No raw values: no hex or named colors, no pixel or rem literals, no Tailwind palette or arbitrary-value classes.
- One primary action per view.
- Every data region handles empty, loading, error, and long content.

## Verify

Run \`heart-ui audit <files>\` on every screen you change.
<!-- heart-ui:end -->
`
}
