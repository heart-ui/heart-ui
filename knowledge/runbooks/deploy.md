---
type: runbook
title: Deploy
description: How Heart UI releases (R2 registry, npm packages, Pages docs), smoke-tests, rolls back and reads logs.
---

# Deploy

<!-- Seeded by sdlc setup from `deploy` in .sdlc/config.json; the project's from now on. /sdlc:deploy reads it before
     every deploy and adds what a deploy teaches to "Learnt on deploys". Leave a line [unknown] rather than guess. -->

Target: cloudflare (R2 for the registry, Pages for the docs), plus npm for the packages. One-time setup
(R2 token, `release` environment secrets, npm trusted publishers) lives in
[docs/sdlc/changes/2026-11-19-s-alpha-release-dry-run.md](../../docs/sdlc/changes/2026-11-19-s-alpha-release-dry-run.md)
and the P1-18 entry of [docs/questions.md](../../docs/questions.md). Hosting is described in
[docs/registry.md](../../docs/registry.md#hosting).

## Environments

| Environment | Where (project, URL) | Routine |
|---|---|---|
| production | Registry: R2 bucket `heart-ui-registry` behind https://registry.heart.tammai.me. Docs: Pages project `heart-ui-docs` at https://heart.tammai.me. Packages: npm `heart-ui`, `@heart-ui/theme` | no: a go-ahead every time |

Routine matches `deploy.environments` in `.sdlc/config.json` (`scaffold.py deploy` changes it): keep the two the same.

## Deploy

- **Release (registry + npm):** version with changesets (`pnpm changeset version`, inside `pnpm changeset pre enter <tag>`
  for a prerelease), commit, then push tag `v<packages/cli version>`. `.github/workflows/release.yml` runs, in order:
  `guard` (tag equals the CLI version and is the newest `v*` tag; derives the npm dist-tag), `registry`
  (`pnpm registry:publish` to R2: each item version written only if absent, then the latest items, then
  `registry.json`), then `npm` (packed tarballs, trusted publishing with provenance; versions npm already has are skipped).
- **Docs:** nothing to run. Pages builds `pnpm --filter docs build` from GitHub on every push to `main`
  (`apps/docs/wrangler.toml`).
- Dry run of the registry upload without credentials: `pnpm registry:publish --dry-run`.

## Smoke test

- `curl -fsS https://registry.heart.tammai.me/registry.json` → 200, and the new item versions appear.
- `curl -fsS https://registry.heart.tammai.me/r/button.json` → 200.
- `npm view heart-ui dist-tags` shows the new version on the expected tag.
- In a fresh Vite or Nuxt project: `npx heart-ui@<dist-tag> init` then `add button` succeeds (the P1-21 check).
- https://heart.tammai.me loads after a push to `main`.

## Rollback

- **Registry:** item versions are immutable (`/r/<name>@<version>.json`), so only the latest files move back. Re-publish
  the previous good tag by hand; `release.yml` can't do it, because its guard refuses any tag older than the newest:
  ```sh
  git switch --detach v<previous>
  pnpm install --frozen-lockfile
  R2_ACCOUNT_ID=… R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… R2_BUCKET=heart-ui-registry pnpm registry:publish
  ```
  Use an R2 token with Object Read & Write on `heart-ui-registry` (the `release` environment's secrets can't be read
  back). The run prints `skip` for every versioned file and `put` for the latest `r/<name>.json`, the agent docs,
  `llms.txt` and `registry.json`. It checks every version before writing anything, so a rebuild that differs from what
  was published stops with nothing changed. Effects that last:
  - An item first added in the bad release keeps its `r/<name>.json` and versioned file but drops out of `registry.json`.
  - The latest files are served with `max-age=300`, so clients can see the bad release for up to 5 minutes.
  - The fix ships as a newer tag (new `meta.version` for each changed item), never as the bad tag again.
- **npm:** move the dist-tag back (`npm dist-tag add heart-ui@<previous> <tag>`, same for `@heart-ui/theme`) and
  deprecate the bad version (`npm deprecate heart-ui@<bad> "<reason>"`). npm versions can't be republished.
- **Docs:** in the Pages dashboard, open `heart-ui-docs` → **Deployments**, then on an earlier production deployment
  choose ⋯ → **Rollback to this deployment**. Only successful production builds qualify, and the switch is
  immediate. API: `POST /accounts/{account_id}/pages/projects/heart-ui-docs/deployments/{deployment_id}/rollback`. The
  next push to `main` deploys over the rollback, so revert the bad commit on `main` as well.

## Logs

- Release: the `release` workflow run in GitHub Actions (`gh run list --workflow release.yml`).
- Docs builds: Pages dashboard → `heart-ui-docs` → **Deployments** → **View details** → **Build log** (kept 1 year).
  Wrangler has no build-log command (`wrangler pages deployment tail` streams Functions logs only, and the site has
  none). To find a deployment id, run `pnpm dlx wrangler pages deployment list --project-name heart-ui-docs`. The
  API returns the log: `GET /accounts/{account_id}/pages/projects/heart-ui-docs/deployments/{deployment_id}/history/logs`.
- Registry traffic: R2 dashboard → `heart-ui-registry` → **Metrics** for request and bandwidth totals (also in the
  GraphQL Analytics API). For per-request events, turn on **Data Access Logs** in the bucket's settings (off by default;
  kept 7 days; billed at Observability rates from 2026-12-01; status 400 and up isn't logged), then
  **View logs in Workers Observability**. [unknown: whether Data Access Logs are turned on for the bucket]

## Learnt on deploys

<!-- One line per fact a deploy taught: date, environment, fact (a header shape, a URL, a limit, a missing step). -->
-
