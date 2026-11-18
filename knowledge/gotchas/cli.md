---
type: gotcha
title: CLI gotchas
description: parseArgs, fetch redirects, tsconfig paths, symlink-safe edits, write order, test caches.
---

# CLI gotchas

- **`parseArgs` with `strict: false` takes the next argument as a string option's value, even an option.** `--theme --yes` sets `theme` to `--yes`. `packages/cli/src/cli.ts` treats a separate value that starts with `-` as missing; `--theme=-x` still works because the token's `inlineValue` is true.
- **`fetch` follows redirects and reports only the last URL.** Checking `response.url` lets a chain https → http → https through. The registry client fetches with `redirect: 'manual'` and checks every `Location` hop.
- **`fetch` refuses a URL with `user:pass@`.** It throws a `TypeError`, the same type as a network failure, so it looks like "check your connection". Refuse credentials when the URL is configured, not when it's fetched.
- **tsconfig `paths` follows tsc, not a key merge.** A child's `paths` replaces the inherited one whole. Inherited patterns resolve against the final `baseUrl` (else the folder of the config that set `paths`), and `${configDir}` is the folder of the config being read. Only `prefix/*` patterns name a folder.
- **`.git` can be a file.** In a worktree or submodule it is a file pointing to the git dir, so a "repo root" check must accept both.
- **`rename` over a path replaces a symlink; `realpath` and write beside the target to keep it.** Then check the target is inside the project, or a cloned repo's `AGENTS.md -> ~/.bashrc` gets edited. `packages/cli/src/fs.ts` has `editFile` (keeps the link and mode) and `writeNewFile` (`link` refuses an existing path, unlike `rename`).
- **A file that marks "set up" goes last.** `init` writes `heart-ui.json` after every other file and edit, and rolls back on failure. Written first, a failed run blocks every re-run.
- **Prettier rewrites fixture CSS and JSON.** `@import "tailwindcss";` becomes single-quoted, so assert against the fixture as formatted.
- **Give each test its own registry cache.** A shared cache lets one test's item stand in for another's when the client falls back to the cache on an invalid answer.
- **"Did the user edit it?" is a question for the lock, not the registry.** Compare the file with the hash `heart-ui.lock.json` recorded (LF-normalised); comparing with the latest registry copy calls every untouched but outdated file "yours".
- **A bare `registryDependencies` name means the default registry.** The shadcn CLI reads it that way, and its docs advise full names (`@acme/x`) for anything else.
- **Run the install inside the write's rollback.** Writes then install, with the install as `writeSteps`'s `after` step: a failed install undoes the files and the lock, and the message must then say so rather than offer a command that finishes half the job.
