---
type: gotcha
title: Test harness gotchas
description: Visual runner in the Playwright container, vite preview hosts, Nuxt prepare, seeded sandboxes.
---

# Test harness gotchas

- **Look at a new baseline before trusting it.** The first `--update` run recorded Vite's "Blocked request" page, because `vite preview` rejects unknown hosts. The browser in the container reaches preview as `host.docker.internal`, so `preview.allowedHosts` lists it. The spec now also asserts that the demo rendered before it takes a screenshot.
- **Visual tests connect to the container; they don't run in it.** `visual/run.ts` starts `playwright-core run-server` in `mcr.microsoft.com/playwright` (pinned by digest, run as `linux/amd64` on every machine) and points Playwright Test at it. On Linux, preview binds the `bridge` gateway; Docker Desktop for Linux or rootless Docker may need `127.0.0.1` instead (untested). Mounting the host's macOS `node_modules` into a Linux container breaks native packages, so only the pure-JS `playwright-core` is mounted, read-only. The image is pinned by digest in `run.ts`; upgrading Playwright means updating that digest. Host Chromium for `test:browser` and `test:ssr` comes from `pnpm test:install`.
- **Production Vue doesn't check attributes unless asked.** Without `debug: { hydration: true }` in nuxt.config, a server/client `id` mismatch hydrates silently and the DOM is patched. Even with it, Vue checks only known HTML and SVG attributes, so a `data-*` mismatch is never reported. Seed an `id` mismatch to prove the check.
- **`nuxt prepare` before the SSR test.** The Nuxt app's tsconfig references the generated `.nuxt/`, and Vitest fails to transform the test file without it. A fresh clone or sandbox has no `.nuxt/`, so `test:ssr` runs `nuxt prepare` first.
- **Seed regressions in a sandbox, outside `pnpm test`.** `pnpm test:harness` copies `git ls-files -co` into a temp folder and links `node_modules`. Linked `node_modules` resolve workspace packages and tool caches to the working tree, so seeds touch only `registry/` and `tests/`. Match the tool's own failure text (`toHaveScreenshot(expected) failed`, `Hydration attribute mismatch`, `button-name`), not a word that a missing-script error could echo.
- **Plain `.js` and `.mjs` files have no Node globals in ESLint.** Write Node scripts in TypeScript and run them with `node file.ts` (Node 22.18+).
- **`changeset status` needs the base branch locally.** It runs `git merge-base main HEAD`, and a pull request checkout in CI has no local `main`. Tests use `changeset status --since HEAD`, which still reads the config.
- **Keep `test:unit` to `vitest run`.** `lint` and `pnpm install` (the plugin's `prepare`) already build `@trevui/eslint-plugin`. Building it again in `test:unit` ran it twice in `pnpm check` and broke the harness sandbox, which has no `tsdown`.
- **Pin workflow actions to commit SHAs.** A tag can be moved to other code. Write the version in a trailing comment, and resolve SHAs with `git ls-remote https://github.com/<owner>/<repo> 'refs/tags/<tag>*'` (an annotated tag's commit is the `^{}` line).
