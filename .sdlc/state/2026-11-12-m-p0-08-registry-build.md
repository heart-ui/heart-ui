# 2026-11-12-m-p0-08-registry-build
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-12-m-p0-08-registry-build.md   (this feature's record for people)
Track: M   (sized up because: —; footprint: 16 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-12
Base: 4168b82
Owner: tam.mai@bigin.vn
Tool: claude-code
Verified: 4168b82 tree e2bf5477f6732236c584f7228636b0644494c8e7
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline

## Handoff
- Upstream schemas are draft-07 and leave additionalProperties unset: the build checks item.json keys against registry-item.json's properties itself
- Fluent ids checked on api.iconify.design 2026-11-12: checkmark, chevron-down/up/left/right, dismiss, search, spinner-ios, add, info, warning, error-circle (all -20-regular)
- Node runs scripts/registry-build.ts directly (type stripping); keep it erasable TypeScript

## Tasks
1. **utils helper** — AC-006
   - Files: `registry/lib/utils/utils.ts`, `registry/lib/utils/item.json`
2. **icon helper** — AC-007
   - Files: `registry/lib/icon/icon.ts`, `registry/lib/icon/index.ts`, `registry/lib/icon/sets/fluent.ts`, `registry/lib/icon/item.json`
3. **Registry build and schemas** — AC-001 AC-002 AC-003 AC-004 AC-005 AC-008
   - Files: `scripts/registry-build.ts`, `scripts/registry-schemas/registry-item.json`, `scripts/registry-schemas/registry.json`, `scripts/registry-schemas/meta.schema.json`, `scripts/registry-schemas/README.md`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`
4. **Tests** — AC-001 AC-002 AC-003 AC-004 AC-005 AC-006 AC-007 AC-008
   - Files: `tests/registry-build.test.ts`, `tests/registry-helpers.test.ts`
5. **Questions log and task status** — AC-005
   - Files: `docs/questions.md`, `tasks/phase-0.md`

## Public Surface
- command `pnpm registry:build` — AC-001
- export `cn` — AC-006
- export `Icon` — AC-007
- export `fluent` — AC-007
- dependency `ajv` — AC-001
- dependency `clsx` — AC-006
- dependency `tailwind-merge` — AC-006
- dependency `@iconify/vue` — AC-007
- dependency `vue` — AC-007

## Gate log
- 2026-11-12 Stage 1: pass — plan not stopped for approval: low-risk M, autopilot
- 2026-11-12 Stage 2: pass
- 2026-11-12 review: ran code (Public Surface not none), not asked: low risk, autopilot
- 2026-11-12 Stage 2: pass
- 2026-11-12 Stage 2: pass
- 2026-11-12 User granted review round 4 (typed: one more round): switch --out to marker design, fix R3 findings
- 2026-11-12 Stage 2: pass
- 2026-11-12 Stage 2: pass
- 2026-11-12 Stage 3: pass

## Deviations
- 2026-11-12 public surface What: IconName Why: the union of internal icon names, exported with fluent Effect: export of a file the plan names
- 2026-11-12 public surface What: RegistryError Why: marks build failures meant for the person running the build Effect: export of a file the plan names
- 2026-11-12 public surface What: buildRegistry Why: the build as a function; the CLI entry calls it Effect: export of a file the plan names
- 2026-11-12 package.json What: engines.node raised to >=22.18.0 Why: review F8, registry:build runs TypeScript with Node's type stripping Effect: older Node 22 fails install-time engine checks instead of at build
- 2026-11-12 scripts/registry-build.ts What: --out is only replaced when missing, empty or a previous build (registry.json + r/), overlap checked on real paths; the build never deletes the folder itself Why: review r2 R2-1..R2-3, string-prefix guards let --out / or a case variant through and still wiped other folders Effect: a mistyped --out fails instead of deleting
- 2026-11-12 scripts/registry-build.ts What: --out ownership is a marker file (.heart-ui-registry-build.json) listing what the build wrote; a rebuild deletes only those files, writes only into a missing, empty or marked folder, and refuses to overwrite a file it did not write; overlap checked with realpathSync.native Why: review r3 R3-1 R3-2, name-based guesses kept leaking Effect: an old unmarked dist/registry must be deleted once
- 2026-11-12 scripts/registry-build.ts What: item names limited to [a-z0-9][a-z0-9_-]*; unlisted source files, unknown top-level folders and unknown CLI arguments fail Why: review r4 R4-1 R4-4 R4-5 R4-6 Effect: stricter build input, logged in docs/questions.md

## Open questions
-
