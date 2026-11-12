<!--
Sync report
Version: none → 1.0.0 (initial ratification)
Principles added: I. Reka underneath, source the user owns; II. Tokens only; III. Accessible and SSR-safe;
  IV. Proven in a real browser; V. Simplicity (sdlc default); VI. Agents are users; VII. Versioned items and releases
Sections added: Technology constraints; Development workflow; Governance
Follow-ups:
- docs/spec.md (PRD) has no explicit Problem, Users and audience, or Voice and brand sections.
- CLAUDE.md "Working loop" step 5 ("set the task status to review and stop") is compatible with sdlc's
  Ship ending at a pull request; no change needed.
-->
# TrevUI Constitution

## Core Principles

### I. Reka underneath, source the user owns

TrevUI MUST NOT ship its own headless primitives: focus, keyboard handling and ARIA come from Reka UI.
`reka-ui` MUST be imported only inside `registry/ui/`. Every item MUST be plain source that the CLI copies
into the user's project and that still works after the user edits it, with no runtime package needed
except the dependencies its `item.json` names. Components MUST follow the API rules in
`docs/conventions.md`: shared prop names, `size` of `sm | md | lg`, `class` merged last with `cn()`, and
icons only through `registry/lib/icon`.

*Rationale:* the product is copy-and-own on proven primitives. A second primitive layer or a hidden runtime
breaks both.

### II. Tokens only

Code under `registry/` MUST NOT contain raw values: no hex, `rgb()`, `hsl()`, `oklch()` or named colors;
no pixel or rem literals; no Tailwind palette or arbitrary-value classes; no `--tre-raw-*` references;
no `dark:` variant. Control height, padding and radius MUST use token utilities. Layout MUST use logical
properties only. A token's name or value MUST NOT change except in a task that says to change it.

*Rationale:* six knobs can produce a complete theme only if every item reads tokens. `@trevui/eslint-plugin`
enforces this.

### III. Accessible and SSR-safe (NON-NEGOTIABLE)

Every item MUST meet WCAG 2.2 AA. axe MUST report zero violations in every demo state. Every interactive
item MUST be fully usable from the keyboard. Every demo MUST render under Nuxt SSR with no hydration
warning: no `window` or `document` at setup time, and ids from `useId()`.

*Rationale:* this is product goal 6 and the release-candidate exit gate. Fixing it afterwards costs more than
building it in.

### IV. Proven in a real browser

An item is done only when it meets the definition of done in `docs/conventions.md`, and
`pnpm check:item <name>` passes. Component behavior MUST be tested in a real browser (Vitest browser mode
on Playwright), covering every variant, every state and full keyboard use. Logic outside components (the
theme package, the CLI, the registry build, lint rules) MUST be written test-first. Lint rules, tests and
visual baselines MUST NOT be weakened to make a check pass. Visual baselines MUST be approved by a human.

*Rationale:* the people who build this library are coding agents, so the checks are the only proof that an
item works.

### V. Simplicity

Changes MUST be the smallest that meet the acceptance criteria. New abstractions, options, configuration,
public exports and dependencies MUST be justified by a current requirement, not a possible future one. An
abstraction with a single implementation needs a written reason. A dependency that the task or the
conventions don't name MUST NOT be added; propose it in the pull request instead. Components SHOULD
keep to eight props or fewer, splitting into parts beyond that, and MUST NOT offer alias props or a second
way to pass the same content. Comments MUST explain *why*. They MUST NOT restate the code or its change
history. Doc comments are for exported API and are one line unless the contract needs more.

*Rationale:* each item is copied into someone else's repo, so every extra line becomes code that user has to
maintain.

### VI. Agents are users

Every item MUST have a `<name>.md` written from the repo's spec template, with do and don't examples.
Blocks and layouts MUST fill `meta` (`useWhen`, `avoidWhen`, `regions`, `data`, `states`) in `item.json`.
User-facing text MUST enter by prop or slot. The only allowed literals are English defaults of props named
`*Label`. Before using an API of Reka UI, Tailwind CSS v4, Nuxt 4 or the shadcn registry schema, check
that project's current upstream docs instead of relying on memory.

*Rationale:* product goal 4 and the benchmark targets (80% at beta, 90% at 1.0) depend on an agent finding
and using items without guessing.

### VII. Versioned items and releases

Every change to a published package or registry item MUST include a changeset. Each item MUST carry its
own semver in `meta.version`. Dependency versions MUST be pinned exactly. After 1.0 the public API is
frozen: removing or renaming a prop, slot, event, token or item MUST be a major version. An unmodified
item MUST update cleanly with `trevui update`.

*Rationale:* users own copied source, so a silent breaking change in an item would be pulled into their code.

## Technology constraints

Vue 3.5 or later, Nuxt 4 and Node 22 are the minimum versions. The stack is fixed: Tailwind CSS v4
(CSS-first configuration) reading token variables; the shadcn registry format; TypeScript with `strict`
on; pnpm workspaces. Unovis is the default chart engine and Fluent the default icon set. React, Svelte and
Vue 2 are out of scope. Changing any of these needs an amendment to this constitution.

## Development workflow

- The build plan lives in `tasks/`. One task per branch (`task/<task-id>-<slug>`) and per pull request.
  Commits follow Conventional Commits.
- An agent moves a task to `in-progress` or `review`, never to `done`. A human marks it `done` after
  review. Tasks with `Owner: human` and phase gates belong to the human. An agent stops and reports when
  one of them blocks it.
- When docs conflict or leave a gap, log it in `docs/questions.md` and choose the option closest to the
  reference components (`button`, `input`, `dialog`). Don't guess silently.
- `pnpm check` MUST pass in CI before a merge.

## Governance

This constitution overrides other practice when they conflict. `CLAUDE.md` and `docs/conventions.md` give
the day-to-day detail. Specs, designs, plans and reviews are checked against these principles. A MUST
violation blocks the change unless the constitution is amended first. An amendment needs the human
reviewer's approval and a version bump: MAJOR when a principle is removed or redefined, MINOR when one is
added or expanded, PATCH when only wording changes.

**Version**: 1.0.0 | **Ratified**: 2026-11-12 | **Last Amended**: 2026-11-12
