---
paths:
  - "registry/**/*"
---

# Registry rules

<!-- Tier 2: loads automatically when the agent touches matching files. Max ~30 lines. Imperative one-liners only; detail lives in docs/ and knowledge/. -->

- Follow the item anatomy and API rules — why: [conventions](../../docs/conventions.md#item-anatomy)
- Style only with token utilities; no raw values, no `dark:` — why: [tokens](../../docs/tokens.md#lint-rule)
- Import `reka-ui` only under `registry/ui/`.
- Icons through `registry/lib/icon`, classes through `cn()` from `registry/lib/utils`.
- Copy the structure of `button`, `input`, `dialog` before inventing a pattern.
- Keep `item.json` valid against the shadcn schema; extra fields go under `meta` — why: [registry](../../docs/registry.md#item-metadata)
- Blocks and layouts obey every rule in [layout-rules.md](../../docs/layout-rules.md#rules).
- Check is `pnpm check:item <name>`.

Before building an item, check: [components/index.md](../../docs/components/index.md) and the Reka UI docs page for its primitive.
