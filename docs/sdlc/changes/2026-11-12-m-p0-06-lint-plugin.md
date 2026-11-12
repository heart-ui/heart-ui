# P0-06 Lint plugin

## Why

**Request (verbatim):** "ok, continue without my attend" (next ready task: P0-06)

Task [P0-06](../../../tasks/phase-0.md#p0-06-lint-plugin): `packages/eslint-plugin` with rules `no-raw-values` and
`no-reka-outside-ui`, enabled for `registry/` in the root config. The rules enforce constitution I (Reka only in
`registry/ui/`) and II (tokens only), per [tokens.md § Lint rule](../../tokens.md#lint-rule).

**The user's words:** run unattended, taking the recommended option at each decision.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| Also flag pixel and rem literals (`13px`, `1.5rem`) | only the five tokens.md bullets | Constitution II and CLAUDE.md list them as raw values and say the plugin enforces this. Logged in `docs/questions.md`. |
| Class checks look at the utility after the last variant; arbitrary *variants* (`data-[state=open]:`, `[&>svg]:`) are allowed | flag any `[` | tokens.md bans arbitrary-value classes; Reka styling depends on `data-[state=…]:` variants. |
| Named colors are flagged only in CSS: a `style` attribute, a color-taking CSS declaration in a string, or a style-object property such as `color` | any word that is a color name | Prop values and text like `'red'` are legitimate words; tokens.md is about styling. |
| Hex is skipped in `href`, `to` and `id` attributes | flag everywhere | `href="#add"` is an anchor, not a color. |
| Plugin in TypeScript, built with `tsdown` to `dist/`; the root config imports the built plugin, and a `prepare` script builds it on install | plain JS with no build | conventions name `tsdown` for Node packages; `prepare` keeps a fresh clone's `pnpm lint` and `pnpm test` working. |
| `no-reka-outside-ui` decides by the file's path: a `registry/` file outside `registry/ui/` may not import `reka-ui` or `reka-ui/*` (static, re-export or dynamic) | an option listing allowed folders | One rule from the constitution; no caller needs another folder. |

**Proposals not asked for:** None

## Acceptance criteria

Each `no-raw-values` criterion has a failing and a passing case in a `.vue` `<template>` and in `<script>`.

- **AC-001** tokens.md §Lint rule: hex colors are reported (`#0f172a`); `#app-root` is not.
- **AC-002** tokens.md §Lint rule: `rgb()`, `hsl()` and `oklch()` are reported; `var(--tre-primary)` is not.
- **AC-003** tokens.md §Lint rule: named colors in CSS are reported (`color: red`, `{ color: 'white' }`); the word `'red'` as plain text is not.
- **AC-004** tokens.md §Lint rule: Tailwind palette classes are reported (`bg-blue-500`, `hover:text-gray-700`, `text-white`); `bg-primary` and `text-muted-foreground` are not.
- **AC-005** tokens.md §Lint rule: arbitrary-value classes are reported (`w-[13px]`, `bg-[#fff]`, `w-(--x)`); `w-full` and `data-[state=open]:bg-surface` are not.
- **AC-006** tokens.md §Lint rule: `--tre-raw-*` references are reported; `--tre-primary` is not.
- **AC-007** tokens.md §Lint rule: the `dark:` variant is reported (`dark:bg-surface`, `md:dark:text-foreground`); the value `'dark'` is not.
- **AC-008** Pixel and rem literals are reported (`13px`, `1.5rem`); numeric spacing utilities (`p-4`, `gap-2`) are not.
- **AC-009** `no-reka-outside-ui` reports a `reka-ui` import, re-export or dynamic import in a `registry/` file outside `registry/ui/`, and allows it inside `registry/ui/`.
- **AC-010** The root ESLint config applies both rules to `registry/` files and not to files outside it.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | packages/eslint-plugin/test/rules.test.ts › no-raw-values hex colors | `pnpm vitest run packages/eslint-plugin -t "hex colors"` |
| AC-002 | packages/eslint-plugin/test/rules.test.ts › no-raw-values color functions | `pnpm vitest run packages/eslint-plugin -t "color functions"` |
| AC-003 | packages/eslint-plugin/test/rules.test.ts › no-raw-values named colors | `pnpm vitest run packages/eslint-plugin -t "named colors"` |
| AC-004 | packages/eslint-plugin/test/rules.test.ts › no-raw-values palette classes | `pnpm vitest run packages/eslint-plugin -t "palette classes"` |
| AC-005 | packages/eslint-plugin/test/rules.test.ts › no-raw-values arbitrary values | `pnpm vitest run packages/eslint-plugin -t "arbitrary values"` |
| AC-006 | packages/eslint-plugin/test/rules.test.ts › no-raw-values raw token references | `pnpm vitest run packages/eslint-plugin -t "raw token references"` |
| AC-007 | packages/eslint-plugin/test/rules.test.ts › no-raw-values dark variant | `pnpm vitest run packages/eslint-plugin -t "dark variant"` |
| AC-008 | packages/eslint-plugin/test/rules.test.ts › no-raw-values length literals | `pnpm vitest run packages/eslint-plugin -t "length literals"` |
| AC-009 | packages/eslint-plugin/test/rules.test.ts › no-reka-outside-ui | `pnpm vitest run packages/eslint-plugin -t "no-reka-outside-ui"` |
| AC-010 | tests/toolchain.test.ts › root config applies the TrevUI rules to registry/ only | `pnpm vitest run tests/toolchain.test.ts -t "TrevUI rules"` |

## Must never break

- `pnpm lint`, `pnpm typecheck` and a fresh-clone install stay clean; code outside `registry/` is not checked by these rules.

## Out of scope

- `<style>` blocks (ESLint doesn't parse them; conventions allow them only for keyframes).
- Checking that controls use the control token utilities (needs to know which element is a control).

## Review

- **Recommended and chosen:** code, because `## Public Surface` isn't `- none` (a new package, two rules, a root config change); chosen by the trigger list (low risk, unattended). Security did not fire.
- **Verdicts:** built-in `code-review high --max-findings all`, reports in `.sdlc/.work/findings/2026-11-12-m-p0-06-lint-plugin/`: r1 FAIL (F1, F2, F5, F6, F10, F11 high), r2 FAIL (R2-1, R2-2 high), r3 FAIL (R3-1, R3-2, R3-3 high), r4 PASS. Rounds 3 and 4 ran past the cap because the user replied "one more round" twice.
- **Fixed:** r1: named colors in SVG and color attributes; arbitrary dark variants; arbitrary opacity and typed var shorthand; palette opacity forms and `drop-shadow-*`/`text-shadow-*`; `reka-ui` through template literals, `require`, TS import types and import-equals; every JS/TS extension under `registry/`; plus anchor hex, built lengths, style writes, wider color properties, `*Label` text, cwd-relative path, stale dist, test gaps, pins and unit case. r2: path decided by the nearest `/registry/` segment, not the cwd (regression from r1); `*-class` attributes checked; one context resolver (`contextOf`) through ternaries, `??`, arrays, objects, template literals, TS wrappers, style writes, `setProperty` and `setAttribute`; quoted `url('#x')`; `px-4` concatenation; anchored arbitrary regex; narrower `dark` match; dynamic `reka-ui/${m}`; `filter`, `color-mix`, `light-dark`; sandbox copies the plugin. r3: object-syntax `:class` and `cn({…})` keys checked (regression from r2); bound camelCase class props via `rawName`; `*Label` from the nearest name only; hex skip from the nearest name; `:ui`, `classes`, `className`, `*Classes`; `light-dark()` as a dark variant and token-only `color-mix()` allowed (docs/questions.md); `group-dark:`, `peer-dark:` and the media variant; `n + \`px\``; arrow-function bodies; `tsdown --no-clean`. r4: TS import-type and module-declaration paths skipped; `*Label` through chained `+`; hex skip past a runtime prop's `default` and for `id`; named `group-dark/x:`; class maps under class-ish property names; kebab routes not read as opacity modifiers. Each has a case in `packages/eslint-plugin/test/rules.test.ts`.
- **Tickets:** anchors through calls, concatenation, `querySelector` and title text (R3-10); color-property names matched by substring (R3-11); computed keys and identifier arguments (R3-12); `defineProps` color defaults and `computed()` values (R3-13); the `x` expression placeholder (R3-15); a folder named `registry` inside a ui item (R3-17); aliased style objects (R2-15); vue-eslint-parser AST types instead of hand-written ones (F16); `w += 'px'` (R4-6); the in-place dist rewrite can still race a concurrent lint load, so build atomically (R4-9); prose script strings read as class lists (R4-10). A changeset waits for Changesets in P0-09.
- **Drift and manual checks:** Decisions predate review: hex is also skipped in `xlink:href`, `for` and, as properties, `href`, `hash` and `id`; named colors are also reported in color attributes and props, not only CSS; class lists include `*-class`, `classes`, `className`, `ui` and class helpers; the root config imports `packages/eslint-plugin/dist/index.mjs` by path (no workspace dependency) and `pnpm lint` and `pnpm test` build the plugin first. Deviations: red recorded with `src/` moved aside; the `light-dark` test expectation follows the questions.md decision; internal exports `findProblems`, `hasNamedColor`, `isColorProperty`, `colorProperties` (removed), `namedColors`, `CheckOptions`. No `manual` ACs.
- **Lessons filed:** [knowledge/gotchas/lint-rules.md](../../../knowledge/gotchas/lint-rules.md)
