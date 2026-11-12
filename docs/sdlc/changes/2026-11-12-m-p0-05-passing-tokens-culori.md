# P0-05 follow-up: passing token table and any CSS color

## Why

**Request (verbatim):** "The default theme doesn't match tokens.md exactly. <- how to fix", then chose "Update tokens.md (Recommended)"; "primary accepts only hex, rgb(), hsl() and oklch() ... If you want full CSS color parsing, I'd propose adding culori. <- do it"; "New devDependencies: tsdown, vitest and tailwindcss in packages/theme. <- ok".

Follow-up to [P0-05](2026-11-12-m-p0-05-theme-package.md), on the same branch, before review. The semantic table in [tokens.md](../../tokens.md) maps steps that fail its own contrast rule, so the generator moved 11 tokens for the default theme. Every scale shares the table's lightness, so those steps fail for almost any primary. The table now names steps that pass. The maintainer authorized the token-value change. `primary` also takes any CSS color, as tokens.md says, through `culori`.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| New tokens.md values. Light `border-control` 500. Dark: `muted-foreground` 300, `subtle-foreground` 400, `border-control` 500, `ring` primary-500, `primary` / `primary-hover` / `primary-active` 400 / 300 / 200, each status `<s>` 400. | retune the lightness table; keep the moves | The values the generator already landed on, except `ring`. Dark `ring` goes to primary-500 (about 4.2:1 on neutral-950, above the 3:1 a ring needs), so it no longer shares a step with `primary-hover`. `success` moves to 400 too, so the four statuses keep one mapping. |
| The contrast moves stay as a safety net for unusual knobs | remove them | tokens.md still says a failing token moves. A custom neutral or primary can still fail. |
| Parse `primary` with `culori` 4.0.2 (`parse` and `converter('oklch')`). Translucent colors are rejected, and a gray gets hue 0. The OKLCH math, gamut clamping and contrast stay hand-written. | hand-written parser; culori for everything | The parser is where "any CSS color" needed a library. The rest is small, tested and follows tokens.md's clamping rule exactly. |
| `culori` is a runtime `dependency` of `@trevui/theme`, imported from `culori/fn` with only the CSS Color 4 modes registered; `@types/culori` 4.0.1 a devDependency, proposed in the PR (not named in the approval) | — | `generateTheme` parses at run time. The maintainer approved `culori`, and also the earlier devDependencies `tsdown`, `vitest` and `tailwindcss`. |

## Acceptance criteria

- **AC-001** tokens.md §Semantic layer: with the default knobs, every contrast pair passes with no adjustments, so `tokens.css` emits exactly the tokens.md table.
- **AC-002** tokens.md §Contrast: a failing token still moves one step at a time toward more contrast. When the foreground is at the end of its scale, the background moves with its states and ring, and they stay distinct.
- **AC-003** tokens.md §Knobs: `primary` accepts any opaque CSS color `culori` parses: named colors, `lab()`, `hwb()`, `color(display-p3 …)`, as well as hex, `rgb()`, `hsl()` and `oklch()`. Translucent and unparseable values throw.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | packages/theme/test/theme.test.ts › checkContrast › default theme needs no moves | `pnpm vitest run packages/theme/test/theme.test.ts -t "needs no moves"` |
| AC-002 | packages/theme/test/theme.test.ts › contrast moves | `pnpm vitest run packages/theme/test/theme.test.ts -t "contrast moves"` |
| AC-003 | packages/theme/test/theme.test.ts › knobs › any CSS color | `pnpm vitest run packages/theme/test/theme.test.ts -t "any CSS color"` |

## Must never break

- Every P0-05 acceptance test still passes; `tokens.css` is regenerated and its diff matches the tokens.md change.

## Out of scope

- Retuning the raw lightness table; the open questions on status colors as text and per-theme scoping (`docs/questions.md`).

## Review

- **Recommended and chosen:** code, because `## Public Surface` adds a dependency (`culori`); chosen by the trigger list (low risk, not asked).
- **Verdicts:** built-in `code-review high --max-findings all` → `.sdlc/.work/findings/2026-11-12-m-p0-05-passing-tokens-culori/code-reviewer-r1.md` → FAIL (F1–F4 medium, all in the new parser). Round 2 closing check → `code-reviewer-r2.md` → PASS (two lows, fixed in the same pass).
- **Fixed:**
  - F1: hues outside 0–360 are normalized.
  - F2: alpha `none` (transparent) is rejected.
  - F3, L1: `none` lightness, chroma or channel means 0, as in CSS.
  - F4, L2: `rgb()`, hex and named channels clamp as browsers do; `color(srgb …)` doesn't.
  - F6: the color tests check hue and chroma.
  - F7: the scale helpers are shared.
  - F8: `culori/fn` with only the CSS Color 4 modes registered.
  - F5, F10: the gotcha is updated, and tokens.md describes the group move.
  - Each fix has a test under 'knobs › accepts any CSS color' or 'rejects'.
- **Kept:** F9: `@types/culori` 4.0.1 is proposed in the PR, since the approval named only `culori`. Without it, the fallback is a local `.d.ts`.
- **Drift and manual checks:**
  - The tokens.md semantic table changed (maintainer-authorized), and `tokens.css` was regenerated to match. The default theme now needs zero moves.
  - The two P0-05 tests that relied on the default theme's moves now use crafted scales.
  - The `none`-chroma and `none`-lightness rejection cases from round 1 became accepts, because CSS reads `none` as 0 (L1).
  - Not checked: `hsl()` saturation above 100%.
  - No `manual` ACs.
- **Lessons filed:** [knowledge/gotchas/theme.md](../../../knowledge/gotchas/theme.md) (culori traps)
