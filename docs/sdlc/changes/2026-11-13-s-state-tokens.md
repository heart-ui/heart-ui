# Danger and muted state tokens

## Why

**Request (verbatim):** "2 add tokens" (the recommendation: add `danger-hover`, `danger-active` and `muted-active`, following primary's steps).

The button had to fake hover and pressed states for `danger` with a brightness filter, and secondary had no pressed color, because [tokens.md](../../tokens.md) defines only `primary-hover` and `primary-active`. The input and dialog pilots will use `danger` too.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| `danger-hover` danger-700 / danger-300, `danger-active` danger-800 / danger-200 (light / dark), as primary's states; `muted-active` neutral-300 / neutral-600, one step past `muted-hover` | other steps | The maintainer chose primary's pattern. |
| Contrast pairs: `danger-foreground` on both danger states; `foreground` and `muted-foreground` on `muted-active`. A moving `danger` background takes its states with it, as `primary` does. | — | tokens.md: every foreground is checked against its background. |

## Acceptance criteria

- **AC-001** tokens.md §Semantic layer: `generateTheme` emits `danger-hover`, `danger-active` and `muted-active` in light and dark at the chosen steps, `theme.css` maps them, and the default theme still needs no contrast moves.
- **AC-002** tokens.md §Contrast: the new pairs are checked and pass.
- **AC-003** The button's danger variant hovers and presses with the new tokens, and secondary presses with `muted-active`.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | packages/theme/test/theme.test.ts › checkContrast › default theme needs no moves | `pnpm vitest run packages/theme/test/theme.test.ts -t "needs no moves"` |
| AC-002 | packages/theme/test/theme.test.ts › checkContrast › default theme passes every pair | `pnpm vitest run packages/theme/test/theme.test.ts -t "passes every pair"` |
| AC-003 | registry/ui/button/Button.test.ts › Button › hover | `pnpm test:browser registry/ui/button/ -t "state tokens"` |

## Must never break

- `pnpm check` passes; the approved button baselines don't change (hover and pressed states aren't in them).

## Review

- **Recommended and chosen:** no separate review. `## Public Surface` is none, the maintainer chose the token values, and the tests cover them: every new pair passes contrast, the default theme needs zero moves, and the approved button baselines are unchanged.
- **Verdicts:** `pnpm check` steps and verify passed. `tokens.css` gained exactly six lines (three tokens, light and dark).
- **Fixed:** the button's danger hover and pressed states use `danger-hover` and `danger-active` instead of a brightness filter; secondary presses with `muted-active`.
- **Drift and manual checks:** docs/questions.md already held the answer (67133d4). No `manual` ACs.
