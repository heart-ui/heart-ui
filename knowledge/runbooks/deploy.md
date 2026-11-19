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

- **Registry:** item versions are immutable (`/r/<name>@<version>.json`); a bad release is fixed forward with a new
  `meta.version` and a new tag. [unknown: how to restore the previous latest `registry.json` / `r/<name>.json` by hand]
- **npm:** move the dist-tag back (`npm dist-tag add heart-ui@<previous> <tag>`, same for `@heart-ui/theme`) and
  deprecate the bad version; npm versions can't be republished.
- **Docs:** roll back to the previous deployment in the Cloudflare Pages dashboard (`heart-ui-docs`). [unknown: confirmed]

## Logs

- Release: the `release` workflow run in GitHub Actions (`gh run list --workflow release.yml`).
- Docs builds: the Cloudflare Pages dashboard, project `heart-ui-docs`. [unknown: Pages build log CLI command]
- Registry traffic: [unknown]

## Learnt on deploys

<!-- One line per fact a deploy taught: date, environment, fact (a header shape, a URL, a limit, a missing step). -->
-
