# Registry and CLI

## Registry format

The registry follows the shadcn registry schema: an index file plus one
JSON file per item. Fetch the current schema
(`https://ui.shadcn.com/schema/registry-item.json`) and validate against it
in `registry:build`; the field list below is a summary, not the authority.

| Heart UI kind | Schema `type` | Source folder |
| --- | --- | --- |
| Component | `registry:ui` | `registry/ui/<name>/` |
| Shared helper | `registry:lib` | `registry/lib/` |
| Block | `registry:block` | `registry/blocks/<name>/` |
| Layout | `registry:block`, category `layout` | `registry/layouts/<name>/` |
| Theme | `registry:theme` | `registry/themes/<name>.json` |

Each source folder holds an `item.json` with the hand-written fields. The
build adds file contents and emits `dist/registry/r/<name>.json`.

```json
{
  "name": "button",
  "type": "registry:ui",
  "title": "Button",
  "description": "Triggers an action. Use one primary button per view.",
  "dependencies": ["reka-ui", "class-variance-authority"],
  "registryDependencies": ["utils"],
  "files": ["Button.vue", "button.variants.ts", "index.ts"],
  "categories": ["actions"],
  "meta": { "version": "0.1.0", "tier": 1 }
}
```

## Item metadata

Fields Heart UI adds go under `meta`, which the schema leaves free-form.

| Field | Applies to | Content |
| --- | --- | --- |
| `version` | All | Semver of this item |
| `tier` | Components | 1, 2, or 3 |
| `useWhen` | Blocks, layouts | One or two sentences an agent matches a screen against |
| `avoidWhen` | Blocks, layouts | When another item fits better, naming it |
| `regions` | Layouts | Named slots with what belongs in each |
| `data` | Blocks, layouts | Shape of the props the item expects |
| `states` | Blocks, layouts | Subset of `empty`, `loading`, `error`, `long` that the item renders |

## Hosting

`dist/registry` deploys to Cloudflare R2 behind a public URL. Paths:
`/registry.json` (index), `/r/<name>.json` (items), `/docs/<name>.md`
(agent docs), `/llms.txt`.

## Project config

`init` writes `heart-ui.json` in the project root.

```json
{
  "$schema": "https://<registry-host>/schema/config.json",
  "framework": "nuxt",
  "css": "app/assets/css/theme.css",
  "aliases": { "ui": "@/components/ui", "blocks": "@/components/blocks", "layouts": "@/layouts", "lib": "@/lib" },
  "iconSet": "fluent",
  "registries": { "@heart-ui": "https://<registry-host>/r/{name}.json" }
}
```

## Lock file

`heart-ui.lock.json` records what was installed. `add` and `update` write
it; nothing else does.

```json
{
  "items": {
    "button": {
      "registry": "@heart-ui",
      "version": "0.1.0",
      "files": { "components/ui/button/Button.vue": "sha256-..." }
    }
  }
}
```

The hash is of the file content as written by the CLI, after alias
rewriting.

`add` writes the items you name; a file you have with other content is
refused unless `--overwrite`. An item pulled in as a dependency is written
only when its files are missing or unchanged: when you have edited it, your
files are kept, it stays out of the lock, and `add` says so. An unscoped
registry dependency means `@heart-ui`, as in the shadcn CLI; a third-party
item names its own dependencies in full (`@acme/x`). A
file under `registry/ui/`, `lib/`, `blocks/` or `layouts/` goes under the
matching alias; a file with `target` goes under the project root (`~/`).

## Commands

| Command | Behavior |
| --- | --- |
| `heart-ui init` | Detect Nuxt or Vite. Check Tailwind v4 and minimum versions. Write `heart-ui.json`, `tokens.css`, `theme.css`, the `utils` and `icon` helpers, and agent rule files. Flags: `--theme <preset>`, `--yes`. |
| `heart-ui add <item...>` | Resolve `registryDependencies` recursively. Rewrite import aliases. Write files. Install npm `dependencies` with the project's package manager. Update the lock file. Refuse to overwrite an existing file unless `--overwrite`. |
| `heart-ui list` | Print items from the index. Flags: `--type`, `--category`, `--json`. |
| `heart-ui diff [item]` | For each installed item, compare lock version with the registry. Print a unified diff of upstream changes per file. Exit 1 when updates exist. |
| `heart-ui update [item]` | Per file: if the local hash equals the lock hash, replace the file. Otherwise run a three-way merge (base = locked version fetched from the registry, ours = local, theirs = latest). Write conflict markers on conflict and report the file. |
| `heart-ui theme <path or URL>` | Read a knob file, run `generateTheme`, and replace `tokens.css`. |
| `heart-ui audit <file...>` | Run the screen checklist in [agent-support.md](agent-support.md#audit-checklist). Exit 1 on any failure. `--json` for machine output. |

All commands accept `--cwd`. All output is plain text without color codes
when stdout is not a TTY.

`update` needs old versions. The registry keeps every published item
version at `/r/<name>@<version>.json`.

`init` writes `theme.css` and `tokens.css` to `assets/css/` under the
folder `@` points to (`app/` in Nuxt, `src/` in Vite); `heart-ui.json`
`css` holds the `theme.css` path. When exactly one CSS file there has
`@import "tailwindcss";`, that line becomes an import of `theme.css`,
which imports Tailwind itself. It refuses to run when `heart-ui.json` or a
file it would write exists, and asks before writing unless `--yes`.

Exit codes: 0 on success, 1 when a command fails (or, for `diff` and
`audit`, finds something), 2 for a usage mistake (an unknown command or
option, a missing value, a `--cwd` that is not a folder). Errors print one
line, `heart-ui: <message>`, to stderr.

`list` reads the `@heart-ui` index, `registry.json` beside the `r/` folder
of its item template, from `heart-ui.json` or the default registry when
there is none. `--json` prints the matching index entries on one line.

Fetched items and indexes are cached in `$XDG_CACHE_HOME/heart-ui`, else
`~/.cache/heart-ui`. A pinned item (`<name>@<version>`) never changes, so
it comes from the cache when present. An unpinned item is always fetched;
its cached copy is used, with a warning, only when the registry cannot be
reached, answers with a server error, or sends something that is not an
item.

Registry URLs must be https; plain http is accepted only for `localhost`,
`127.0.0.1` and `[::1]`. Every redirect hop is checked the same way, and a
URL may not hold a user name or password. Items are untrusted: a file
`path` or `target` must be relative (`~/` for the project root) with no
`..`, `.git` or `node_modules` segment, and a response over 5 MB is refused.

Global options (`--cwd`, `--help`, `--version`) go before or after the
command name; a command's own options go after it.

## Third-party registries

Any host serving the same schema works. Users add it under `registries`
and install with `heart-ui add @scope/<item>`.
