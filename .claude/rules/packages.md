---
paths:
  - "packages/**/*"
  - "scripts/**/*"
  - "benchmark/**/*"
---

# Package rules

<!-- Tier 2: loads automatically when the agent touches matching files. Max ~30 lines. Imperative one-liners only; detail lives in docs/ and knowledge/. -->

- Write logic here test-first (constitution IV).
- Build Node packages with `tsdown`; pin dependency versions exactly — why: [toolchain](../../docs/conventions.md#toolchain)
- A change to a published package needs a changeset.
- CLI and registry build follow [registry.md](../../docs/registry.md); theme follows [tokens.md](../../docs/tokens.md).
- MCP server and benchmark follow [agent-support.md](../../docs/agent-support.md).
