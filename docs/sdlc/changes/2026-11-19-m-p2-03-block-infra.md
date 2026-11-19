# P2-03 Block infrastructure

## Why

**Request (verbatim):** P2-03 Block infrastructure (tasks/phase-2.md)

The task delivers four things: `meta` schema validation for blocks and layouts in the registry build, typed sample data in `registry/blocks/_fixtures`, a demo helper that switches between `empty`, `loading`, `error` and `long`, and visual runner support for the three widths. Every block and layout in Phase 2 (Recipe B) is built on these. Recipe B asks each demo for a state switch and for baselines "at 375, 768, and 1280 px for every state, preset theme, and mode". [layout-rules.md](../../layout-rules.md#states) says every data region renders all four states.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| Blocks must have `useWhen`, `avoidWhen`, `data` and `states` in `meta`; layouts also need `regions` | Requiring only `useWhen` | The P0-08 answer left required fields to "the first component and block tasks". The block-spec template fills every one of these, the agent docs and search read `useWhen` and `avoidWhen`, and the demo and visual runner read `states`. |
| A folder under `blocks/` or `layouts/` whose name starts with `_` is demo support. The build skips it and never ships it | A separate top-level `registry/fixtures` | The task names `registry/blocks/_fixtures`, and `_` can't start an item name (the name pattern), so it can never collide with an item. |
| The demo state is `default` (normal data) plus the item's `meta.states`. A demo folder with no `item.json` (a fixture such as `placeholder-block`) gets all four states | Only the four states | A block's normal view needs a baseline too. |
| The gallery reads `?state=` and provides it to the demo under the key `heart-demo-state`. `DemoStates` starts there and shows a button group to switch | Reading `location` in the helper | `location` isn't there in Nuxt's server render. Provide/inject works in both playgrounds and in the browser test harness. |
| The visual spec names block and layout baselines `<kind>-<name>-<state>-<theme>-<mode>-<width>.png`. ui names stay as they are | Renaming every baseline | The existing 160 ui baselines are untouched. |
| `placeholder-block` is a fixture (a demo, no `item.json`), like `ui/placeholder` | Shipping a placeholder item | It would appear in the public registry index. Its job is to prove the gate. |

**Proposals not asked for:** None.

## Acceptance criteria

- **AC-001** A block whose `meta` lacks `useWhen`, `avoidWhen`, `data` or `states` fails `registry:build`, and the error names the item and the field. A layout without `regions` fails the same way. A block with all of them builds.
- **AC-002** `registry/blocks/_fixtures` (any `_` folder under `blocks/` or `layouts/`) is skipped by the build and doesn't appear in the index.
- **AC-003** `registry/blocks/_fixtures` exports typed `customers`, `orders`, `activity` and `stats`. The data is deterministic, ids are unique, and every order and activity entry points at a real customer. Each list holds enough rows for a `long` state (at least 30), and there are four stats.
- **AC-004** `DemoStates` renders a labelled button group for `default` plus the given states. It starts in the state the gallery provides (falling back to `default` for an unknown one), and clicking a button shows that state and marks it pressed.
- **AC-005** Each block and layout demo is screenshotted in each of its states at 375, 768 and 1280 px, for every theme and mode, with `?state=` passed through both playgrounds. The axe and SSR demo tests also run each state.
- **AC-006** `pnpm check:item placeholder-block` passes: three widths and four states plus `default`.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | tests/registry-build.test.ts › block and layout meta | `pnpm exec vitest run tests/registry-build.test.ts -t "block and layout meta"` |
| AC-002 | tests/registry-build.test.ts › skips a demo-support folder | `pnpm exec vitest run tests/registry-build.test.ts -t "skips a demo-support folder"` |
| AC-003 | tests/block-fixtures.test.ts | `pnpm exec vitest run tests/block-fixtures.test.ts` |
| AC-004 | registry/blocks/_fixtures/DemoStates.test.ts | `pnpm --dir apps/playground-vite exec vitest run --config vitest.config.ts ../../registry/blocks/_fixtures/DemoStates.test.ts` |
| AC-005 | tests/visual-matrix.test.ts | `pnpm exec vitest run tests/visual-matrix.test.ts` |
| AC-006 | scripts/check.ts | `pnpm check:item placeholder-block` |

## Must never break

- The 160 existing ui baselines, their names and the ui demos' tests.
- Existing items still build. No ui or lib item gains a required field.

## Out of scope

- Real blocks and layouts (P2-20 on).
- The `audit` command (P2-04).

## Review

- **What fired and why (chosen by the trigger list: low risk, not asked):** code review, because `## Public Surface` lists the required meta fields. Security did not fire, because nothing here touches `areas.sensitive` and there is no changeset (no published package changes).
- **First attempt didn't count.** The first code-review run checked the merged P2-01 commit by mistake. It is not counted here, and its P2-01 findings are tickets (below).
- **Code review r1: FAIL, 9 findings, all fixed with a test first.**
  - C-01: `check:item` skipped the demo-support tests and lint.
  - C-02: a demo's state list could drift from `meta.states`. Now the galleries provide it.
  - C-03: the pressed toggle was a primary button.
  - C-04: buttons were `sm` below 768 px.
  - C-05: a literal `aria-label`. It is now the `groupLabel` prop.
  - C-06: the playgrounds read a repeated `?state=` differently.
  - C-07: a relative registry import, and the apps rule didn't list `state`.
  - C-08: a stray `_` file was skipped silently.
  - C-09: the fixture dates had a 13-day gap.
- **Code review r2 (closing check): PASS.**
  - C2-01 (medium): one bad `item.json` broke every demo. Fixed: it is now read defensively, with a test.
  - C2-02 to C2-05 (low): fixed. `check.ts` now lists every `_` folder, the apps rule names the Node-side type-import exception, the Nuxt page is keyed on its full path, and `DemoStates` uses `withDefaults`.
- **Note:** AC-004 above says `DemoStates` "renders a labelled button group for `default` plus the given states". After C-02 the states come from the gallery's provide (the item's `meta.states`), not from a prop. The Define sections are left as written.
- **Tickets:**
  - P2-01 follow-ups from the misdirected run:
    - the visual check compares only the primary color;
    - overlays teleported to `<body>` miss a scope set on a wrapper;
    - axe runs only under the default theme;
    - `presetRadius` is hard-coded in `tests/playgrounds.test.ts`;
    - the CLI preset map is listed by hand.
  - One verify run had 11 failures that did not reproduce: the full suite passed 854/854 on its own, and so did the next two verify runs.
- **Drift:** these are recorded in the state file's Deviations:
  - 150 placeholder-block baselines, listed for approval in docs/questions.md.
  - The `check.ts` and test changes, each shown red again at Base.
  - The internal exports.
- **Lessons filed:** knowledge/gotchas/test-harness.md (Node scripts import `.ts` with the extension; Vue server output wraps button text in a span).

