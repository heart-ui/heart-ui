# 2026-11-12-l-p0-07-test-harness
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-12-l-p0-07-test-harness.md   (this feature's record for people)
Track: L   (sized up because: several distinct parts: browser, visual, SSR, seeded meta tests; footprint: 20 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-12
Base: 23e6ab8
Owner: tam.mai@bigin.vn
Tool: claude-code
Verified: 23e6ab8 tree bf7d55182f7bc7b6dfc54964de9a7beaf33636d5
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline: this session builds it, one part

## Handoff
- Playwright image mcr.microsoft.com/playwright:v1.65.0-noble pulled; Docker Desktop must be running for test:visual
- Vitest 5.1 browser mode: @vitest/browser-playwright, test.browser {enabled, provider: playwright(), instances:[{browser:'chromium'}]} (vitest.dev/guide/browser 2026-11-12)
- Playwright remote: run-server in the container, host connects with connectOptions.wsEndpoint (playwright.dev/docs/docker)

## Tasks
1. **Browser harness** — AC-001 AC-002
   - Files: `apps/playground-vite/vitest.config.ts`, `apps/playground-vite/test/harness.ts`, `apps/playground-vite/test/harness.browser.test.ts`, `apps/playground-vite/test/demos.browser.test.ts`, `apps/playground-vite/tsconfig.json`
2. **Visual runner** — AC-004
   - Files: `apps/playground-vite/visual/playwright.config.ts`, `apps/playground-vite/visual/run.ts`, `apps/playground-vite/visual/demos.spec.ts`, `apps/playground-vite/visual/__screenshots__`, `apps/demo-files.ts` `apps/test-utils.ts`
3. **SSR test** — AC-006
   - Files: `apps/playground-nuxt/vitest.config.ts`, `apps/playground-nuxt/test/ssr.test.ts`
4. **Scripts and deps** — AC-001 AC-004 AC-006 AC-008
   - Files: `package.json`, `apps/playground-vite/package.json`, `apps/playground-nuxt/package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `.gitignore`
5. **Seeded regressions** — AC-003 AC-005 AC-007 AC-008
   - Files: `tests/harness.test.ts` `tests/harness.config.ts` `tests/playgrounds.test.ts` `vitest.config.ts` `apps/playground-vite/src/style.css` `apps/playground-vite/src/DemoPage.vue` `apps/playground-nuxt/app/assets/css/main.css` `apps/playground-nuxt/app/pages/demo/[name].vue` `apps/playground-nuxt/nuxt.config.ts`
6. **Records** — AC-004
   - Files: `docs/questions.md`, `tasks/phase-0.md`, `knowledge/gotchas/test-harness.md`, `knowledge/index.md`

## Public Surface
- command `pnpm test:unit` — AC-008
- command `pnpm test:browser` — AC-001
- command `pnpm test:visual` — AC-004
- command `pnpm test:ssr` — AC-006
- export `mountDemo` — AC-001
- export `expectNoAxeViolations` — AC-002
- export `tab` — AC-002
- dependency `@vitest/browser-playwright` — AC-001
- dependency `playwright` — AC-004
- dependency `@playwright/test` — AC-004
- dependency `axe-core` — AC-002

## Gate log
- 2026-11-12 Stage 1: pass — plan self-approved (L): every Deliver/Accept item maps to an AC; no open questions; decisions settled by conventions and the maintainer's delegation; no irreversible step
- 2026-11-12 Stage 2: pass
- 2026-11-12 review: ran code (Public Surface not none), not asked: low risk, maintainer delegated
- 2026-11-12 Stage 2: pass
- 2026-11-13 Stage 3: pass

## Deviations
- 2026-11-12 apps/playground-vite/tsconfig.node.json What: includes vitest.config.ts, visual/**/*.ts and ../demo-files.ts Why: the node-side test configs and runner get type-checked by the playground build Effect: none at run time
- 2026-11-12 apps/playground-vite/visual/__screenshots__/ui-placeholder-default-dark-1024.png What: placeholder baseline from pnpm test:visual --update Why: test:visual needs baselines; maintainer delegated decisions and reviews the final product Effect: flagged for human approval in the summary
- 2026-11-12 apps/playground-vite/visual/__screenshots__/ui-placeholder-default-light-1024.png What: placeholder baseline from pnpm test:visual --update Why: as the dark baseline Effect: flagged for human approval in the summary
- 2026-11-12 apps/playground-vite/vite.config.ts What: preview.allowedHosts lists host.docker.internal Why: the visual tests' browser in the Playwright container reaches vite preview by that name; without it preview serves a Blocked request page Effect: preview only; dev server unchanged
- 2026-11-12 public surface What: DemoKind Why: apps/demo-files.ts lists demos and themes on disk for the Node-side visual runner and SSR test, which can't use import.meta.glob Effect: internal to apps/
- 2026-11-12 public surface What: demoFiles Why: apps/demo-files.ts lists demos and themes on disk for the Node-side visual runner and SSR test, which can't use import.meta.glob Effect: internal to apps/
- 2026-11-12 public surface What: registryDir Why: apps/demo-files.ts lists demos and themes on disk for the Node-side visual runner and SSR test, which can't use import.meta.glob Effect: internal to apps/
- 2026-11-12 public surface What: themeNames Why: apps/demo-files.ts lists demos and themes on disk for the Node-side visual runner and SSR test, which can't use import.meta.glob Effect: internal to apps/
- 2026-11-12 public surface What: vitest Why: devDependency of both playgrounds so their test scripts run vitest from the app folder Effect: same version as the root (5.1.0)
- 2026-11-12 public surface What: freePort Why: apps/test-utils.ts shares port and server start between tests/playgrounds.test.ts, the SSR test and the visual runner (review r1 F6, F14) Effect: internal to apps/ and tests/
- 2026-11-12 public surface What: startNodeServer Why: apps/test-utils.ts shares port and server start between tests/playgrounds.test.ts, the SSR test and the visual runner (review r1 F6, F14) Effect: internal to apps/ and tests/

## Open questions
-
