# 2026-11-12-m-p0-04-playgrounds
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-12-m-p0-04-playgrounds.md   (this feature's record for people)
Track: M   (sized up because: —; footprint: 22 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-12
Base: 4168b82
Owner: tam.mai@bigin.vn
Tool: claude-code
Verified: 4168b82 tree 488fe95ad543e97c5cc38aef17f2cb32866d604e
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline

## Handoff
- Tailwind v4 docs: @tailwindcss/vite plugin in vite.config / nuxt.config vite.plugins; CSS @import "tailwindcss"; registry is outside each app, so @source it
- vue-router 5: no breaking changes from 4 without file-based routing
- data-theme="dark" means dark mode (tokens.md), so theme name goes on data-tre-theme

## Tasks
1. **Placeholder demo item** — AC-003 AC-004 AC-009
   - Files: `registry/ui/placeholder/Placeholder.demo.vue`
2. **Vite playground** — AC-001 AC-003 AC-005 AC-007 AC-008 AC-009
   - Files: `apps/playground-vite/package.json`, `apps/playground-vite/index.html`, `apps/playground-vite/vite.config.ts`, `apps/playground-vite/tsconfig.json`, `apps/playground-vite/src/main.ts`, `apps/playground-vite/src/gallery.ts`, `apps/playground-vite/src/demos.ts`, `apps/playground-vite/src/GalleryApp.vue`, `apps/playground-vite/src/DemoPage.vue`, `apps/playground-vite/src/style.css`, `apps/playground-vite/src/env.d.ts`
3. **Nuxt playground** — AC-002 AC-004 AC-006 AC-007 AC-008 AC-009
   - Files: `apps/playground-nuxt/package.json`, `apps/playground-nuxt/nuxt.config.ts`, `apps/playground-nuxt/tsconfig.json`, `apps/playground-nuxt/app/app.vue`, `apps/playground-nuxt/app/demos.ts`, `apps/playground-nuxt/app/gallery-attrs.ts`, `apps/playground-nuxt/app/pages/demo/[name].vue`, `apps/playground-nuxt/app/assets/css/main.css`
4. **Registry tsconfig without Node types; root vue** — AC-010
   - Files: `registry/tsconfig.json`, `tsconfig.json`, `package.json`, `pnpm-lock.yaml`, `eslint.config.js`
5. **Tests** — AC-001 AC-002 AC-003 AC-004 AC-005 AC-006 AC-007 AC-008 AC-009 AC-010
   - Files: `tests/playgrounds.test.ts`, `tests/toolchain.test.ts`
6. **Questions log and task status** — AC-001
   - Files: `docs/questions.md`, `tasks/phase-0.md`

## Public Surface
- command `pnpm --filter playground-vite build` — AC-001
- command `pnpm --filter playground-nuxt build` — AC-002
- config `query theme|mode|dir` — AC-005
- dependency `vue@3.5.45` — AC-010
- dependency `vue-router@5.5.0` — AC-003
- dependency `vite@8.3.8` — AC-001
- dependency `@vitejs/plugin-vue@6.0.10` — AC-001
- dependency `tailwindcss@4.3.5` — AC-009
- dependency `@tailwindcss/vite@4.3.5` — AC-009
- dependency `nuxt@4.6.4` — AC-002

## Gate log
- 2026-11-12 Stage 1: pass — plan not stopped for approval: low-risk M, unattended
- 2026-11-12 Stage 2: pass
- 2026-11-12 review: ran code (Public Surface not none), not asked: low risk, unattended
- 2026-11-12 Stage 2: pass
- 2026-11-12 Stage 2: pass
- 2026-11-12 Stage 3: pass

## Deviations
- 2026-11-12 pnpm-workspace.yaml What: ignoredBuiltDependencies esbuild Why: pnpm 10 warned 'Ignored build scripts: esbuild' on install; esbuild's binary comes from its optional platform package, so its script isn't needed Effect: fresh-clone install stays warning-free; no dependency scripts run
- 2026-11-12 apps/playground-vite/src/env.d.ts What: not created Why: vue-tsc types .vue imports and tsconfig types bring vite/client Effect: one planned file fewer
- 2026-11-12 public surface What: createGallery Why: export of apps/playground-vite/src/gallery.ts, so tests render the gallery with a memory history Effect: pinned exactly or internal to the playground
- 2026-11-12 public surface What: demos Why: export of each playground's demos.ts, the demo loaders keyed by item name Effect: pinned exactly or internal to the playground
- 2026-11-12 public surface What: galleryAttrs Why: export of the Nuxt playground's gallery-attrs.ts, the allow-listed html attributes Effect: pinned exactly or internal to the playground
- 2026-11-12 public surface What: @tailwindcss/vite Why: Tailwind v4's Vite plugin, named by the task (Tailwind CSS v4) Effect: pinned exactly or internal to the playground
- 2026-11-12 public surface What: @vitejs/plugin-vue Why: compiles .vue files in the Vite playground Effect: pinned exactly or internal to the playground
- 2026-11-12 public surface What: nuxt Why: named by the task (Nuxt 4 playground) Effect: pinned exactly or internal to the playground
- 2026-11-12 public surface What: tailwindcss Why: named by the task (Tailwind CSS v4) Effect: pinned exactly or internal to the playground
- 2026-11-12 public surface What: vue-router Why: gallery routing in the Vite playground; Nuxt pins it too Effect: pinned exactly or internal to the playground
- 2026-11-12 apps/playground-vite/src/gallery-rules.ts What: new shared module with indexDemos and galleryAttrs; Nuxt imports it Why: review F1-F3, F9 (own-key lookup via Map, duplicate names rejected, one allow-list) Effect: apps/playground-nuxt/app/gallery-attrs.ts removed
- 2026-11-12 public surface What: indexDemos Why: review F3, shared demo index that rejects duplicate names Effect: internal to the playgrounds
- 2026-11-12 apps/playground-vite/tsconfig.node.json What: vite.config.ts typed separately with node types Why: review F8, src/ is browser code Effect: build runs vue-tsc on both configs
- 2026-11-12 apps/playground-nuxt/package.json What: vue-router removed Why: review F5, Nuxt provides it and the app no longer imports it Effect: vue-router stays only in playground-vite, logged in docs/questions.md
- 2026-11-12 apps/gallery-rules.ts What: shared demo index, demos glob and galleryAttrs moved out of the Vite app Why: review r2, Nuxt reached into playground-vite/src and the glob was duplicated Effect: both apps import one module; apps/playground-vite/src/gallery-rules.ts, src/demos.ts, app/demos.ts removed
- 2026-11-12 apps/playground-vite What: vue-router removed; gallery.ts maps location.pathname to DemoPage; GalleryApp.vue removed Why: review r2, CLAUDE.md forbids a dependency the task or conventions don't name; one route needs no router Effect: any path that is not /demo/<name> shows not found, like Nuxt's 404; questions.md entry dropped
- 2026-11-12 public surface What: createGallery takes a URL path, not a router history Why: router removed Effect: tests render the gallery for a path directly

## Open questions
-
