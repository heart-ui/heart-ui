# 2026-11-12-m-p0-05-theme-package
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-12-m-p0-05-theme-package.md   (this feature's record for people)
Track: M   (sized up because: —; footprint: 18 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-12
Base: 1b7d253
Owner: tam.mai@bigin.vn
Tool: claude-code
Verified: 1b7d253 tree d94418535d065818c1fef39e34196942e607a581
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline: this session builds it, one part

## Handoff
- OKLab matrices: Björn Ottosson, 'A perceptual color space for image processing' (bottosson.github.io/posts/oklab)
- Tailwind namespaces checked on tailwindcss.com/docs/theme 2026-11-12: no z-index or duration namespace; spacing keys need a build to prove h-<name>
- Dark primary-foreground (neutral-950) on primary-500 is ~4.2:1, so the default theme moves dark primary and its states

## Tasks
1. **Color math** — AC-002 AC-007
   - Files: `packages/theme/src/color.ts`
2. **Scales, semantic mapping, contrast** — AC-002 AC-003 AC-004
   - Files: `packages/theme/src/scales.ts`, `packages/theme/src/semantic.ts`
3. **generateTheme, knobs and tokens.css** — AC-001 AC-005 AC-006
   - Files: `packages/theme/src/index.ts`, `packages/theme/css/tokens.css`, `registry/themes/default.json`
4. **theme.css and playgrounds** — AC-008 AC-009 AC-010
   - Files: `packages/theme/css/theme.css`, `apps/playground-vite/src/style.css`, `apps/playground-nuxt/app/assets/css/main.css`, `apps/playground-vite/package.json`, `apps/playground-nuxt/package.json`, `registry/ui/placeholder/Placeholder.demo.vue`
5. **Package, config and tests** — AC-001 AC-002 AC-003 AC-004 AC-005 AC-006 AC-007 AC-008 AC-009
   - Files: `packages/theme/package.json`, `packages/theme/test/theme.test.ts`, `tests/playgrounds.test.ts` `packages/theme/scripts/generate.mjs`, `vitest.config.ts`, `tsconfig.json`, `.prettierignore`, `pnpm-lock.yaml`
6. **Questions log and task status** — AC-007
   - Files: `docs/questions.md`, `tasks/phase-0.md`

## Public Surface
- export `generateTheme` — AC-001
- export `checkContrast` — AC-003
- export `Knobs` — AC-006
- command `pnpm --filter @heart-ui/theme generate` — AC-005
- dependency `tailwindcss` — AC-008
- dependency `tsdown` — AC-001

## Gate log
- 2026-11-12 Stage 1: pass — plan not stopped for approval: low-risk M, autopilot
- 2026-11-12 AC-010 manual: nuxt build of playground-nuxt; entry CSS holds --tre-primary, .bg-primary{background-color:var(--tre-primary)} and .h-control-md{height:var(--tre-control-md)}
- 2026-11-12 Stage 2: pass
- 2026-11-12 review: ran code (Public Surface not none), not asked: low risk, autopilot
- 2026-11-12 Stage 2: pass
- 2026-11-12 Stage 3: pass

## Deviations
- 2026-11-12 registry/ui/placeholder/Placeholder.demo.vue What: demo uses bg-primary, text-primary-foreground and h-control-md Why: the playground test (AC-009) needs registry source using the utilities Tailwind scans for Effect: placeholder renders as a primary-colored bar
- 2026-11-12 public surface What: Adjustment Why: the report types checkContrast returns, re-exported from index.ts Effect: public types of @heart-ui/theme
- 2026-11-12 public surface What: ContrastCheck Why: the report types checkContrast returns, re-exported from index.ts Effect: public types of @heart-ui/theme
- 2026-11-12 public surface What: ContrastReport Why: the report types checkContrast returns, re-exported from index.ts Effect: public types of @heart-ui/theme
- 2026-11-12 public surface What: Mode Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: Oklch Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: Resolved Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: Scale Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: Scales Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: buildScales Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: clampToGamut Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: contrast Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: format Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: overlay Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: parseColor Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: resolveSemantic Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: scaleNames Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: statuses Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: steps Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: toSrgb Why: shared between packages/theme/src modules (color.ts, semantic.ts, index.ts); not re-exported from index.ts Effect: internal to the package
- 2026-11-12 public surface What: @heart-ui/theme Why: both playgrounds import @heart-ui/theme/theme.css (workspace:*) Effect: playgrounds depend on the theme package
- 2026-11-12 public surface What: vitest Why: packages/theme test script runs vitest from the package, as P0-06's package does Effect: devDependency of packages/theme, same version as the root
- 2026-11-12 tests/playgrounds.test.ts What: AC-009 and AC-010 assert token utilities in the existing Vite and Nuxt build tests; tests/playground-theme.test.ts removed; packages/theme/scripts/generate.ts writes tokens.css Why: review r1 F13 (duplicate build) and F15 (generate approved its own pin) Effect: AC-010 is tested, no longer manual

## Open questions
-
