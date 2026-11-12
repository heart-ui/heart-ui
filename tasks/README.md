# Tasks

Five phase files hold every task in build order. Work top to bottom.

| File | Phase | Ends in |
| --- | --- | --- |
| [phase-0.md](phase-0.md) | Foundations | Pilots approved |
| [phase-1.md](phase-1.md) | Core | Alpha |
| [phase-2.md](phase-2.md) | Layouts and agents | Beta |
| [phase-3.md](phase-3.md) | Complete | Release candidate |
| [phase-4.md](phase-4.md) | Customizer and 1.0 | 1.0 |

## Task format

Each task follows [docs/templates/task.md](../docs/templates/task.md).
Repeated work (one component, one block) is listed in a table and uses a
recipe below instead of a full entry.

Status values: `todo`, `in-progress`, `review`, `done`. An agent moves a
task to `in-progress` and `review`. A human moves it to `done`.

A task is ready when its dependencies are `done`. Within a phase, tasks
with no dependency between them may run in parallel on separate branches.

## Gates

Each phase file ends with a gate task owned by a human. No task in the
next phase starts before the gate is `done`. Tasks marked `Owner: human`
elsewhere need credentials, a publish, or a judgment call.

## Recipe C: one component

Used by every row in a component table. `<name>` is the row's item name.

- Read: [conventions.md](../docs/conventions.md),
  [tokens.md](../docs/tokens.md), the row for `<name>` in
  [components/index.md](../docs/components/index.md), the reference
  components, and the Reka UI docs page for the primitive.
- Steps:
  1. Write `registry/ui/<name>/<name>.md` from
     [component-spec.md](../docs/templates/component-spec.md). Commit it
     first so the spec is reviewable on its own.
  2. Build the item folder per
     [item anatomy](../docs/conventions.md#item-anatomy).
  3. Add the demo to both playgrounds' galleries.
  4. Generate visual baselines; list them in the pull request for approval.
  5. Add a changeset.
- Accept: the [definition of done](../docs/conventions.md#definition-of-done).
- Check: `pnpm check:item <name>`

The pilot specs already exist in `docs/components/`. Tasks P0-10 to P0-12
move them into the item folders.

## Recipe B: one block or layout

Used by every row in a block or layout table.

- Read: [layout-rules.md](../docs/layout-rules.md), the item's row in its
  catalog table, [registry.md](../docs/registry.md#item-metadata), and
  the Markdown pages of every component the item uses.
- Steps:
  1. Write `<name>.md` from
     [block-spec.md](../docs/templates/block-spec.md). Commit it first.
  2. Build the item under `registry/blocks/` or `registry/layouts/` from
     registry components only. Fill `item.json` `meta` from the spec.
  3. Write a demo with realistic fixture data and a control to switch
     between `empty`, `loading`, `error`, and `long`.
  4. Generate visual baselines at 375, 768, and 1280 px for every state,
     preset theme, and mode.
  5. Add a changeset.
- Accept: the definition of done, plus the item obeys every rule in
  [layout-rules.md](../docs/layout-rules.md#rules) and
  `trevui audit` passes on its demo.
- Check: `pnpm check:item <name>`

## Questions

Log gaps and conflicts in `docs/questions.md` as:
`<date> <task id>: <question>. Chose: <option>. Why: <reason>.`
A human answers in place; the answer then moves into the relevant doc.
