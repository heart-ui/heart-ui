# Registry and CLI

## Registry format

The registry follows the shadcn registry schema: an index file plus one
JSON file per item. Fetch the current schema
(`https://ui.shadcn.com/schema/registry-item.json`) and validate against it
in `registry:build`; the field list below is a summary, not the authority.

| TrevUI kind | Schema `type` | Source folder |
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

Fields TrevUI adds go under `meta`, which the schema leaves free-form.

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

`init` writes `trevui.json` in the project root.

```json
{
  "$schema": "https://<registry-host>/schema/config.json",
  "framework": "nuxt",
  "css": "app/assets/css/trevui.css",
  "aliases": { "ui": "@/components/ui", "blocks": "@/components/blocks", "layouts": "@/layouts", "lib": "@/lib" },
  "iconSet": "fluent",
  "registries": { "@trevui": "https://<registry-host>/r/{name}.json" }
}
```

## Lock file

`trevui.lock.json` records what was installed. `add` and `update` write
it; nothing else does.

```json
{
  "items": {
    "button": {
      "registry": "@trevui",
      "version": "0.1.0",
      "files": { "components/ui/button/Button.vue": "sha256-..." }
    }
  }
}
```

The hash is of the file content as written by the CLI, after alias
rewriting.

## Commands

| Command | Behavior |
| --- | --- |
| `trevui init` | Detect Nuxt or Vite. Check Tailwind v4 and minimum versions. Write `trevui.json`, `tokens.css`, `theme.css`, the `utils` and `icon` helpers, and agent rule files. Flags: `--theme <preset>`, `--yes`. |
| `trevui add <item...>` | Resolve `registryDependencies` recursively. Rewrite import aliases. Write files. Install npm `dependencies` with the project's package manager. Update the lock file. Refuse to overwrite an existing file unless `--overwrite`. |
| `trevui list` | Print items from the index. Flags: `--type`, `--category`, `--json`. |
| `trevui diff [item]` | For each installed item, compare lock version with the registry. Print a unified diff of upstream changes per file. Exit 1 when updates exist. |
| `trevui update [item]` | Per file: if the local hash equals the lock hash, replace the file. Otherwise run a three-way merge (base = locked version fetched from the registry, ours = local, theirs = latest). Write conflict markers on conflict and report the file. |
| `trevui theme <path or URL>` | Read a knob file, run `generateTheme`, and replace `tokens.css`. |
| `trevui audit <file...>` | Run the screen checklist in [agent-support.md](agent-support.md#audit-checklist). Exit 1 on any failure. `--json` for machine output. |

All commands accept `--cwd`. All output is plain text without color codes
when stdout is not a TTY.

`update` needs old versions. The registry keeps every published item
version at `/r/<name>@<version>.json`.

## Third-party registries

Any host serving the same schema works. Users add it under `registries`
and install with `trevui add @scope/<item>`.
