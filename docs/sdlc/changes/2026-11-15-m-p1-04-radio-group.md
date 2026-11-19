# P1-04 Radio group

## Why

**Request (verbatim):** "you build all planned tasks by yourself, when done i will do only 1 review round with you." (working mode in docs/questions.md, 2026-11-15).

Task [P1-04](../../../tasks/phase-1.md#tier-1-components), Recipe C: `radio-group`. Catalog row: Reka RadioGroup, part Item, "`size`, `orientation`". The spec is [registry/ui/radio-group/radio-group.md](../../../registry/ui/radio-group/radio-group.md), committed on its own (9f643a4).

## Decisions

| Decision | Ruled out | Why |
|---|---|---|
| `RadioGroupItem` copies `checkbox`: a `label` wrapping Reka `RadioGroupItem` (a `button`, `role="radio"`) and the default slot; `class` on the label, other attributes on the radio; the radio sits in an `h-lh` span to centre on the first line; a disabled item mutes its text | — | The reference row `checkbox` added in P1-03. |
| `size` is set on `RadioGroup` only and reaches items by `provide`/`inject` (a key exported from `RadioGroup.vue`, as `DialogContent.vue` exports `descriptionKey`) | a `size` on each item | The catalog lists `size` on the group; one group, one size. |
| `orientation` (default `vertical`) sets the layout only (a column or a wrapping row); Reka gets no orientation, so all four arrow keys move through the group | passing it to Reka | The ARIA radio group pattern moves with all four arrows whatever the layout; Reka narrows the keys to one axis when given an orientation. |
| Each item renders a native radio input for forms, under its radio; it hands focus to the radio and fires `input`/`change` (reversed in review r1–r2) | Reka's form input (the first plan) | Reka's input submits the field empty when nothing is chosen and points the validation bubble at a far corner; a hidden input that keeps focus lets keys change it behind the model. |

## Acceptance criteria

- **AC-001** Spec, Props, Events and Keyboard: `v-model` follows a click, a click on an item's text, and the arrow keys (wrapping); `Tab` lands on the chosen item.
- **AC-002** Spec, Props: `orientation` lays items out in a column or a row; `size` applies to every item; `class` merges last on each part; item attributes reach the radio.
- **AC-003** Spec, Props and Accessibility: a disabled item or group can't be chosen; a disabled item mutes its text; the chosen radio fills with `primary`; the focus ring shows on keyboard focus.
- **AC-004** Spec, Props: with `name`, the chosen value submits in a form; `required` blocks submit until one is chosen.
- **AC-005** Definition of done 3: axe reports no violations in the demo (every state in the spec's States), light and dark.
- **AC-006** Definition of done 1, 4–6 and the docs page: `pnpm check:item radio-group` passes and the docs site builds a `radio-group` page whose tables match the types.

## Acceptance tests

| AC | Test | Run |
|---|---|---|
| AC-001 | registry/ui/radio-group/RadioGroup.test.ts › RadioGroup › choosing | `pnpm test:browser registry/ui/radio-group/ -t "choosing"` |
| AC-002 | registry/ui/radio-group/RadioGroup.test.ts › RadioGroup › layout and attributes | `pnpm test:browser registry/ui/radio-group/ -t "layout and attributes"` |
| AC-003 | registry/ui/radio-group/RadioGroup.test.ts › RadioGroup › states | `pnpm test:browser registry/ui/radio-group/ -t "states"` |
| AC-004 | registry/ui/radio-group/RadioGroup.test.ts › RadioGroup › forms | `pnpm test:browser registry/ui/radio-group/ -t "forms"` |
| AC-005 | registry/ui/radio-group/RadioGroup.test.ts › RadioGroup › axe | `pnpm test:browser registry/ui/radio-group/ -t "axe"` |
| AC-006 | manual | whole-gate runs, not one test: `pnpm check:item radio-group` and `pnpm --filter docs build`, at Build and Ship |

## Must never break

- `pnpm check` passes; every approved baseline is unchanged.

## Out of scope

- Human approval of the new radio-group baselines (the final review round).

## Review

- **Fired and ran:** code (`## Public Surface` adds `RadioGroup`, `RadioGroupItem`, `radioGroupItemVariants`) and security (`.changeset/**`); low risk, so run without asking.
- **Security r1:** PASS, no findings.
- **Code r1** (built-in `code-review high --max-findings all`): FAIL on bugs, fixed test first: Reka's form input submitted the field empty when nothing was chosen and pointed the validation bubble at a far corner (items now render native radio inputs under their radios); full-width rows were click targets (`items-start`); the spec claimed `orientation` set the arrow keys (layout only now; Reka overrides `aria-orientation`, so it's dropped); `required` without `name` is now documented; a disabled-group test; a docs/questions.md entry.
- **Code r2:** FAIL, high R2-1: form validation focused the hidden native input, and keys then changed it behind `v-model`, so the form could submit a value the UI didn't show (checkbox too). The maintainer chose one more fix round at the review cap. Fixed test first in both components: the hidden input hands focus to the visible control; it lies exactly under it; the inputs fire `input`/`change`; dead reset code removed; `required` reaches Reka only with a `name`; the demo includes a named group in a form.
- **Code r3** (closing check, maintainer-approved): PASS. Its medium bug fixed test first: the events fired on every model change, including values set in code; they now fire only on user action (Reka's `select`, the checkbox's own toggle handler). The focus test now asserts the arrow chose the next item.
- **Tickets:** a shared `registry/lib` helper for the hidden form input (checkbox, radio, switch); label and dot sizes into the cva; Firefox may keep its validation popup after a choice (unverified); render hidden inputs only inside a form.
- **Manual AC-006:** `pnpm check:item radio-group` and `pnpm --filter docs build` passed; `verify.py` ran the full suite.
- **Deviations:** type and context exports; native form inputs instead of Reka's (Decisions row corrected, accepted by the maintainer at the trust-anchor check); checkbox form-input changes in this feature.
- **Lessons filed:** Reka radio arrow keys need a held key in tests (knowledge/gotchas/registry-items.md).
