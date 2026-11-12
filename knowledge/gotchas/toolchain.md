---
type: gotcha
title: Toolchain gotchas
description: TypeScript 7 vs vue-tsc, seeded-error tests, empty tsconfig projects.
---

# Toolchain gotchas

- **TypeScript 7 breaks `vue-tsc` and `typescript-eslint`.** TS 7 is the native port and ships no JS compiler API; `vue-tsc` 3.3 fails with `./lib/tsc is not defined by "exports"`, and `typescript-eslint` 8.72 accepts only `<6.1.0`. Stay on TS 6.0.x until both support 7 ([questions](../../docs/questions.md)).
- **Seed errors into a sandbox, never the working tree.** A test that writes a broken file into `registry/` and runs `pnpm lint` leaves the repo broken when the run is killed, and fails concurrent lint runs. Copy the toolchain configs to a temp folder and symlink `node_modules` (`tests/toolchain.test.ts`, `sandbox()`).
- **A tsconfig with no matching files is an error** (TS18003), in `-p` and `-b` mode alike. A separate `registry/tsconfig.json` can only exist once `registry/` holds source.
- **`.gitignore` patterns with an inner slash are anchored to the root.** `.vitepress/cache/` misses `apps/docs/.vitepress/cache/`; write `**/.vitepress/cache/`. Prettier reads `.gitignore`; ESLint's flat config does not, so its ignore list is kept in step by hand.
