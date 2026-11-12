---
type: index
title: Knowledge map
description: Entry point. Read this, then open only the docs relevant to the task.
---

# Knowledge map

One line per doc: path — what it answers (≤12 words). Keep this file under ~80 lines; split into `<folder>/index.md` files when it grows.

The specs in `docs/` are the primary source (see `CLAUDE.md`). This folder holds what building teaches on top of them.

## Specs (in docs/)
- [docs/spec.md](../docs/spec.md) — product scope, goals, non-goals, release stages (the PRD)
- [docs/conventions.md](../docs/conventions.md) — layout, toolchain, item anatomy, API rules, definition of done
- [docs/tokens.md](../docs/tokens.md) — token layers, knobs, Tailwind mapping, no-raw-values rule
- [docs/registry.md](../docs/registry.md) — shadcn registry format, item metadata, CLI commands
- [docs/layout-rules.md](../docs/layout-rules.md) — screen workflow and arrangement rules for blocks, layouts
- [docs/agent-support.md](../docs/agent-support.md) — MCP server, agent docs, benchmark
- [docs/components/index.md](../docs/components/index.md) — component catalog and tiers
- [docs/questions.md](../docs/questions.md) — open gaps and conflicts, answered in place

## Conventions
-

## Decisions
-

## Gotchas
- [gotchas/lint-rules.md](gotchas/lint-rules.md) — context resolution and Vue parser traps in custom ESLint rules
- [gotchas/toolchain.md](gotchas/toolchain.md) — TS 7 vs vue-tsc, seeded-error tests, tsconfig and gitignore traps
- [gotchas/test-harness.md](gotchas/test-harness.md) — visual container runner, preview hosts, nuxt prepare, seeded sandboxes
- [gotchas/theme.md](gotchas/theme.md) — contrast moves, CSS color syntax, Tailwind namespaces for tokens
- [gotchas/registry-build.md](gotchas/registry-build.md) — safe --out deletion via marker, macOS case, broken links

## Runbooks
-

## Features
-
