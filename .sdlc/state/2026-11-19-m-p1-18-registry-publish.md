# 2026-11-19-m-p1-18-registry-publish
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-19-m-p1-18-registry-publish.md   (this feature's record for people)
Track: M   (sized up because: —; footprint: 7 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-19
Base: 9e8767c
Owner: tam.mai@bigin.vn
Tool: claude-code
Verified: 9e8767c tree 5975a1e1fe34f12f2db10163382fb30ca39cbb8d
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline: this session builds it, one part

## Handoff
- R2 S3 API: endpoint https://<account>.r2.cloudflarestorage.com, region auto, path-style /<bucket>/<key>; PutObject honours If-None-Match: * with 412 (developers.cloudflare.com/r2/api/s3/api/)
- the release workflow is a CI change: drafted in the change file, not committed (sdlc-ci rule)

## Tasks
1. **Publish script** — AC-001 AC-002 AC-003 AC-004 AC-005
   - Files: `scripts/registry-publish.ts`, `tests/registry-publish.test.ts`, `package.json`
2. **Records** — AC-001
   - Files: `docs/registry.md`, `docs/questions.md`, `tasks/phase-1.md`

## Public Surface
- config `registry:publish` — AC-001
- env `R2_ACCOUNT_ID` — AC-005
- env `R2_ACCESS_KEY_ID` — AC-005
- env `R2_SECRET_ACCESS_KEY` — AC-005
- env `R2_BUCKET` — AC-005
- env `R2_ENDPOINT` — AC-002

## Test lock
- `tests/registry-publish.test.ts` sha256:98ccd91752f7717e544e00b56c6a4bc88262b5ab81b4e060bdb88f61dce4998c

## Gate log
- 2026-11-19 Stage 1: pass — plan not stopped for approval: low-risk M
- 2026-11-19 Stage 2: pass
- 2026-11-19 review: ran code, security (public surface; the script signs requests with R2 credentials), not asked: low risk
- 2026-11-19 Stage 3: fail — round 1: security S1 (S2-S8 lower); code C1, C3-C7
- 2026-11-19 Stage 2: pass
- 2026-11-19 Stage 3: pass — round 2 passed; fixing its medium and low bugs, closed by verify; change-file edit accepted by the user (Trust anchor)
- 2026-11-19 Stage 2: pass
- 2026-11-19 Stage 3: pass

## Deviations
- 2026-11-19 test-change tests/registry-publish.test.ts What: AC-004 checks the signature's shape, determinism and that every signed input changes it, not AWS's published vector. Why: that vector's example key pair is refused by the repo's secret guard; R2 accepting the signature is checked by hand at the first real publish. Effect: AC-004 rescoped in the change file before the red step.
- 2026-11-19 test-change tests/registry-publish.test.ts What: the fake store checks x-amz-content-sha256 against the bytes received and answers refusals with S3 error XML; the refusal message expects the S3 code; the account id is a 32-character hex placeholder; new cases for hashing exact bytes, UriEncode keys, a non-hex account id, an unreachable store (a freshly closed port, since fetch refuses port 1) and a trailing-slash endpoint. Why: review round 1 (security S1, S5, S6; code C1, C4-C6).
- 2026-11-19 scripts/registry-publish.ts docs/registry.md docs/questions.md tasks/phase-1.md What: the exact bytes are signed; objectPath encodes keys as UriEncode; the plan reads the build marker's file list; the build runs without R2_ variables; credentials and the account id are checked before the build; messages carry the S3 error code or the network cause; the endpoint loses a trailing slash; the version contract (byte for byte) is documented; the workflow draft drops the dependency cache and adds a concurrency group, with the maintainer's pre-commit checks; the task entry notes the pending workflow; the first real publish's manual checks are listed. Why: review round 1 (security S1-S8; code C1, C3-C10).
- 2026-11-19 scripts/registry-publish.ts What: exports objectPath beside sign. Why: tests check the key encoding directly (review round 1, S5/C6). Effect: script-internal; no package surface.
- 2026-11-19 test-change tests/registry-publish.test.ts What: prerelease versioned keys are recognised; the trailing-slash case asserts the exit status; new cases for a symlinked entry path, a conflict found before any write, latest items after their dependencies, and a 503 retried. Why: review round 2 (R2C1, R2C2, R2C4, R2C5, R2C7, R2C10).
- 2026-11-19 scripts/registry-publish.ts docs/questions.md What: the entry guard compares real paths; every version is checked before any write; versions use the CLI's pattern; requests time out after 60 s and are tried three times on a network failure or 5xx; latest items follow their registryDependencies; the maintainer note adds publishing only from the newest release tag. Why: review round 2. Effect: ticket for parallel uploads.

## Open questions
-
