# Registry schemas

`registry:build` validates against these files, never the network.

| File | Source |
| --- | --- |
| `registry-item.json` | <https://ui.shadcn.com/schema/registry-item.json> |
| `registry.json` | <https://ui.shadcn.com/schema/registry.json> |
| `meta.schema.json` | TrevUI's own: the `meta` fields in [registry.md](../../docs/registry.md#item-metadata) |

Fetched: 2026-11-12

To refresh, download both upstream files over the copies, update the date
above, and run `pnpm registry:build`.
