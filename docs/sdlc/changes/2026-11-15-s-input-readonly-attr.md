# Input read-only fill follows the field's real state

## Why

**Request (verbatim):** "can you handle them?" (the tickets and decisions from P1-02).

Ticket from the P1-02 textarea review (r2 R2-6): `Input.vue` decides the read-only fill with `attrs.readonly !== undefined && attrs.readonly !== false`. **Proof:** `readonly: null` leaves the native input editable (Vue removes the attribute) but sets `data-readonly`, so the field shows the read-only fill; camelCase `readOnly: true` makes it read-only with no fill. The new test in `Input.test.ts` fails on both. **Root cause:** the check doesn't mirror how Vue applies the attribute.

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| Same check as `Textarea.vue`: read-only when `readonly` or `readOnly` is neither `null`/`undefined` nor `false` | a shared composable in `registry/lib` | Two copies today; a shared lib item is worth its extra item and registry dependency at the third form control (checkbox or select), logged as a ticket. |

## Acceptance criteria

- **AC-001** `readonly: false` and `readonly: null` leave the input editable with no fill; `readOnly: true` makes it read-only with the fill.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | registry/ui/input/Input.test.ts › fills only when the field is actually read-only, however readonly is passed | `pnpm test:browser registry/ui/input/ -t "fills only when the field is actually read-only"` |

## Must never break

- `pnpm check` passes; the approved input baselines don't change.

## Out of scope

- Sharing the `readonly` and `aria-invalid` logic across form controls (ticket, above).

## Review

No review ran: no trigger fired.
