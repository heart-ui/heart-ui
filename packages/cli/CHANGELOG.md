# heart-ui

## 0.1.0-alpha.0

### Minor Changes

- 8b58317: Add `heart-ui add <item...>`: resolves registry dependencies, writes items under the configured aliases with imports rewritten, keeps dependencies you changed, installs npm dependencies pinned exactly, refuses to replace your files without `--overwrite`, and records each file's hash in `heart-ui.lock.json` (P1-15).
- c2d85a0: Add the `heart-ui` CLI core: the bin, argument parsing, `heart-ui.json` read and write, project detection (Nuxt or Vite, package manager, Tailwind major, path aliases), a registry client with an on-disk cache, and import alias rewriting (P1-13).
- 8d20c4e: Add `heart-ui init`: checks Node 22, Vue 3.5, Nuxt 4 and Tailwind CSS 4, then writes `heart-ui.json`, `theme.css` and `tokens.css` (from a preset), the `utils` and `icon` helpers, and `AGENTS.md`, points the app's Tailwind import at the theme, and installs the helpers' dependencies pinned exactly (P1-14).
- 67b1bc8: Add `heart-ui list`: prints the registry's items (name, type, description), filtered with `--type` and `--category`, or as JSON with `--json`; works before `init` and falls back to a cached index offline (P1-16).
- 1eff282: `heart-ui init --registry <url>` sets the `@heart-ui` item URL in `heart-ui.json`, for a mirror or a self-hosted registry (P1-17).

### Patch Changes

- Updated dependencies
  - @heart-ui/theme@0.1.0-alpha.0
