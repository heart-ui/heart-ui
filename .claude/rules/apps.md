---
paths:
  - "apps/**/*"
---

# App rules

<!-- Tier 2: loads automatically when the agent touches matching files. Max ~30 lines. Imperative one-liners only; detail lives in docs/ and knowledge/. -->

- Playgrounds import items from `registry/` by alias; never copy item code into an app. Node-side helpers (`apps/demo-*.ts`) may import registry types by relative path, since Node has no alias.
- Gallery routes are `/demo/<name>` with `theme`, `mode`, `dir` and (blocks, layouts) `state` query parameters — why: [phase-0 P0-04](../../tasks/phase-0.md)
- Visual baselines change only with `pnpm test:visual --update` and human approval.
- Docs site pages come from each item's `<name>.md` plus demo — why: [docs site](../../docs/conventions.md#docs-site)
