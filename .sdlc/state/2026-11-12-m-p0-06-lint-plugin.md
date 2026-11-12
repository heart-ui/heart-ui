# 2026-11-12-m-p0-06-lint-plugin
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-12-m-p0-06-lint-plugin.md   (this feature's record for people)
Track: M   (sized up because: —; footprint: 12 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-12
Base: f2de7bd
Owner: tam.mai@bigin.vn
Tool: claude-code
Verified: f2de7bd tree 0f4335f3522f0342de7543f92458651a7b4e9e51
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline

## Handoff
- ESLint 10: parser services on context.sourceCode.parserServices; vue-eslint-parser's defineTemplateBodyVisitor visits <template>
- pnpm runs a workspace package's prepare script on install, so tsdown builds dist/ for the root config

## Tasks
1. **Rules and plugin** — AC-001 AC-002 AC-003 AC-004 AC-005 AC-006 AC-007 AC-008 AC-009
   - Files: `packages/eslint-plugin/src/index.ts`, `packages/eslint-plugin/src/raw-values.ts`, `packages/eslint-plugin/src/named-colors.ts`, `packages/eslint-plugin/src/rules/no-raw-values.ts`, `packages/eslint-plugin/src/rules/no-reka-outside-ui.ts`, `packages/eslint-plugin/package.json`
2. **Rule tests** — AC-001 AC-002 AC-003 AC-004 AC-005 AC-006 AC-007 AC-008 AC-009
   - Files: `packages/eslint-plugin/test/rules.test.ts`
3. **Root config, workspace dep, test and type include** — AC-010
   - Files: `eslint.config.js`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vitest.config.ts`, `tests/toolchain.test.ts`
4. **Questions log and task status** — AC-008
   - Files: `docs/questions.md`, `tasks/phase-0.md`

## Public Surface
- export `@trevui/eslint-plugin` — AC-009
- config `trevui/no-raw-values` — AC-001
- config `trevui/no-reka-outside-ui` — AC-009
- dependency `tsdown` — AC-009
- dependency `@trevui/eslint-plugin` — AC-010

## Gate log
- 2026-11-12 Stage 1: pass — plan not stopped for approval: low-risk M, unattended
- 2026-11-12 Stage 2: pass
- 2026-11-12 review: ran code (Public Surface not none), not asked: low risk, unattended
- 2026-11-12 Stage 2: pass
- 2026-11-12 Stage 2: pass
- 2026-11-12 Stage 2: pass
- 2026-11-12 Stage 2: pass
- 2026-11-12 Stage 3: pass

## Deviations
- 2026-11-12 red step What: plugin source written before the red run Why: written in the same turn as the tests Effect: red recorded with src/ and dist/ moved aside, root config not yet wired
- 2026-11-12 eslint.config.js What: root config imports ./packages/eslint-plugin/dist/index.mjs by path, no root workspace dependency Why: a workspace:* devDependency fails the exact-pin test, and the plugin is only used here Effect: lint script builds the plugin with pnpm --dir first; tests/toolchain.test.ts sandbox symlinks the package
- 2026-11-12 public surface What: @trevui/eslint-plugin is not a root dependency Why: imported by path Effect: surface line kept for the record
- 2026-11-12 changeset What: none added Why: Changesets is configured in P0-09 and the package is private Effect: P0-09 or the first publish adds it
- 2026-11-12 public surface What: colorProperties Why: internal module export shared by the rules (src/raw-values.ts, src/named-colors.ts) Effect: not re-exported from the package entry
- 2026-11-12 public surface What: findProblems Why: internal module export shared by the rules (src/raw-values.ts, src/named-colors.ts) Effect: not re-exported from the package entry
- 2026-11-12 public surface What: hasNamedColor Why: internal module export shared by the rules (src/raw-values.ts, src/named-colors.ts) Effect: not re-exported from the package entry
- 2026-11-12 public surface What: namedColors Why: internal module export shared by the rules (src/raw-values.ts, src/named-colors.ts) Effect: not re-exported from the package entry
- 2026-11-12 package.json What: root test script builds the plugin before vitest Why: review F13, toolchain tests lint with the built plugin Effect: pnpm test never reads a stale or missing dist
- 2026-11-12 packages/eslint-plugin/package.json What: devDependencies eslint, vue-eslint-parser, typescript-eslint, vitest pinned Why: review F15, the tests import them Effect: eslint peer stays a range (>=10.0.0), as plugins declare
- 2026-11-12 public surface What: isColorProperty, CheckOptions Why: internal exports of src/raw-values.ts shared with the rule Effect: not re-exported from the package entry
- 2026-11-12 packages/eslint-plugin/src/rules/no-raw-values.ts What: one context resolver (contextOf) replaces the Property, AssignmentExpression and CallExpression visitors and the one-level parent checks Why: review r2 R2-19, each shape missed the next Effect: ternaries, ??, TS wrappers, nested objects, runtime prop defaults, setAttribute and setProperty resolve the same way
- 2026-11-12 tests/toolchain.test.ts What: sandbox copies the plugin's package.json and src instead of symlinking the package Why: review r2 R2-17, the sandbox lint rebuilt the working tree's dist Effect: seeded lint runs build their own dist
- 2026-11-12 test-change packages/eslint-plugin/test/rules.test.ts What: 'light-dark(white, black)' now expects darkVariant, not rawColor Why: review r3 R3-7, light-dark() is a per-mode style; decision logged in docs/questions.md Effect: test follows the decision
- 2026-11-12 packages/eslint-plugin/package.json What: build and prepare run tsdown --no-clean Why: review r3 R3-18, a clean deleted dist while eslint.config.js imported it Effect: builds overwrite dist in place

## Open questions
-
