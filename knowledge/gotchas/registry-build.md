---
type: gotcha
title: Registry build gotchas
description: Deleting build output safely, macOS path case, build vs package script, generated agent files.
---

# Registry build gotchas

- **Don't guess which files a build owns from their names.** Three review rounds closed one `--out` path shape after another ("holds only `registry.json` and `r/`", "is a previous build") and the next review found another. `scripts/registry-build.ts` now writes `.heart-ui-registry-build.json` listing what it wrote. A rebuild deletes only those files and writes only into a missing, empty or marked folder. An unmarked `dist/registry` from an older build has to be deleted once.
- **`realpathSync` keeps the case you typed on macOS.** `realpathSync('REGISTRY')` returns `REGISTRY` on a case-insensitive disk, so overlap checks on it miss case variants. `realpathSync.native` returns the on-disk case.
- **Case-only differences collide on macOS.** Two item names, or two listed files, that differ only in case are one file on disk. Item names are lowercase, and a listed file must match its on-disk path exactly.
- **Case tests depend on the disk.** On Linux CI `REGISTRY` is a different folder, so assert per disk (`existsSync` of the variant) instead of expecting a refusal everywhere.
- **`statSync` follows links and throws on broken ones.** Wrap it (`isFolder`) so a dangling link gets a named error, not raw `ENOENT`.
- **`pnpm registry:build` and `node scripts/registry-build.ts` differ.** The package script runs `registry:api --check` (a type checker, about 2 s) first; tests and `registry:publish` call the build script directly and skip it. `pnpm run x --flag` appends `--flag` only to the script's last command.
- **Test fixtures under `dist/` belong to the repo's git but are ignored.** `registry:api` treats an ignored registry as having no history; a fixture that needs a baseline runs `git init` in its own folder (and drops `CI` from its environment, since that repo has no `origin/main`).
- **`String.replace` expands `$&`, `$$`, `$'` and `` $` `` in the replacement text.** `scripts/agent-context.ts` filled `{{items}}` with item descriptions, and a `$$` in one came out as `$`. Pass a function (`s.replace(x, () => text)`) whenever the inserted text isn't a literal you wrote.
- **Listing a module's export names for an import line must skip default exports.** `export { default }` and `export default function` both name `default`, which gave `import { default } from …`. The API index lists value exports only, defaults and `*Variants` helpers left out.
- **A lib item with no `index.ts` isn't importable by its folder.** `@/lib/utils` doesn't resolve; the index names the entry module (`index.ts`, else the one top-level `.ts`, so `@/lib/utils/utils`).
- **Name the file when a committed JSON snapshot is broken.** A bad `<name>.api.json` crashed the build with a bare `SyntaxError`; it now fails with `<kind>/<name>/<name>.api.json: is not valid JSON`.
