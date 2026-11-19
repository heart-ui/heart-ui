# 2026-11-12-m-p0-03-lint-format-typecheck
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-12-m-p0-03-lint-format-typecheck.md   (this feature's record for people)
Track: M   (sized up because: —; footprint: 10 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-12
Base: c7447c6
Owner: tam.mai@bigin.vn
Tool: claude-code
Verified: c7447c6 tree 13948d966fabc770356dbec1467d4b853ce82fe8
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline

## Handoff
- vue-tsc 3.3.14 fails on TS 7.0.2 (no ./lib/tsc export); TS pinned 6.0.3 by user decision
- eslint-plugin-vue user guide: put ts.parser under parserOptions for .vue; eslint-config-prettier/flat last

## Tasks
1. **ESLint flat config** — AC-003 AC-004
   - Files: `eslint.config.js`
2. **Prettier config and ignore** — AC-005
   - Files: `.prettierrc.json`, `.prettierignore`
3. **Root scripts, pinned devDependencies, sdlc lint command** — AC-001 AC-002
   - Files: `package.json`, `pnpm-lock.yaml`, `.sdlc/config.json`
4. **Toolchain tests** — AC-001 AC-002 AC-003 AC-004 AC-005
   - Files: `tests/toolchain.test.ts`
5. **Questions log and task status** — AC-001
   - Files: `docs/questions.md`, `tasks/phase-0.md`

## Public Surface
- command `pnpm lint` — AC-001
- command `pnpm format` — AC-005
- command `pnpm typecheck` — AC-001
- dependency `typescript-eslint@8.72.2` — AC-003
- dependency `@eslint/js@10.0.1` — AC-003
- dependency `eslint-config-prettier@10.1.8` — AC-005
- dependency `eslint@10.14.0` — AC-003
- dependency `eslint-plugin-vue@10.12.1` — AC-004
- dependency `prettier@3.10.0` — AC-005
- dependency `vue-tsc@3.3.14` — AC-002

## Gate log
- 2026-11-12 Stage 1: pass — plan not stopped for approval: low-risk M
- 2026-11-12 Stage 2: pass
- 2026-11-12 review: ran code (Public Surface not none), not asked: low risk
- 2026-11-12 Stage 2: pass
- 2026-11-12 Stage 2: pass
- 2026-11-12 Stage 3: pass

## Deviations
- 2026-11-12 package.json What: typescript 7.0.2 -> 6.0.3 Why: vue-tsc and typescript-eslint don't support TS 7 Effect: overrides P0-02's pin; user approved
- 2026-11-12 red step What: tools installed before the tests were written Why: probing vue-tsc/TS 7 compatibility Effect: red recorded after reverting code files to Base and reinstalling
- 2026-11-12 package.json What: devDependency @eslint/js added Why: ESLint core recommended rules; user approved Effect: pinned exactly, listed in the PR
- 2026-11-12 package.json What: devDependency eslint-config-prettier added Why: turns off ESLint rules that clash with Prettier; user approved Effect: pinned exactly, listed in the PR
- 2026-11-12 package.json What: devDependency eslint-plugin-vue added Why: named in conventions toolchain Effect: pinned exactly, listed in the PR
- 2026-11-12 package.json What: devDependency prettier added Why: named in conventions toolchain Effect: pinned exactly, listed in the PR
- 2026-11-12 tsconfig.json What: include registry/**/*.ts and registry/**/*.vue Why: review F1, typecheck missed seeded errors in registry Effect: pnpm typecheck now checks registry items
- 2026-11-12 package.json What: devDependency vue-eslint-parser 10.4.2 pinned Why: review F7, required peer of eslint-plugin-vue was auto-installed from a range Effect: exact pin per conventions
- 2026-11-12 .gitignore What: .vitepress/cache/ and .vitepress/dist/ anchored with **/ Why: review r2, the patterns matched only at the repo root, so apps/docs caches were tracked and Prettier-checked Effect: generated VitePress output ignored by git, Prettier and ESLint alike

## Open questions
-
