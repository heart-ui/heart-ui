# 2026-11-12-m-p0-05-passing-tokens-culori
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-12-m-p0-05-passing-tokens-culori.md   (this feature's record for people)
Track: M   (sized up because: —; footprint: 9 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-12
Base: c210390
Owner: tam.mai@bigin.vn
Tool: claude-code
Verified: c210390 tree 0e4a26c3c1670318b52307a74c1657fd58ef96be
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline: this session builds it, one part

## Handoff
- culori 4.0.2: parse() returns undefined for unparseable strings; converter('oklch') leaves h undefined for grays; alpha undefined means opaque (culorijs.org/api, 2026-11-12)
- Maintainer authorized the tokens.md value change (AskUserQuestion: Update tokens.md)

## Tasks
1. **tokens.md table and mapping** — AC-001
   - Files: `docs/tokens.md`, `packages/theme/src/semantic.ts`, `packages/theme/css/tokens.css`
2. **culori parsing** — AC-003
   - Files: `packages/theme/src/color.ts`, `packages/theme/src/index.ts`, `packages/theme/package.json`, `pnpm-lock.yaml`
3. **Tests and records** — AC-001 AC-002 AC-003
   - Files: `packages/theme/test/theme.test.ts`, `docs/questions.md`, `knowledge/gotchas/theme.md`

## Public Surface
- dependency `culori` — AC-003
- dependency `@types/culori` — AC-003

## Gate log
- 2026-11-12 Stage 1: pass — plan not stopped: low-risk M; token change authorized by maintainer
- 2026-11-12 Stage 2: pass
- 2026-11-12 review: ran code (Public Surface: culori dependency), not asked: low risk, autopilot
- 2026-11-12 Stage 2: pass
- 2026-11-12 Stage 3: pass

## Deviations
-

## Open questions
-
