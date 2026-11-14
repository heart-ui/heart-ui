# Agent support

Markdown is the source of truth. The MCP server and `llms.txt` are views
over the same files, so they cannot drift apart.

## Agent docs

- Each item's `<name>.md` is published raw at `/docs/<name>.md`.
- `/llms.txt` lists every item: name, type, one-line description, URL.
  Layouts and blocks include `useWhen`.
- `/docs/layout-rules.md` and `/docs/tokens.md` are published from
  [layout-rules.md](layout-rules.md) and [tokens.md](tokens.md).
- A build script generates all of the above from `registry/`. No
  hand-written copies.

## MCP server

Package `@heart-ui/mcp`, stdio transport, built on the official TypeScript
MCP SDK. It reads the hosted registry (or a local path with
`--registry`). Tools are read-only except `audit_screen`, which reads
local files.

| Tool | Input | Returns |
| --- | --- | --- |
| `search_items` | `query`, optional `type`, `category` | Ranked items: name, type, description, `useWhen` |
| `get_item` | `name` | Item Markdown, `item.json` metadata, file list |
| `get_item_source` | `name` | File contents |
| `get_install_command` | `names[]` | The `heart-ui add` command line |
| `get_layout_rules` | none | `layout-rules.md` |
| `get_tokens` | none | Semantic token names and the utilities that map to them |
| `audit_screen` | `paths[]` | Checklist results, same as `heart-ui audit --json` |

Search is keyword scoring over name, description, categories, `useWhen`,
and `avoidWhen`. No embeddings.

## Project rule files

`heart-ui init` writes `AGENTS.md` (and appends a pointer to an existing
`CLAUDE.md`). Content, under 40 lines:

- Where components, blocks, and layouts live in this project.
- The screen workflow from [layout-rules.md](layout-rules.md#screen-workflow).
- "Use `heart-ui list` or the MCP `search_items` tool before writing new UI."
- The hard rules: semantic token utilities only, no raw values, one
  primary action, all four states.
- The command to verify: `heart-ui audit <files>`.

## Audit checklist

`heart-ui audit` checks screen files statically. Each check has an id used
in output and in benchmark scoring.

| Id | Check |
| --- | --- |
| `A1` | Uses a Heart UI layout as the root, or sits in a route under one |
| `A2` | No raw values (same rule as `no-raw-values`) |
| `A3` | No UI element built from bare HTML where a Heart UI component exists (`button`, `input`, `select`, `dialog`, `table`) |
| `A4` | At most one `variant="primary"` button per view |
| `A5` | Data regions handle `empty`, `loading`, and `error` |
| `A6` | No `reka-ui` import in app code |
| `A7` | Interactive elements have accessible names |
| `A8` | No modal opened from inside a modal |

## Benchmark

`benchmark/specs/` holds 20 written screen specs. `benchmark/run.ts`
creates a fresh project per spec, runs `heart-ui init`, starts Claude Code
headless with the spec and the MCP server, then scores the result.

A spec passes when all of these hold:

1. The project builds and the screen renders at 375, 768, and 1280 px
   without console errors.
2. `heart-ui audit` reports no failures.
3. axe reports zero violations.
4. The layout chosen is in the spec's `acceptedLayouts` list.
5. Every element in the spec's `mustInclude` list is present, checked by
   role and accessible name.

Pass rate = passed specs / 20. Results are written to
`benchmark/results/<date>.json` and summarized in the release notes.

Spec list:

| # | Screen | Accepted layouts |
| --- | --- | --- |
| 1 | Customer list with search, status filter, bulk delete | `list-filters` |
| 2 | Order detail with line items and timeline | `detail-page` |
| 3 | Sales dashboard with four stats and two charts | `dashboard` |
| 4 | Create-project form with eight fields | `form-page` |
| 5 | Four-step onboarding wizard | `form-page` |
| 6 | Account settings with profile, password, notifications | `settings` |
| 7 | Inbox with message list and reading pane | `list-detail` |
| 8 | Sign-in page with email, password, and reset link | `auth` |
| 9 | Product catalog as cards with category filter | `list-filters` |
| 10 | Team members table with invite dialog and role edit | `list-filters` |
| 11 | Invoice list with date range filter and export | `list-filters` |
| 12 | User profile page with activity feed | `detail-page` |
| 13 | Billing settings with plan cards and payment method | `settings` |
| 14 | Support ticket queue with assignee quick-edit drawer | `list-filters`, `list-detail` |
| 15 | File manager with upload panel and empty state | `list-filters` |
| 16 | Analytics page with date picker and data table | `dashboard`, `list-filters` |
| 17 | Edit-article form with autosave status and delete | `form-page` |
| 18 | Notification center with read and unread tabs | `list-filters`, `list-detail` |
| 19 | API keys page with create, reveal-once, and revoke | `settings`, `list-filters` |
| 20 | Admin audit log with filters and long content | `list-filters` |

Each spec file states the user, the primary task, the data shape, the
required elements, and the states to show. It never names a component.
