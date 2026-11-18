# P1-18 Registry publish

## Why

**Request (verbatim):** P1-18 Registry publish (tasks/phase-1.md): `scripts/registry-publish.ts` that uploads the build to R2, including immutable `/r/<name>@<version>.json` files; a release workflow. Accept: a dry run lists the exact objects to upload; a published item version is never overwritten. Owner: agent, with human for Cloudflare credentials. Unattended run: decisions delegated to the agent.

The task is [tasks/phase-1.md, P1-18](../../../tasks/phase-1.md#p1-18-registry-publish); the layout is [registry.md, Hosting](../../registry.md#hosting): `/registry.json`, `/r/<name>.json`, and every published version at `/r/<name>@<version>.json`, which `update` needs to find the base of a three-way merge. The agent builds and tests the script; a human supplies the Cloudflare credentials and runs the first real publish.

**The user's words:** "auto start next item when the current item done, working unattended until 8:00AM tomorrow" (2026-11-18).

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| Upload through R2's S3 API with SigV4 signing written on `node:crypto` | `@aws-sdk/client-s3` or `wrangler` | No dependency the task names; signing is one function. AWS's published test vector uses an example key pair that the repo's secret guard refuses, so the unit test checks the signature's shape and inputs, and the first real publish (human, with credentials) confirms it against R2. |
| A versioned file is written with `If-None-Match: *`; on 412 the script reads the stored object: the same bytes are skipped, other bytes fail the publish naming the item and version | Checking first with HeadObject | R2 evaluates the condition atomically (developers.cloudflare.com/r2/api/s3/api/, checked 2026-11-19), so two publishes can't both write a version. |
| Order: versioned files, then `r/<name>.json`, then the rest, `registry.json` last | Any order | The index and the latest items never point at a version that isn't there yet. |
| The script builds the registry itself into a temp folder | Uploading `dist/registry` | A publish never ships a stale or hand-edited build. |
| Credentials come from `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_BUCKET`; `R2_ENDPOINT` overrides the endpoint (tests, other S3 stores) | Flags | Secrets never go on a command line (sdlc CI policy). |
| The release workflow is drafted below, not committed | Committing `.github/workflows/release.yml` | `.claude/rules/sdlc-ci.md`: CI changes need the maintainer's go-ahead. |

**Proposals not asked for:** None.

## Acceptance criteria

- **AC-001** Given the registry, when `pnpm registry:publish --dry-run` runs, then it prints every object it would upload, one per line with its key, size and whether it is immutable, in upload order, and uploads nothing and needs no credentials.
- **AC-002** Given credentials and an S3 endpoint, when the publish runs, then every object is stored under its key with its content type, and `r/<name>@<version>.json` holds the item for each item's `meta.version`.
- **AC-003** Given a version already published with other content, then the publish exits 1 naming the item and version, and the stored version is unchanged; with the same content it is skipped.
- **AC-004** Given SigV4 signing, then the Authorization header names the key, date, region `auto`, service `s3` and the signed headers, the signature is 64 hex characters, the same request signs the same, and any change to the secret, body, path or a signed header changes it; R2 accepting it is checked by hand at the first real publish.
- **AC-005** Given missing credentials (without `--dry-run`), then the publish exits 1 naming the variables, before any upload; a store that refuses a request fails with one line naming the key and status.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | tests/registry-publish.test.ts › AC-001 dry run | `pnpm exec vitest run tests/registry-publish.test.ts -t "AC-001"` |
| AC-002 | tests/registry-publish.test.ts › AC-002 upload | `pnpm exec vitest run tests/registry-publish.test.ts -t "AC-002"` |
| AC-003 | tests/registry-publish.test.ts › AC-003 immutable versions | `pnpm exec vitest run tests/registry-publish.test.ts -t "AC-003"` |
| AC-004 | tests/registry-publish.test.ts › AC-004 signing | `pnpm exec vitest run tests/registry-publish.test.ts -t "AC-004"` |
| AC-005 | tests/registry-publish.test.ts › AC-005 failures | `pnpm exec vitest run tests/registry-publish.test.ts -t "AC-005"` |

## Must never break

- A published `name@version` is never overwritten with other content.
- Secrets never appear in output or on a command line.

## Failure modes

- Concurrent publishes: the conditional write makes the first one win → AC-003.
- A failure mid-publish: versioned files first and the index last, so a partial publish never lists what isn't there → AC-002 order.

## Out of scope

- Running the first real publish and creating the bucket (human, with credentials).
- The npm release of the CLI (P1-20).

## Release workflow draft (for the maintainer's go-ahead)

Before committing it: confirm each action SHA matches its version comment (`gh api repos/actions/checkout/git/ref/tags/v7.0.1`, and the same for the others), give the `release` environment a deployment rule for `v*` tags only (and reviewers if wanted), and run `zizmor` on it.

```yaml
name: release
on:
  push:
    tags: ['v*']
permissions:
  contents: read
# One release at a time, so an older run's latest items never land after a newer one's.
concurrency:
  group: release
  cancel-in-progress: false
jobs:
  registry:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    environment: release
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@73e46992e05b19abd31f2f3c20e0e7370d762115 # v6.1.1
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        # No dependency cache: a restored cache is a path into the job that holds the write key.
        with:
          node-version: 22.x
      - run: pnpm install --frozen-lockfile
      - run: pnpm registry:publish
        env:
          R2_ACCOUNT_ID: ${{ secrets.R2_ACCOUNT_ID }}
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_BUCKET: ${{ secrets.R2_BUCKET }}
```

## Review

- **Recommended and chosen:** code (the Public Surface is not `- none`) and security (the script signs requests with R2 credentials); chosen by the trigger list (low risk, not asked).
- **Verdicts:**
  - Round 1: security → `.sdlc/.work/findings/2026-11-19-m-p1-18-registry-publish/security-r1.md` → FAIL (S1). code-review → `code-reviewer-r1.md` → FAIL (C1, C3–C7).
  - Round 2: security → `security-r2.md` → PASS. code-review → `code-reviewer-r2.md` → PASS. Its medium and low bugs were fixed and closed by `verify.py`.
  - The workflow-draft edit made during Review was accepted by the user (Trust anchor, 2026-11-19).
- **Fixed:**
  - S1 / C1: the payload hash was taken over a re-encoded string. It is now the exact bytes, and the fake store checks it.
  - S2: the build runs without R2 variables.
  - S3, S7: the workflow draft has no dependency cache and has a concurrency group.
  - S5 / C6: keys use SigV4 UriEncode, and a trailing slash on the endpoint is handled.
  - S6: the account id must be 32 hex characters.
  - C3: the plan reads the build's own file list.
  - C4, C5: messages carry the network cause or the S3 error code.
  - C7: credentials are checked before the build.
  - R2C1: the entry guard compares real paths.
  - R2C2: every version is checked before any write.
  - R2C3: the CLI's version pattern is used.
  - R2C5: a 60 s timeout and three attempts per request.
  - R2C7: latest items follow their dependencies.
  - R2C4, R2C10: tests.
  - Each fix has a case in `tests/registry-publish.test.ts`.
- **Manual (maintainer, first real publish; docs/questions.md):**
  - R2 accepts the signature. AWS's published vector can't be committed because the secret guard refuses its example keys (C2).
  - A second run prints `skip` for every version.
  - A conditional PUT of changed bytes answers 412 (S4).
  - Approve the workflow draft after checking the action SHAs (S8), restricting the `release` environment to `v*` tags, and running `zizmor`; publish only from the newest release tag (R2C6).
- **Tickets:** parallel uploads per phase (R2C9).
- **Drift:**
  - AC-004 was rescoped before the red step.
  - The workflow is drafted, not committed.
  - New exports `sign` and `objectPath`.
  - The round 1 and round 2 fixes and test changes, re-recorded red at the base.
  - See the state file's Deviations.
- **Security:** No critical or high finding is open, and the diff holds no secrets. The test credentials are placeholders.
- **Lessons filed:** [knowledge/gotchas/cli.md](../../../knowledge/gotchas/cli.md) (sign the bytes sent, real-path entry guards, the SigV4 vector and the secret guard); two lines in [recurring-defects.md](../recurring-defects.md).
