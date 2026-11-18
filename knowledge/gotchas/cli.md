---
type: gotcha
title: CLI gotchas
description: parseArgs value swallowing, fetch redirects and credentials, tsconfig paths semantics.
---

# CLI gotchas

- **`parseArgs` with `strict: false` takes the next argument as a string option's value, even an option.** `--theme --yes` sets `theme` to `--yes`. `packages/cli/src/cli.ts` treats a separate value that starts with `-` as missing; `--theme=-x` still works because the token's `inlineValue` is true.
- **`fetch` follows redirects and reports only the last URL.** Checking `response.url` lets a chain https → http → https through. The registry client fetches with `redirect: 'manual'` and checks every `Location` hop.
- **`fetch` refuses a URL with `user:pass@`.** It throws a `TypeError`, the same type as a network failure, so it looks like "check your connection". Refuse credentials when the URL is configured, not when it's fetched.
- **tsconfig `paths` follows tsc, not a key merge.** A child's `paths` replaces the inherited one whole. Inherited patterns resolve against the final `baseUrl` (else the folder of the config that set `paths`), and `${configDir}` is the folder of the config being read. Only `prefix/*` patterns name a folder.
- **`.git` can be a file.** In a worktree or submodule it is a file pointing to the git dir, so a "repo root" check must accept both.
