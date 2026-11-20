# P2-59 Agent context: API index and skill

## Why

**Request (verbatim):** P2-59 Agent context: API index and skill (tasks/phase-2.md): a generator that turns the registry's *.api.json and useWhen fields into (1) a compact API index, one line per item with its import path and props as literal unions, at most 8 KB, and (2) a SKILL.md holding the conventions and a "need X → use Y" table; both published with the registry; init places the index in AGENTS.md (P2-50) and the skill where agents load skills (check the current skills convention upstream before building). Accept: the index lists every registry item and fits in 8 KB; a new item appears in both files after pnpm registry:build with no hand edits.

The task is [tasks/phase-2.md, P2-59](../../../tasks/phase-2.md#p2-59-agent-context-api-index-and-skill); the content rules are in [agent-support.md, Project rule files](../../agent-support.md#project-rule-files). An index always in the agent's context beat on-demand skills in Vercel's evals, so agents get heart-ui's real API without guessing.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| This task builds and publishes the two files; installing them into a project is P2-50 (`init`), which the task names and which depends on this one | Changing `init` here | One intent per change; P2-50 owns `init`. |
| `scripts/agent-context.ts` generates both from the registry's `item.json` and committed `<name>.api.json`; `registry:build` writes them to `agents/api-index.md` and `skills/heart-ui/SKILL.md` in its output, which `registry:publish` uploads | A separate command | "A new item appears in both files after `pnpm registry:build`." |
| Index: a heading per kind naming its alias (`## ui: \`@/components/ui\``), then `- <name>[/<module>]: <exports> — <Component> <props>`. The module is the item's `index.ts`, else its one top-level `.ts` file; the exports are its value exports (TypeScript parser; default exports and `*Variants` helpers left out). Props: literal unions (`true`, `false`, `null` included) as `name: 'a'\|'b'`, booleans as `name?`; other props, Reka's `as`/`asChild` and the standard `size` left out. Descriptions are in the skill's table only | One self-contained import line per item with its description (6.5 KB for 18 items, ~350 bytes a line) | An agent copies paths and names as written, so they must resolve; Phase 2 plans 61 items, so a line must average under ~130 bytes (now 122). |
| The build fails when the index is over 8 KB, naming its size | A warning | The budget is the task's acceptance; a silent overflow would cost every agent context. |
| `SKILL.md` follows the Agent Skills spec read upstream on 2026-11-20 (agentskills.io/specification, vercel-labs/skills): frontmatter `name: heart-ui` (matching its folder) and a `description` under 1,024 characters; body under 500 lines. Item text reaches both files as written, on one line; a template without `{{items}}` fails. The conventions are hand-written in `scripts/skill-template.md`; the "need X → use Y" table is generated, one row per item (a block or layout's `useWhen`, else its description) | A hand-kept skill | No hand edits for new items; the conventions change rarely and stay reviewable. |
| `npx skills add https://registry.heart.tammai.me/skills/heart-ui/SKILL.md` works: the CLI takes a direct `SKILL.md` URL | A separate skills repository | Nothing more to host. |

## Acceptance criteria

- **AC-001** `registry:build` writes `agents/api-index.md`: a heading per kind with its alias and one line per item in `registry.json`, each with a path that resolves and the entry module's named value exports (never a default export); component items list their literal-union and boolean props. At most 8,192 bytes now, and at the current bytes per line for the 61 items Phase 2 plans.
- **AC-002** `registry:build` writes `skills/heart-ui/SKILL.md` with frontmatter `name: heart-ui` and a `description` of 1 to 1,024 characters, the conventions, and a "need → use" table with one row per item (a block or layout's non-blank `useWhen`, else its description); under 500 lines. Item text reaches the table as written, on one line; a template without `{{items}}` fails.
- **AC-003** A new item (with its snapshot) appears in both files after `registry:build`, with no other edit; a snapshot that is not JSON fails the build naming its file.
- **AC-004** The build's marker lists both files and the publish plan uploads them.
- **AC-005** The build fails, naming the size, when the index is over 8 KB.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | tests/agent-context.test.ts › AC-001 the API index; › AC-001 default exports are not listed as named imports | `pnpm exec vitest run tests/agent-context.test.ts -t "AC-001"` |
| AC-002 | tests/agent-context.test.ts › AC-002 the skill; › AC-002 item text reaches the skill as written | `pnpm exec vitest run tests/agent-context.test.ts -t "AC-002"` |
| AC-003 | tests/agent-context.test.ts › AC-003 a new item appears in both; › AC-003 a snapshot that is not JSON fails the build by name | `pnpm exec vitest run tests/agent-context.test.ts -t "AC-003"` |
| AC-004 | tests/agent-context.test.ts › AC-004 published with the registry | `pnpm exec vitest run tests/agent-context.test.ts -t "AC-004"` |
| AC-005 | tests/agent-context.test.ts › AC-005 the 8 KB budget | `pnpm exec vitest run tests/agent-context.test.ts -t "AC-005"` |

## Must never break

- `registry:build` still writes every item and the index as before, and refuses to write into its sources.
- Item and description text from the registry is the repo's own; nothing from outside reaches these files.

## Out of scope

- `init` writing `AGENTS.md` and installing the skill (P2-50); `llms.txt` and `/docs/<name>.md` (P2-48).

## Review

One round, `code-review high`: nine findings, all fixed test-first.

| Finding | Fix |
|---|---|
| `utils` line imported `'@/lib/utils'`, which does not resolve (no `index.ts`) | The import names the entry module: `index.ts`, else the one top-level `.ts` (`'@/lib/utils/utils'`) |
| Items without `.vue` exports got `import from '…'`, naming nothing (`icon`, `utils`, `form-control`) | The import lists the entry's value exports from the TypeScript parser (`cn`, `Icon`, `toast`, `useToast`); an item with none shows its path alone |
| `false \| true \| 'indeterminate'` showed as the bare prop name | `true`, `false`, `null`, `undefined` count as literals |
| `$$`, `$&`, `$'` in item text were expanded by `String.replace` | Function replacer |
| A broken `<name>.api.json` crashed with a bare `SyntaxError` | Fails with `<kind>/<name>/<name>.api.json: is not valid JSON`; a component without `props` fails too |
| A multi-line description broke the one-line index | Collapsed to one line (descriptions later moved to the skill only) |
| A template without `{{items}}` published a skill with no table | Fails the build |
| The skill named a `table` item (P2-14) and `/docs/<name>.md` pages (P2-48) that don't exist yet | Rule now points at the table's items; docs link dropped until P2-48 |
| `INDEX_BUDGET` exported but unused outside | Not exported; `template` parameter kept, the AC-002 test uses it |

Round 2 (closing check), `code-review high`: six findings, no high; all fixed.

| Finding | Fix |
|---|---|
| The index was 6.5 KB for 18 items, so the tier-2 components would pass 8 KB within a few tasks | Compact format (Decisions); 2,565 bytes now, 7.8 KB projected for 61 items, and AC-001 checks that projection |
| `export { default }` or `export default function` gave `import { default }` | Default exports are left out |
| The index names the default aliases; a project with its own aliases gets paths that don't resolve | `docs/agent-support.md`: `init` (P2-50) rewrites them as `add` rewrites item imports |
| The skill's workflow asked for a layout the registry doesn't have yet | Step 2 says to compose from components when none fits |
| The skill pointed only at `AGENTS.md`, which a standalone `skills add` never writes | Also points at the published `/agents/api-index.md` |
| A blank `useWhen` gave an empty Need cell | A blank `useWhen` falls back to the description |
