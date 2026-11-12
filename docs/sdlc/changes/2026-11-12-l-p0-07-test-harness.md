# P0-07 Test harness

## Why

**Request (verbatim):** "you decide for me, i will look at the final product only" (next ready task: P0-07).

Task [P0-07](../../../tasks/phase-0.md#p0-07-test-harness): the checks every item must pass before it's done (constitution IV and [conventions.md](../../conventions.md), definition of done). These are browser behavior with axe, visual baselines across themes and modes, and SSR with no hydration warning. They run as `test:unit`, `test:browser`, `test:visual` and `test:ssr`.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| Browser tests: Vitest 5.1 browser mode with `@vitest/browser-playwright` (Chromium), configured in `apps/playground-vite/vitest.config.ts` on top of the playground's Vite config. `mountDemo` mounts a demo from the gallery index with Vue's `createApp`. | `vitest-browser-vue` | Conventions name Vitest browser mode on Playwright; `createApp` needs no extra package for mounting a demo. |
| `expectNoAxeViolations(root)` runs `axe-core` on the mounted DOM and fails with each rule id, help text and target. Every demo is checked in light and dark. | `@axe-core/playwright` | Conventions name `axe-core` inside browser tests. |
| Keyboard helpers `tab`, `shiftTab`, `press(key)` and `focused()` wrap `userEvent.keyboard` from `vitest/browser` | — | They give one way for component tests to drive the keyboard. |
| Visual tests: Playwright Test runs on the host and connects (`connectOptions.wsEndpoint`) to the lockfile's `playwright-core run-server`, mounted read-only into `mcr.microsoft.com/playwright` pinned by digest for 1.65.0. The browser reaches the playground's `vite preview` via `host.docker.internal`. Preview binds to loopback, or to the bridge gateway on Linux. | run the whole test inside the container | Screenshots come from the official Linux image on every machine. The host's macOS `node_modules` (native esbuild and rolldown) never enter the container. The same command works in CI on Ubuntu (`--add-host=host.docker.internal:host-gateway`). |
| The visual runner walks every demo × every `registry/themes/*.json` × light and dark through `/demo/<name>?theme=&mode=`. Blocks and layouts also go across widths 375, 768 and 1280; components use one width, 1024. Comparison is exact (`maxDiffPixels: 0`). | per-pixel threshold | A threshold hides small token regressions; the container makes rendering deterministic. |
| The playgrounds load only the default theme's `tokens.css`, so other themes would render as the default. Logged in `docs/questions.md`. | per-theme CSS now | Only `default` exists; the first preset theme adds per-theme scoping. |
| SSR test: builds `playground-nuxt`, starts its server, and opens every demo in light and dark in Chromium (host Playwright). It fails on any console message about hydration, any console error and any page error. Nuxt is built with `debug: { hydration: true }`. | `@nuxt/test-utils` | No new framework, and a production build is what ships. Production Vue checks attribute, class and style mismatches only with that flag (`@nuxt/schema` maps it to `__VUE_PROD_HYDRATION_MISMATCH_DETAILS__`). Review r1 F1 showed a `useId()`-style `id` mismatch passing without it. |
| Seeded regressions: `tests/harness.test.ts` copies the repo into a temp sandbox (tracked and untracked files, `node_modules` symlinked) and seeds one regression per script. The seeds are a failing unit test, a demo with a nameless `<button>` plus a failing item browser test, a demo whose `id` differs on server and client, and a placeholder height change. The script must fail with the matching message. The suite runs as its own script, `pnpm test:harness`, outside the root suite, so `pnpm test` needs no Docker. | seed into the working tree | P0-03's gotcha: a killed run would leave the repo broken. |
| Root scripts call the apps with `pnpm --dir <app> run`. `test:unit` is `vitest run` (the root suite); `pnpm test:visual --update` passes `--update-snapshots`. | `pnpm --filter` | `--filter` exits 0 when the script is missing (P0-03 gotcha). |
| Placeholder baselines are generated with `pnpm test:visual --update` and committed. They're flagged for the maintainer in the summary, since baselines need human approval. | leave baselines missing | `test:visual` can't pass without them; the maintainer reviews the final product and approves them there. |

**Proposals not asked for:** None

## Acceptance criteria

- **AC-001** Task Deliver: `pnpm test:browser` mounts every demo with `mountDemo` and finds no axe violations in light or dark; it passes on the placeholder demo.
- **AC-002** Task Deliver: `tab`, `shiftTab` and `press` move focus and send keys as a user would, and `expectNoAxeViolations` fails, naming the rule, on an inaccessible element.
- **AC-003** Task Accept: `pnpm test:browser` fails on a seeded axe regression.
- **AC-004** Task Deliver: `pnpm test:visual` screenshots every demo across themes, modes (and widths for blocks and layouts) through the gallery routes, in the official Playwright container, and passes against the committed baselines.
- **AC-005** Task Accept: `pnpm test:visual` fails on a seeded visual change.
- **AC-006** Task Deliver: `pnpm test:ssr` renders every demo in `playground-nuxt` with no hydration warning; it passes on the placeholder demo.
- **AC-007** Task Accept: `pnpm test:ssr` fails on a seeded hydration mismatch.
- **AC-008** Task Accept: `pnpm test:unit` passes, and fails on a seeded failing unit test.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | apps/playground-vite/test/demos.browser.test.ts | `pnpm test:browser` |
| AC-002 | apps/playground-vite/test/harness.browser.test.ts | `pnpm test:browser` |
| AC-003 | tests/harness.test.ts › seeded regressions › test:browser fails on an axe violation | `pnpm test:harness -t "test:browser fails"` |
| AC-004 | apps/playground-vite/visual/demos.spec.ts | `pnpm test:visual` |
| AC-005 | tests/harness.test.ts › seeded regressions › test:visual fails on a visual change | `pnpm test:harness -t "test:visual fails"` |
| AC-006 | apps/playground-nuxt/test/ssr.test.ts | `pnpm test:ssr` |
| AC-007 | tests/harness.test.ts › seeded regressions › test:ssr fails on an attribute hydration mismatch | `pnpm test:harness -t "test:ssr fails"` |
| AC-008 | tests/harness.test.ts › seeded regressions › test:unit fails on a failing test | `pnpm test:harness -t "test:unit fails"` |

## Must never break

- `pnpm test` (the root suite) and the existing playground tests still pass.
- No test writes into the working tree outside its own output folders.

## Failure modes

- Docker not running: `test:visual` fails with a message saying so, instead of falling back to host screenshots.
- A killed visual run leaves a container: it runs with `--rm`, and the runner stops it in `finally`.

## Out of scope

- The CI workflow and `pnpm check` (P0-09); per-theme CSS in the playgrounds (first preset theme).

## Review

- **Recommended and chosen:** code, because `## Public Surface` adds four commands, helpers and dependencies; chosen by the trigger list (low risk, maintainer delegated decisions).
- **Verdicts:** built-in `code-review high --max-findings all` → `.sdlc/.work/findings/2026-11-12-l-p0-07-test-harness/code-reviewer-r1.md` → FAIL (F1, F2 and F3 high). Round 2 closing check → `code-reviewer-r2.md` → PASS (one medium and four lows; three fixed, two kept).
- **Fixed:**
  - F1: `debug: { hydration: true }`, proved by an `id`-mismatch seed that passes without it.
  - F2: `pnpm test:harness`, outside the root suite.
  - F3: item browser tests next to items run in `test:browser`.
  - F4: axe scans the body, and demos sit in `<main>`.
  - F5: the runner retries a real connect.
  - F6, F14: shared `apps/test-utils.ts`.
  - F7: the body uses token background and foreground; baselines regenerated and inspected.
  - F8: `pnpm test:install`.
  - F9, M1: lockfile `playwright-core` mounted read-only, image pinned by digest, run as `linux/amd64`.
  - F10: preview binds loopback, or the bridge gateway on Linux.
  - F12, F13, L3: tighter seed regex; `press` handles single characters.
  - F15: files listed once.
  - F17: the runner refuses themes the playgrounds can't render.
  - F18: record updated.
  - L2: container stopped on signals, early exit detected.
- **Kept:**
  - F11: the sandbox shares `node_modules` caches; seeds touch only `registry/` and `tests/`.
  - F16: placeholder baselines generated by the agent under the maintainer's delegation; flagged in `docs/questions.md` for human approval.
  - L1: Docker Desktop for Linux or rootless Docker is untested.
  - L4: a port clash on Linux fails clearly through `--strictPort`.
- **Drift and manual checks:**
  - I inspected both baselines by eye. The first run had recorded Vite's "Blocked request" page, which led to `preview.allowedHosts` and the rendered-demo assertion.
  - The gallery pages now wrap demos in `<main>`.
  - The AC rows and the AC-007 seed changed during review (the change-file edit awaits the user's acceptance of the sdlc notice).
  - New devDependencies: `@vitest/browser-playwright`, `vitest`, `playwright`, `@playwright/test`, `axe-core`, as conventions name them.
  - No `manual` ACs.
- **Lessons filed:** [knowledge/gotchas/test-harness.md](../../../knowledge/gotchas/test-harness.md)
