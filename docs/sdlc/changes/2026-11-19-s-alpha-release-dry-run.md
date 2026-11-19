# Alpha release dry run

## Why

**Request (verbatim):** "3, prepare the release dry run" (2026-11-19), the option to rehearse
P1-20 (alpha release) and P1-21 (alpha gate) without publishing anything, so the maintainer's
real run goes quickly.

## What ran (2026-11-19)

Everything ran outside the repo, in a scratch folder, with nothing published.

| Step | Result |
|---|---|
| `pnpm --dir packages/{theme,cli} build`, then `pnpm pack` each | Two tarballs: `heart-ui-0.0.0.tgz` (dist, LICENSE), `heart-ui-theme-0.0.0.tgz` (dist, css, LICENSE). |
| `npm install -D heart-ui-0.0.0.tgz` in a fresh app | **Fails:** `404 @heart-ui/theme`. The CLI needs the theme package at run time. |
| `pnpm registry:publish --dry-run` | 36 objects, versions first and `registry.json` last. |
| `pnpm --filter docs build` | Passes. |
| Fresh Vite app (`npm create vite@latest -- --template vue-ts`, then installation-vite.md word for word), both tarballs, `init --yes`, `add` all 15 Tier 1 items from a locally served registry, `npm run build` (vue-tsc and vite), preview | **Passes.** 15 of 15 demo sections render in Chromium, no console errors, `--h-primary` is set and the button is themed. |
| Fresh Nuxt app (`npm create nuxt@latest`, then installation-nuxt.md word for word), the same steps, `npm run build`, `node .output/server/index.mjs` | **Failed, then passed after the docs fix.** `npm install -D typescript` now installs TypeScript 7.0.2, and Vue's SFC compiler then fails every `defineProps<ImportedType>()` ("No fs option provided to compileScript"). With `typescript@6`: 15 of 15 sections in the SSR HTML and in the browser, no hydration or console errors. |

The end-to-end test didn't catch the TypeScript 7 failure because its templates pin
`typescript` 6.0.3.

## Fixed on this branch

- `apps/docs/start/installation-nuxt.md`: installs `typescript@6` and says why. Its
  `nuxt.config.ts` block now keeps the keys `create nuxt` writes, since copying it in place of
  the whole file dropped `compatibilityDate`.
- `apps/docs/start/getting-started.md`: asks for TypeScript 6.
- `tests/docs-pages.test.ts`: any `typescript` the start pages install must be the major the
  end-to-end templates pin.

## Blockers for P1-20 (maintainer)

1. **P0-01** (settled later the same day): the maintainer owns the npm package `heart-ui`
   (0.0.16, an old Vite template from 2024, so the alpha is a new version of it) and the
   `@heart-ui` org scope. The GitHub org `heart-ui` exists. The hosts are `heart.tammai.me`
   (docs) and `registry.heart.tammai.me` (registry). DNS for both is still to do.
2. **`@heart-ui/theme` must be published before or together with `heart-ui`.** Choice: publish
   it, not bundle it into the CLI. Why: it matches the `@heart-ui` scope in the spec and
   `.changeset/config.json` (`access: public`), and the CLI code doesn't change. Decided by the
   agent (delegated).
3. **No git remote.** npm provenance needs trusted publishing from a public GitHub repository,
   with `repository.url` in each `package.json` matching it exactly
   (docs.npmjs.com/trusted-publishers, checked 2026-11-19). It needs npm CLI 11.5.1 or later
   and Node 22.14 or later. Provenance is automatic, with no `--provenance` flag.
4. **Trusted publishers are set per package on npmjs.com.** `@heart-ui/theme` doesn't exist yet,
   so its first version may have to be published by hand before a publisher can be attached.
   Check this on npmjs.com at release time.

## Runbook for P1-20

1. DNS: attach `registry.heart.tammai.me` to the R2 bucket as a custom domain and
   `heart.tammai.me` to the `heart-ui-docs` Pages project.
2. In `packages/cli/package.json` and `packages/theme/package.json`: remove `"private": true`
   (the `repository` fields are already set).
3. Versions: `pnpm changeset pre enter alpha`, then `pnpm changeset version`. This consumes
   `.changeset/*.md` and sets `0.1.0-alpha.0`-style versions. Commit the result and tag `v<version>`.
4. Registry: create the R2 bucket and the `release` environment's secrets, then follow the
   manual checks in docs/questions.md (P1-18 entry).
5. npm: attach a trusted publisher (repository plus `release.yml`) to `heart-ui` and
   `@heart-ui/theme`, approve the workflow below, and push the tag.
6. Docs: `pnpm --filter docs build`, then deploy `apps/docs/.vitepress/dist` with
   `apps/docs/wrangler.toml` (Cloudflare Pages project `heart-ui-docs`).
7. P1-21: repeat the dry run above against the published packages and registry, without
   `--registry`.

## Release workflow, npm job (draft, for the maintainer's go-ahead)

This job extends the `registry` job drafted in
[the P1-18 change file](2026-11-19-m-p1-18-registry-publish.md#release-workflow-draft-for-the-maintainers-go-ahead).
Pin actions by SHA as that draft does, and run `zizmor`. `pnpm pack` turns `workspace:*` into
real versions; `npm publish` doesn't, so the job publishes the packed tarballs. The theme goes
first.

```yaml
  npm:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    environment: release
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@<sha> # v7.0.1
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@<sha> # v6.1.1
      - uses: actions/setup-node@<sha> # v7.1.0
        with:
          node-version: 22.x
          registry-url: https://registry.npmjs.org
      - run: npm install -g npm@11
      - run: pnpm install --frozen-lockfile
      - run: pnpm --dir packages/theme build && pnpm --dir packages/cli build
      - run: |
          mkdir -p "$RUNNER_TEMP/pack"
          (cd packages/theme && pnpm pack --pack-destination "$RUNNER_TEMP/pack")
          (cd packages/cli && pnpm pack --pack-destination "$RUNNER_TEMP/pack")
          npm publish "$RUNNER_TEMP"/pack/heart-ui-theme-*.tgz --tag alpha --access public
          npm publish "$(ls "$RUNNER_TEMP"/pack/heart-ui-[0-9]*.tgz)" --tag alpha
```

## Follow-ups (tickets)

- The Nuxt build warns `NUXT_B3011` 15 times: Nuxt auto-imports `components/ui/<item>/index.ts`
  and `<Item>.vue` under the same name. It's harmless today, but `init` could set `components`
  in `nuxt.config.ts`, or the Nuxt docs could say how to quiet it.
- `init` could warn when the project's `typescript` is a major Vue's compiler can't load (the
  open question from P1-17 in docs/questions.md).
- Neither tarball ships a README, so the npm page would be empty.
