# 2026-11-20-m-p2-58-checked-examples
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-20-m-p2-58-checked-examples.md   (this feature's record for people)
Track: M   (sized up because: —; footprint: 9 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-20
Base: 64194a6
Owner: 3235400+tammai@users.noreply.github.com
Tool: claude-code
Verified: 64194a6 tree c0c677985210ff4d46aa50ada56edc8d40880827
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline

## Handoff
- Probe: vue-tsc 3.3.14 strictTemplates also reports errors inside registry components (filter to generated files) and flags fallthrough attrs (id, aria-*, onClick) as TS2353
- check.test fixes step names and full-plan commands (pnpm run <step>); itemPlan typecheck shown string must keep 'vue-tsc -p X --noEmit (includes ...)'

## Tasks
1. **Example checker** — AC-001 AC-002 AC-003 AC-004
   - Files: `scripts/spec-examples.ts`
2. **Gate wiring** — AC-005
   - Files: `package.json`, `scripts/check.ts`
3. **Fix spec examples found by the check** — AC-001
   - Files: `registry/ui/checkbox/checkbox.md`, `registry/ui/tooltip/tooltip.md`
4. **Tests and docs** — AC-001 AC-002 AC-003 AC-004 AC-005
   - Files: `tests/spec-examples.test.ts`, `docs/conventions.md`, `docs/templates/component-spec.md`, `docs/questions.md`, `tasks/phase-2.md`

## Public Surface
- command `node scripts/spec-examples.ts` — AC-001

## Test lock
- `tests/spec-examples.test.ts` sha256:ac6709dba9b1d63a28e7a7392ce056611cdf9c0c69e8030b2b4128cbca7516e9

## Gate log
- 2026-11-20 Stage 1: pass — plan not stopped for approval: low-risk M
- 2026-11-20 Stage 2: pass
- 2026-11-20 review: ran code (Public Surface not none), not asked: low risk; security not fired
- 2026-11-20 Stage 2: pass
- 2026-11-20 Stage 2: pass
- 2026-11-20 Stage 3: pass

## Deviations
- 2026-11-20 internal exports What: scripts/spec-examples.ts exports Example, examples, exampleComponent, isFallthrough, checkExamples. Why: the test and later tools (P2-59) can reuse the parsing. Effect: repo scripts only.
- 2026-11-20 test-change tests/spec-examples.test.ts What: review round 1 cases: a made-up prop beside allowed attributes, field state and form events on non-fields, fences in lists and with info strings, absolute --md paths, full components refused, vue-tsc failing without errors, block and layout aliases. Why: C1-C8 each get a failing test first. Effect: stricter.
- 2026-11-20 scripts/spec-examples.ts docs/templates/block-spec.md docs/conventions.md docs/questions.md What: fallthrough attributes are blanked from the template before checking; form attributes need a native field; vue-tsc failures with no example error fail the check; blocks and layouts resolve; every fence tracked; examples are template-only; header errors point at the block; exports problemsFrom, Generated and kindAliases. Why: review round 1. Effect: the check can't pass a made-up prop or a broken run.
- 2026-11-20 test-change tests/spec-examples.test.ts What: round 2 cases: v-if branches, declared props never blanked (wrong values fail, named by the value), Checkbox reads required itself, form attributes on non-fields fail, longer closing fences, commented full components, --item validation and the specs that use an item, registry module-resolution errors fail; assertions name the offending attribute. Why: R2C1-R2C9 each get a failing test first. Effect: stricter.
- 2026-11-20 scripts/spec-examples.ts docs/conventions.md What: blanking walks the template as written (parse, not the transformed AST); declared props and events come from the committed API snapshots; a form control is a component whose native field takes $attrs, plus attributes a component reads (attrs.X); fences close on the same character at least as long; full components refused anywhere at the top level; --item validated and widened to specs using the item; registry errors other than module resolution ignored; exports specFilesFor. Why: review round 2. Effect: no correct example fails and no wrong value passes in the cases found.

## Open questions
-
