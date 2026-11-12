# P0-04 Playgrounds

## Why

**Request (verbatim):** "ok, continue without my attend" (next ready task: P0-04)

Task [P0-04](../../../tasks/phase-0.md#p0-04-playgrounds): `apps/playground-vite` and `apps/playground-nuxt` with
Tailwind CSS v4, importing items from `registry/` by alias, with a gallery route `/demo/<name>` and the `theme`, `mode`
and `dir` query parameters. P0-05 (theme), P0-07 (browser, visual and SSR tests) and every component build on these
two apps.

**The user's words:** run unattended, taking the recommended option at each decision.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| A demo's name is its item folder: `registry/{ui,blocks,layouts}/<name>/*.demo.vue` → `/demo/<name>` | the file name (`Button.demo.vue` → `Button`) | Item names are folder names everywhere else (`check:item <name>`, `registry.md`). |
| The placeholder demo is an item: `registry/ui/placeholder/Placeholder.demo.vue` | a fixture folder outside `registry/` | P0-07 and P0-09 run their checks on "the placeholder demo" and `check:item placeholder`. Logged in `docs/questions.md`. |
| `theme` sets `data-tre-theme="<name>"` on `<html>` (default `default`); P0-05 loads the theme's CSS by it | `data-theme`; loading a file now | `data-theme="dark"` already means dark mode in tokens.md, and no theme file exists before P0-05. Logged in `docs/questions.md`. |
| Query values are allow-listed: `mode=dark` only, `dir` `rtl` or `ltr`, `theme` `[a-z0-9-]+`; anything else falls back | passing them through | They come from the URL and land in HTML attributes. |
| Vite: a classic inline script at the top of `<head>` sets the attributes before CSS loads; Nuxt: `useHead` `htmlAttrs` from the route, rendered by SSR | a client-side router hook | Both put `.dark` on `<html>` in the first paint. Visual tests load each URL fresh, so the Vite script runs once per page. |
| Registry code gets its own `registry/tsconfig.json` without `@types/node` | one root tsconfig | Items ship to browsers; closes P0-03's R2-5 ticket, now possible because `registry/` has source. |
| `vue` 3.5.45 as a root devDependency | none | `registry/` resolves `vue` from the root to typecheck `.vue` items. |
| The Vite app's `build` runs `vue-tsc` first, as create-vite does | no app typecheck | Catches type errors in the playground code. The Nuxt app's typecheck is left to a ticket (needs `vite-plugin-checker` or `nuxt typecheck` setup). |

**Proposals not asked for:** None

## Acceptance criteria

- **AC-001** Given the Vite playground, when `pnpm --filter playground-vite build` runs, then it exits 0.
- **AC-002** Given the Nuxt playground, when `pnpm --filter playground-nuxt build` runs, then it exits 0.
- **AC-003** Given the Vite gallery, when `/demo/placeholder` renders, then the placeholder demo from `registry/` is on the page.
- **AC-004** Given the built Nuxt app, when `/demo/placeholder` is requested, then the server-rendered HTML holds the placeholder demo.
- **AC-005** Given the built Vite `index.html`, when `?mode=dark&dir=rtl&theme=ocean` is loaded, then a script that runs before any stylesheet or module adds `.dark`, `dir="rtl"` and `data-tre-theme="ocean"` to `<html>`.
- **AC-006** Given the built Nuxt app, when `/demo/placeholder?mode=dark&dir=rtl&theme=ocean` is requested, then the server-rendered `<html>` has `class="dark"`, `dir="rtl"` and `data-tre-theme="ocean"`.
- **AC-007** Given either app, when the parameters are missing or invalid, then `<html>` has no `.dark`, `dir="ltr"` and `data-tre-theme="default"`.
- **AC-008** Given either app, when `/demo/<name>` names no demo, then Nuxt answers 404 and Vite shows a not-found message.
- **AC-009** Given either app's build, when its CSS is read, then it holds the Tailwind utility the placeholder demo uses.
- **AC-010** Given `pnpm typecheck`, when a registry `.ts` file uses the Node global `process`, then it fails.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | tests/playgrounds.test.ts › vite playground › builds | `pnpm vitest run tests/playgrounds.test.ts -t "vite playground > builds$"` |
| AC-002 | tests/playgrounds.test.ts › nuxt playground › builds | `pnpm vitest run tests/playgrounds.test.ts -t "nuxt playground > builds$"` |
| AC-003 | tests/playgrounds.test.ts › vite playground › renders the placeholder demo | `pnpm vitest run tests/playgrounds.test.ts -t "vite playground > gallery route > vite playground renders the placeholder demo"` |
| AC-004 | tests/playgrounds.test.ts › nuxt playground › renders the placeholder demo | `pnpm vitest run tests/playgrounds.test.ts -t "nuxt playground > nuxt playground renders the placeholder demo"` |
| AC-005 | tests/playgrounds.test.ts › vite playground › sets mode, dir and theme before first paint | `pnpm vitest run tests/playgrounds.test.ts -t "vite playground > first paint > vite playground sets mode"` |
| AC-006 | tests/playgrounds.test.ts › nuxt playground › server-renders mode, dir and theme | `pnpm vitest run tests/playgrounds.test.ts -t "nuxt playground > nuxt playground server-renders mode"` |
| AC-007 | tests/playgrounds.test.ts › vite playground › falls back on missing or invalid parameters; nuxt playground › falls back on missing or invalid parameters | `pnpm vitest run tests/playgrounds.test.ts -t "falls back"` |
| AC-008 | tests/playgrounds.test.ts › vite playground › shows not found for an unknown demo; nuxt playground › answers 404 for an unknown demo | `pnpm vitest run tests/playgrounds.test.ts -t "unknown demo"` |
| AC-009 | tests/playgrounds.test.ts › vite playground › builds Tailwind utilities from registry/; nuxt playground › builds Tailwind utilities from registry/ | `pnpm vitest run tests/playgrounds.test.ts -t "Tailwind utilities"` |
| AC-010 | tests/toolchain.test.ts › scripts fail on a seeded problem in registry/ › typecheck fails when registry code uses a Node global | `pnpm vitest run tests/toolchain.test.ts -t "Node global"` |

## Must never break

- `pnpm lint`, `pnpm typecheck` and a fresh-clone `pnpm install --frozen-lockfile` stay clean (P0-02, P0-03).
- Playgrounds never copy item code: every demo comes from `registry/` through the alias.

## Failure modes

- Untrusted input: the query parameters reach HTML attributes → AC-007.

## Out of scope

- Theme CSS and tokens (P0-05); browser, visual and SSR test helpers (P0-07).
- A demo index page; client-side navigation between parameter sets in the Vite app.
- Type-checking the Nuxt app (ticket).

## Review

- **Recommended and chosen:** code, because `## Public Surface` isn't `- none` (new dependencies, exports, query parameters); chosen by the trigger list (low risk, unattended run). Security did not fire: the query parameters reach HTML attributes only, not a shell, file path or database (AC-007 covers them).
- **Verdicts:** built-in `code-review high --max-findings all` → `.sdlc/.work/findings/2026-11-12-m-p0-04-playgrounds/code-reviewer-r1.md` → FAIL — F1, F2 (high), F3, F4, F7, F8, F10, F12; round 2 closing check → `code-reviewer-r2.md` → PASS (no high; its low bugs fixed in the same pass).
- **Fixed:** F1, F2 (high): demo lookup on a plain object matched `Object.prototype` keys, so `/demo/constructor` crashed (Vite) or answered 500 (Nuxt); demos are now a `Map` built by `indexDemos` in `apps/gallery-rules.ts` ('… unknown demo: constructor / __proto__ / toString' in both apps). F3: duplicate demo names throw ('demo index rejects …'). F4: sandbox copies every toolchain file again, no skip. F7: Nuxt `<html lang="en">` ('nuxt playground sets lang on html'). F8: the Vite app's `src/` no longer sees `@types/node` (`tsconfig.node.json` for `vite.config.ts`). F9, R2-8, R2-9: one shared module for the demo glob, index and attribute rules. F10, R2-1: Nuxt readiness polls with per-request timeouts, sees signal exits and spawn errors. F12: ASCII 404 status message. R2-4, R2-5, R2-6, R2-14: tests remove stale builds, fail fast on a failed Nuxt build, always close the Vite server, and cancel unread bodies. R2-7, R2-12: `vue-router` removed (no doc names it); the gallery reads the path, so every other path shows not found ('… shows not found for a path that is not a demo').
- **Tickets:** F11 the full suite runs both production builds (about 2 minutes; P0-07/P0-09 move build-backed tests into their own scripts). F13, R2-2 the placeholder fixture sits in `registry/ui/`, and `registry/tsconfig.json` fails (TS18003) if `registry/` ever holds no source: P0-08 decides how fixtures are excluded from the build. The Vite inline head script repeats the allow-list in `apps/gallery-rules.ts`, because it must be a classic script that runs before CSS; AC-005 and AC-007 test both with the same cases. R2-10 one `vue-tsc -b` instead of two `-p` runs. R2-13 `freePort` race before Nitro binds. Nuxt app type-checking.
- **Drift and manual checks:** Decisions and AC-003's wording predate the router removal: the Vite gallery maps `location.pathname` itself, and `createGallery(path)` replaces `createGallery(history)`. Deviations: `env.d.ts` not created; `pnpm-workspace.yaml` `ignoredBuiltDependencies: [esbuild]` keeps installs warning-free; new `apps/gallery-rules.ts` and `apps/playground-vite/tsconfig.node.json`; `vue-router` removed from both apps; `GalleryApp.vue`, both `demos.ts` and `gallery-attrs.ts` removed. No `manual` ACs.
- **Lessons filed:** [knowledge/gotchas/toolchain.md](../../../knowledge/gotchas/toolchain.md) (Vitest `-t` names, `pnpm --filter` with a missing script, pnpm's cached build-script warning)
