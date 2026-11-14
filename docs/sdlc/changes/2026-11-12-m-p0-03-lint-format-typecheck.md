# P0-03 Lint, format, typecheck

## Why

**Request (verbatim):** P0-03

Task [P0-03](../../../tasks/phase-0.md#p0-03-lint-format-typecheck): ESLint flat config, Prettier config and a `vue-tsc`
setup, with root scripts `lint`, `format` and `typecheck`, following the
[toolchain](../../conventions.md#toolchain). Every later task's check starts with `pnpm lint && pnpm typecheck`.

**The user's words:** "finish p0-02" (P0-02 closed first). TypeScript: "Pin 6.0.3". Lint dependencies: "Add all three"
(typescript-eslint, @eslint/js, eslint-config-prettier).

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| TypeScript 6.0.3 instead of P0-02's 7.0.2 | keep 7.0.2 | `vue-tsc` 3.3.14 crashes on TS 7 (`./lib/tsc` not exported: TS 7 has no JS compiler API), and typescript-eslint 8.72.2 accepts only `<6.1.0`. Chosen by the user; logged in `docs/questions.md`. |
| Add typescript-eslint, @eslint/js, eslint-config-prettier | config without them | TS can't be parsed without typescript-eslint; the other two are the setup eslint-plugin-vue's user guide prescribes. Chosen by the user; logged in `docs/questions.md`. |
| `lint` runs `eslint . && prettier --check .`; `format` runs `prettier --write .` | a separate `format:check` script | One gate command catches both, and every task check already runs `pnpm lint`. |
| Prettier skips Markdown, the lockfile, `.sdlc/`, `.claude/` and `.github/` | reformat them | markdownlint owns Markdown (realigning every docs table is outside this task); the rest is generated or managed by the sdlc plugin. |
| Prettier style: no semicolons, single quotes, width 100 | Prettier defaults | Matches the code P0-02 already committed, so formatting changes no file. |
| `eslint.config.js`, not `.ts` | a TS config | ESLint needs `jiti` to load a TS config, a dependency nobody named. |

**Proposals not asked for:** None

## Acceptance criteria

- **AC-001** Given the scaffold, when `pnpm lint` and `pnpm typecheck` run, then both exit 0, and the root `package.json` defines `lint`, `format` and `typecheck`.
- **AC-002** Given a project on `tsconfig.base.json` with a type error in a `.ts` file and one in a `.vue` `<script setup lang="ts">`, when `vue-tsc` checks it, then it exits non-zero and reports both files.
- **AC-003** Given the repo's ESLint config, when it lints a `.ts` file with a seeded error (`any`), then it reports an error.
- **AC-004** Given the repo's ESLint config, when it lints a `.vue` file with TypeScript in `<script setup lang="ts">` and a seeded Vue error (`v-for` without a key), then it parses the TypeScript and reports the Vue error.
- **AC-005** Given the repo's Prettier config, when it checks a `.ts` file with double quotes and semicolons, then the check fails, and formatting it gives single quotes and no semicolons.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | tests/toolchain.test.ts › lint and typecheck pass on the scaffold | `pnpm vitest run tests/toolchain.test.ts -t "pass on the scaffold"` |
| AC-002 | tests/toolchain.test.ts › vue-tsc reports type errors in .ts and .vue files | `pnpm vitest run tests/toolchain.test.ts -t "vue-tsc reports"` |
| AC-003 | tests/toolchain.test.ts › eslint reports a seeded error in a .ts file | `pnpm vitest run tests/toolchain.test.ts -t "in a .ts file"` |
| AC-004 | tests/toolchain.test.ts › eslint parses TypeScript in .vue and reports a seeded Vue error | `pnpm vitest run tests/toolchain.test.ts -t "Vue error"` |
| AC-005 | tests/toolchain.test.ts › prettier flags and fixes a misformatted file | `pnpm vitest run tests/toolchain.test.ts -t "prettier flags"` |

## Must never break

- `pnpm install --frozen-lockfile` on a fresh clone still installs with no warnings (P0-02's check).
- Formatting changes no committed file: `pnpm format` on the scaffold leaves `git status` clean.

## Out of scope

- `@heart-ui/eslint-plugin` rules for `registry/` (P0-06).
- `vue`, Tailwind and the playgrounds (P0-04); the CI workflow and `pnpm check` (P0-09).
- Reformatting Markdown with Prettier.

## Review

- **Recommended and chosen:** code, because `## Public Surface` isn't `- none` (three scripts, eight dependencies); chosen by the trigger list (low risk, not asked).
- **Verdicts:** built-in `code-review high --max-findings all` → `.sdlc/.work/findings/2026-11-12-m-p0-03-lint-format-typecheck/code-reviewer-r1.md` → FAIL — F1 (high), F2, F3, F4, F5, F7, F12; round 2 closing check → `code-reviewer-r2.md` → PASS (no high; its medium and low bugs fixed in the same pass).
- **Fixed:** F1 (high): `pnpm typecheck` missed `registry/` files; `tsconfig.json` now includes `registry/**/*.ts` and `*.vue`, proven by the seeded-script tests ('typecheck fails on a type error in a registry .vue file', '… registry .ts type error'). F2: `eslint --max-warnings 0` ('lint fails on a warning-level rule'). F3: typescript-eslint's core-rule overrides applied to `.vue`, made safe by `vue/block-lang` requiring `lang="ts"` ('eslint accepts TypeScript overloads in a .vue file', 'eslint rejects a .vue script block that is not TypeScript'). F4, F5, R2-3: ignores match `.gitignore`, and `.gitignore`'s VitePress patterns now match below the root ('eslint ignores %s', 'prettier ignores %s'). F7: `vue-eslint-parser` pinned 10.4.2 ('every devDependency is pinned to an exact version'). F12, R2-6: one behaviour per test. R2-1, R2-2, R2-9: seeded tests run in a throwaway copy of the toolchain, never the working tree. R2-10: `run()` rethrows spawn errors. R2-7: redundant `no-undef` block removed.
- **Tickets:** F6 Node globals for plain `.js` files (needs the unnamed `globals` package; the repo writes TS). F8 CI has no lint step (P0-09; the workflow is sdlc-managed). F9 the suite reruns full lint and typecheck (revisit with `pnpm check`, P0-09). F10 `spawnSync('pnpm')` won't resolve on Windows (CI is ubuntu-only). F11 `.vue` templates aren't type-checked until `vue` is installed (P0-04). R2-5 registry files see `@types/node` globals: a separate `registry/tsconfig.json` without node types fails with TS18003 while `registry/` has no source, so the first task that adds registry source (P0-04 or P0-08) splits it.
- **Drift and manual checks:** the Decisions row for `lint` predates F2: the script is `eslint --max-warnings 0 . && prettier --check .`. Seeded-script tests added beyond the AC table prove the task's "fail on a seeded error" for the real scripts. Deviations: TypeScript 7.0.2 → 6.0.3 (user approved); red recorded after reverting to Base, since tools were installed while probing TS 7; devDependencies @eslint/js, eslint-config-prettier, eslint-plugin-vue, prettier, vue-eslint-parser; `tsconfig.json` includes `registry/`; `.gitignore` VitePress patterns anchored with `**/`; `.sdlc/config.json` `commands.lint` set to `pnpm lint` (user accepted). No `manual` ACs.
- **Lessons filed:** [knowledge/gotchas/toolchain.md](../../../knowledge/gotchas/toolchain.md)
