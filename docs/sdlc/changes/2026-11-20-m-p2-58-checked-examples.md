# P2-58 Type-checked spec examples

## Why

**Request (verbatim):** P2-58 Type-checked spec examples (tasks/phase-2.md): every vue block under ## Usage and ## Do in an item's <name>.md is type-checked against the registry with vue-tsc strictTemplates (unknown props, events and components fail); ## Do not blocks skipped; a Usage example with a made-up prop fails pnpm check; every existing item passes

The task is [tasks/phase-2.md, P2-58](../../../tasks/phase-2.md#p2-58-type-checked-spec-examples), from the agent-first proposal. Agents copy spec examples; an example with a prop that doesn't exist teaches the mistake the library is trying to prevent.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| `scripts/spec-examples.ts` turns each `vue` block under `## Usage` and `## Do` into a component in an ignored folder under `dist/` and runs `vue-tsc` with `strictTemplates` over them, reporting only errors in those files, as `<spec>.md:<line>` | Type-checking the registry with `strictTemplates` | The registry's own components are checked by `pnpm typecheck` already; strict mode there is a separate change. |
| The page state an example reads (`save`, `country`) is declared `any`, found with Vue's own template compiler (`prefixIdentifiers`); the registry components it uses are imported from their items (named exports of `.vue` re-exports and of `lib` items) | Requiring a `<script setup>` in every example | Specs show markup; the state around it is the page's. |
| Fallthrough attributes are blanked out of the template before checking (not filtered from the errors, since TypeScript reports one unknown key per element): global HTML attributes, `aria-*`, `data-*` and element events on any component; form attributes and events only on a component that renders a native field; never field state (`value`, `checked`, `selected`). Any other unknown prop or event fails | `strictTemplates` as is | It flags `id`, `aria-label` and `@click` on every component, which the conventions use; a made-up prop like `frobnicate` still fails. |
| Framework components an example may show without importing: `RouterView`, `RouterLink`, `NuxtLink`, `NuxtPage`, `NuxtLayout` and Vue's built-ins. Tooltip's `<App />` becomes `<RouterView />` | Allowing any unknown tag | An unknown component must fail. |
| The checkbox Do example bound `modelValue` twice (`v-model` and `:model-value`); it becomes `:model-value` with `@update:model-value` | Skipping it | The check found a real mistake in a spec. |
| `pnpm typecheck` runs the check after `vue-tsc`; `check:item <name>`'s typecheck step runs it for that item | A new check step | `check.test` fixes the step list; examples are type checks. |

## Acceptance criteria

- **AC-001** Every existing spec's Usage and Do examples type-check: `node scripts/spec-examples.ts` exits 0.
- **AC-002** A Usage example with a made-up prop fails, printing the spec's path and the line of the prop and naming it.
- **AC-003** A made-up event and an unknown component fail the same way.
- **AC-004** `## Do not` examples are not checked; examples may read page state and use standard HTML attributes, `aria-*`, `data-*` and native DOM events on components.
- **AC-005** `pnpm typecheck` (part of `pnpm check`) and `check:item <name>`'s typecheck step run the check.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | tests/spec-examples.test.ts › AC-001 every spec example type-checks | `pnpm exec vitest run tests/spec-examples.test.ts -t "AC-001"` |
| AC-002 | tests/spec-examples.test.ts › AC-002 a made-up prop fails | `pnpm exec vitest run tests/spec-examples.test.ts -t "AC-002"` |
| AC-003 | tests/spec-examples.test.ts › AC-003 a made-up event or component fails | `pnpm exec vitest run tests/spec-examples.test.ts -t "AC-003"` |
| AC-004 | tests/spec-examples.test.ts › AC-004 what an example may use | `pnpm exec vitest run tests/spec-examples.test.ts -t "AC-004"` |
| AC-005 | tests/spec-examples.test.ts › AC-005 the gates run it | `pnpm exec vitest run tests/spec-examples.test.ts -t "AC-005"` |

## Must never break

- The docs pages still render every spec (their tests pass), with the two fixed examples.
- `pnpm typecheck` keeps checking everything it checked before.

## Out of scope

- `strictTemplates` for the registry's own components and the playgrounds.

## Review

- **What fired and why:** code (the Public Surface adds `scripts/spec-examples.ts`). Security did not fire: no sensitive area, and the script reads the repo's own specs. Chosen by the trigger table (low risk, not asked).
- **Rounds and verdicts** (reports in `.sdlc/.work/findings/2026-11-20-m-p2-58-checked-examples/`):
  - Round 1: code-review FAIL. C1 (high): a made-up prop after an allowed attribute passed, since TypeScript reports one unknown key per element. C2 (high): a failing `vue-tsc` read as success. C3 and C4 (medium): the allowlist was too broad; block and layout specs couldn't import their items. C5 to C9 (low).
  - Round 2: code-review PASS (no high). Its medium and low bugs (R2C1 to R2C10) were fixed test-first and closed by `verify.py`.
- **High findings and what fixed them:**
  - C1: fallthrough attributes are blanked out of the template (from Vue's parsed template, v-if branches included) before `vue-tsc` runs, so every other unknown prop is reported.
  - C2: any `vue-tsc` error the check can't place, or a failing run with no error, fails the check; registry files may only show strict-mode diagnostics, not module-resolution failures.
- **Other fixes:** form attributes reach only components whose native field takes `$attrs`, plus attributes a component reads itself (`attrs.required`); declared props and events (from the committed API snapshots) are never blanked; field state never falls through; blocks and layouts resolve; every fence is tracked and closes as CommonMark says; full components are refused; `--item` is validated and covers every spec that uses the item.
- **Spec fixes the check found:** checkbox's Do example bound `modelValue` twice; tooltip's `<App />` became `<RouterView />`.
- **Tickets:** none.
- **Drift and manual checks:** see the state file's Deviations. No `manual` AC.
- **Lessons filed:** `knowledge/gotchas/lint-rules.md` (TypeScript's one-unknown-key-per-literal rule, and `compileTemplate`'s transformed AST).

