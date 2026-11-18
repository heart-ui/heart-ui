---
'heart-ui': minor
---

Add `heart-ui add <item...>`: resolves registry dependencies, writes items under the configured aliases with imports rewritten, keeps dependencies you changed, installs npm dependencies pinned exactly, refuses to replace your files without `--overwrite`, and records each file's hash in `heart-ui.lock.json` (P1-15).
