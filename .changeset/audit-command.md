---
'heart-ui': minor
---

Add `heart-ui audit <file...>`: checks screen files against the A1 to A8 checklist (layout root, raw values, bare HTML controls, one primary action, data states, no `reka-ui` in app code, accessible names, no modal in a modal). Exits 1 on any failure; `--json` prints the results per file and check (P2-04). `heart-ui` now depends on `@babel/parser` and declares Node `^22.18.0 || >=24.11.0`, the range that parser supports.
