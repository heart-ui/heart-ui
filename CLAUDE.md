# TrevUI

Open source Vue 3 UI library on Reka UI. Items (components, blocks, layouts,
themes) are source files copied into user projects by a CLI from a
shadcn-format registry. Package and CLI name: `trevui`.

## Read before working

| File | Read when |
| --- | --- |
| [docs/spec.md](docs/spec.md) | Once, for product scope and goals |
| [docs/conventions.md](docs/conventions.md) | Before writing any code |
| [docs/tokens.md](docs/tokens.md) | Before styling anything |
| [docs/components/index.md](docs/components/index.md) | Before building a component |
| [docs/registry.md](docs/registry.md) | Before touching the CLI or registry build |
| [docs/layout-rules.md](docs/layout-rules.md) | Before building a block or layout |
| [docs/agent-support.md](docs/agent-support.md) | Before touching the MCP server, agent docs, or benchmark |
| [tasks/README.md](tasks/README.md) | To pick the next task |

## Commands

| Command | Does |
| --- | --- |
| `pnpm install` | Install the workspace |
| `pnpm check` | Full gate: lint, types, unit, browser, axe, visual, SSR, registry build |
| `pnpm check:item <name>` | Same gate, scoped to one registry item |
| `pnpm dev:vite` / `pnpm dev:nuxt` | Run a playground |
| `pnpm registry:build` | Emit registry JSON to `dist/registry` |
| `pnpm test:visual --update` | Regenerate baselines. Human approval required. |

## Working loop

1. Take the first task in `tasks/` whose status is `todo` and whose
   dependencies are `done`. One task per branch and pull request.
2. Read the task, then every doc it links.
3. Implement. Copy the structure of the reference components named in
   [docs/conventions.md](docs/conventions.md#reference-components).
4. Run the task's check command until it passes.
5. Set the task status to `review`, list what changed, and stop.

## Hard rules

- Never mark a task `done`. A human does that after review.
- Never weaken a lint rule, test, or baseline to make a check pass.
- Never change a token value or name outside a task that says to.
- No raw values in `registry/`: no hex or named colors, no pixel or rem
  literals, no Tailwind palette or arbitrary-value classes.
- `reka-ui` imports only inside `registry/ui/`.
- User-facing text enters by prop or slot. The only literals allowed are
  English defaults of props named `*Label`.
- Do not add a dependency that the task or conventions do not name. Propose
  it in the pull request instead.
- Tasks with `owner: human` are not yours. Stop and report when one blocks you.
- When the docs conflict or leave a gap, add an entry to
  `docs/questions.md` and choose the option closest to the reference
  components. Do not guess silently.
- Check current upstream docs for Reka UI, Tailwind CSS v4, Nuxt 4, and the
  shadcn registry schema before using an API. Do not rely on memory.
