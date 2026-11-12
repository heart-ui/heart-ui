# P0-08 Registry helpers and build

## Why

**Request (verbatim):** "autopilot" (next ready task: P0-08)

Task [P0-08](../../../tasks/phase-0.md#p0-08-registry-helpers-and-build): the `utils` (`cn`) and `icon` helpers every
component imports, and `pnpm registry:build`, which turns each item's `item.json` and files into the shadcn-format
JSON the CLI installs from, per [registry.md](../../registry.md).

**The user's words:** run unattended ("continue without my attend", then "autopilot").

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| Validate with `ajv` 8 (draft-07, the upstream schemas' draft) | hand-written checks | The task asks for validation against the upstream schema; a JSON Schema validator is the way to do that. Logged in `docs/questions.md`. |
| An `item.json` key the upstream item schema doesn't define fails the build; `meta` is checked against `scripts/registry-schemas/meta.schema.json`, which allows only registry.md's fields | rely on the upstream schema | Upstream allows extra keys (`additionalProperties` unset), so "unknown field fails" needs its own check. |
| Upstream schemas committed to `scripts/registry-schemas/` with a README giving the URLs and fetch date (2026-11-12) | fetch at build time | Builds stay offline and reproducible; the task asks for a committed copy. |
| A folder under `ui/`, `blocks/` or `layouts/` holding only demos, tests or docs is a fixture and is skipped; one with other source but no `item.json` fails | require `item.json` everywhere | The placeholder demo (P0-04) is a fixture, not a shippable item; a forgotten `item.json` still fails. Logged in `docs/questions.md`. |
| `Icon` is a TypeScript render-function component in `registry/lib/icon/icon.ts` over `@iconify/vue`, always `aria-hidden` | an SFC | A lib helper, not a `registry/ui` component; renders in Node tests without a Vue compiler. Accessible names belong to the control that holds the icon. |
| The build runs as `node scripts/registry-build.ts` (Node's type stripping) | `tsx` or a compile step | No new dependency; Node 22.18+ runs erasable TypeScript. |
| Themes (`registry/themes/*.json`) are not built yet | build them now | No theme file exists before P0-05, and knob files are not `item.json`s. |

**Proposals not asked for:** None

## Acceptance criteria

- **AC-001** registry.md §Registry format: `pnpm registry:build` writes `dist/registry/registry.json` and `dist/registry/r/<name>.json` for `utils` and `icon`, each with every listed file's content, and both validate against the committed upstream schemas.
- **AC-002** Task Accept: an `item.json` with a field the upstream schema doesn't define fails the build, naming the item and the field.
- **AC-003** registry.md §Item metadata: `meta` with an unknown key, or a `version` that isn't semver, fails the build.
- **AC-004** An `item.json` that lists a file the folder doesn't have fails the build.
- **AC-005** A folder with only demo, test or doc files is skipped; a folder with source but no `item.json` fails the build.
- **AC-006** `cn()` joins conditional classes and lets the later Tailwind class win (`cn('p-2', false && 'x', ['p-4'])` → `p-4`).
- **AC-007** `Icon` renders the Fluent icon for an internal name (`check`, `chevron-down`, `close`, `search`, `spinner`), `aria-hidden="true"`, with `class` merged last.
- **AC-008** The upstream schemas are committed with their source URLs and fetch date.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | tests/registry-build.test.ts › registry:build › writes valid items and index | `pnpm vitest run tests/registry-build.test.ts -t "writes valid items and index"` |
| AC-002 | tests/registry-build.test.ts › registry:build › rejects an unknown item.json field | `pnpm vitest run tests/registry-build.test.ts -t "unknown item.json field"` |
| AC-003 | tests/registry-build.test.ts › registry:build › rejects invalid meta | `pnpm vitest run tests/registry-build.test.ts -t "invalid meta"` |
| AC-004 | tests/registry-build.test.ts › registry:build › rejects a missing listed file | `pnpm vitest run tests/registry-build.test.ts -t "missing listed file"` |
| AC-005 | tests/registry-build.test.ts › registry:build › fixture folders | `pnpm vitest run tests/registry-build.test.ts -t "fixture folders"` |
| AC-006 | tests/registry-helpers.test.ts › cn | `pnpm vitest run tests/registry-helpers.test.ts -t "cn"` |
| AC-007 | tests/registry-helpers.test.ts › Icon | `pnpm vitest run tests/registry-helpers.test.ts -t "Icon"` |
| AC-008 | tests/registry-build.test.ts › registry:build › upstream schema copy | `pnpm vitest run tests/registry-build.test.ts -t "upstream schema copy"` |

## Must never break

- `pnpm lint`, `pnpm typecheck` and a fresh-clone install stay clean.
- A failed build exits 1 with a message naming the item, never a stack trace.

## Out of scope

- Theme items (P0-05); hosting and versioned `/r/<name>@<version>.json` (CLI tasks); offline icon data for SSR and visual tests (logged in `docs/questions.md` for P0-07).

## Review

- **Recommended and chosen:** code, because `## Public Surface` isn't `- none` (a command, three exports, five dependencies); chosen by the trigger list (low risk, not asked).
- **Verdicts:** built-in `code-review high --max-findings all` → `.sdlc/.work/findings/2026-11-12-m-p0-08-registry-build/code-reviewer-r1.md` → FAIL (F2, F6 high). Round 2 closing check → FAIL (R2-1..R2-3: `--out` guards let `/` and case variants through); its report wasn't kept. Round 3 → `code-reviewer-r3.md` → FAIL (R3-1, R3-2 high). Round 4 (user typed "one more round") → `code-reviewer-r4.md` → FAIL (R4-1 high). Round 5 (user typed "one more round") closing check of the round 3 and 4 fixes → `code-reviewer-r5.md` → PASS.
- **Fixed:**
  - r1: F1, F2, F3, F4, F5, F6, F7, F8, F10, F11, F12, F15.
  - r3: `--out` is owned through a marker file listing what the build wrote, and the overlap check uses `realpathSync.native` (R3-1, R3-2, R3-5). Also symlinked `--registry` and kind folders (R3-3, R3-4), case variants and links in listed paths (R3-6, R3-13), names with `_` (R3-7), odd `--out` shapes (R3-8), dot-folders in fixtures (R3-9), the case test (R3-10), named read errors (R3-11), names starting `..` (R3-12), the empty-folder message (R3-14). Tests are in 'never deletes what it did not build' and 'links, case and odd names'.
  - r4: lowercase item names (R4-1, R4-7), a per-disk case test (R4-2), the overwrite check before any delete (R4-3), unlisted source files fail (R4-4), unknown top-level folders fail (R4-5), unknown arguments fail (R4-6), a null marker (R4-8), kind-folder errors (R4-9), symlinked item folders (R4-10). Tests are in 'names, flags and unlisted files'.
  - r5: broken links get a named error (R5-1, 'names a broken link instead of failing raw').
- **Tickets:**
  - F13 / R4-11: the index has no `homepage` (needs the domain from P0-01; the copied schema doesn't require it).
  - F14 / R4-16: tests spawn a process per case; call `buildRegistry` directly.
  - R4-14: the `chmod 000` tests fail as root (P0-09 CI runs as a normal user).
  - R4-12, R4-15, R5-2 are logged in `docs/questions.md`: relative imports between lib items, required `meta` per kind, and P2-03's `blocks/_fixtures`.
- **Declined:** R4-13 (an unknown icon name can't pass the `IconName` type), R4-17 (destructuring leaves an unused binding the lint rule rejects), R4-18 (Icon as a render function is a recorded decision).
- **Drift and manual checks:** the build is stricter than registry.md states: lowercase item names, unlisted source files fail, unknown top-level folders fail, and `--out` holds a marker file. Each is logged in `docs/questions.md` or under Deviations. Deviations: engines Node `>=22.18.0`; the `--out` marker; the name and input rules; exports `IconName`, `RegistryError`, `buildRegistry`. No `manual` ACs.
- **Lessons filed:** [knowledge/gotchas/registry-build.md](../../../knowledge/gotchas/registry-build.md)
