---
type: gotcha
title: Writing lint rules over Vue and TS source
description: Context resolution, vue-eslint-parser quirks, and how review rounds converge.
---

# Writing lint rules over Vue and TS source

- **Resolve a string's context by walking up, not by checking the parent.** A value reaches its attribute or property through ternaries, `??`, `+`, arrays, objects, template literals, TS wrappers (`as const`) and arrow bodies. One resolver (`contextOf` in `packages/eslint-plugin/src/rules/no-raw-values.ts`) fixed what four rounds of per-shape patches kept missing.
- **vue-eslint-parser lowercases directive arguments** in `VIdentifier.name`; `rawName` keeps `:activeClass`.
- **Decide "inside registry/ui/" from the file's own path** (nearest `/registry/` segment), never `context.cwd`: editors run ESLint from other folders.
- **A heuristic rule has an open surface.** Review each round on "does the fix hold and did it add a bug"; ticket rare shapes instead of chasing every one.
