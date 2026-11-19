# 2026-11-14-m-docs-api-guides
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-14-m-docs-api-guides.md   (this feature's record for people)
Track: M   (sized up because: —; footprint: 12 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-14
Base: af22a3b
Owner: tam.mai@bigin.vn
Tool: claude-code
Verified: af22a3b tree 2814c25354d94997e61365b05832178391b2f333
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [x] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline

## Handoff
- vue-component-meta marks class and style as global; booleans with no default report undefined (Vue's implicit false)
- dialog parts Trigger, Close, Title, Description expose Reka as/asChild (dump of meta), missing from dialog.md

## Tasks
1. **Merged tables and drift check** — AC-001 AC-002 AC-003
   - Files: `apps/docs/scripts/pages.ts`, `tests/docs-pages.test.ts`, `registry/ui/dialog/dialog.md`
2. **Guide pages and source-path links** — AC-004 AC-005
   - Files: `apps/docs/scripts/items.ts`, `apps/docs/scripts/generate.ts`, `apps/docs/.vitepress/links.ts`, `apps/docs/.vitepress/config.ts`, `apps/docs/.gitignore`, `apps/docs/test/links.test.ts`, `tests/docs-build.test.ts`
3. **Answers into the docs** — AC-001
   - Files: `docs/questions.md`, `docs/conventions.md`, `docs/templates/component-spec.md`, `knowledge/gotchas/docs-site.md`

## Public Surface
- export `siteLinks, SitePage, sitePages (apps/docs)` — AC-005
- export `specTables (apps/docs/scripts/pages.ts)` — AC-003

## Gate log
- 2026-11-14 Stage 1: pass — plan not stopped for approval: low-risk M
- 2026-11-14 Stage 2: pass
- 2026-11-14 review: ran code (Public Surface not none), not asked: low risk
- 2026-11-14 Stage 3: fail — code r1: highs C3 C4, bugs to fix
- 2026-11-15 Stage 2: pass
- 2026-11-15 Stage 3: pass

## Deviations
- 2026-11-14 tests/docs-build.test.ts What: P0-13's pilot-pages test now looks for the merged Props table (id props, Prop and Notes headers) instead of the id api section. Why: answer 1 removes the separate API section on purpose. Effect: the same pages and tables are checked, under their new heading.
- 2026-11-14 apps/docs/.vitepress/links.ts What: itemLinks is renamed siteLinks and takes the site's pages; the link tests now expect absolute site URLs. Why: one rule for item and guide pages, resolved by source path (AC-005). Effect: links between items are now /components/<name> instead of ./<name>, the same target.
- 2026-11-14 apps/docs/scripts/items.ts, apps/docs/scripts/pages.ts What: exports SitePage, guides, sitePages (items.ts) and SpecTable, specTables (pages.ts), as planned under combined surface lines. Why: config.ts, generate.ts and the link rule share the page list; specTables is the spec parser the drift check uses. Effect: internal to the private docs app.
- 2026-11-15 registry/ui/dialog/dialog.md, docs/conventions.md, tests/docs-pages.test.ts What: dialog.md's Slots prose becomes a Part/Slot/Content table, and a section with no table now fails when the types have members of that kind. Why: review r1 C4 (high) found the AC-003 exemption let slots added to the types go unreported. Effect: the change file's AC-003 phrase 'a section without a table' no longer holds; the equivalence test uses a Slots table.
- 2026-11-15 apps/docs/scripts/pages.ts What: guidePage added (guides wrapped in v-pre); specTables and SpecTable no longer exported; renderPages reports every item's drift at once. Why: review r1 C13, C20, C14. Effect: none on the published pages beyond the wrapper.
- 2026-11-15 apps/docs/scripts/items.ts What: exports markdownLines (lines with offsets and a fenced-code flag); headingLines now builds on it. Why: review r1 C18, one fence tracker for heading and table detection. Effect: internal to the private docs app.
- 2026-11-15 apps/docs/scripts/items.ts, apps/docs/scripts/pages.ts What: headingLines returns level and title (closing #s, indent, {#id} handled); a fence closes only without an info string; a section may span several tables; tables end as markdown-it ends them and need matching column counts; the spec's column alignment is kept; any boolean-including union defaults to false; payloads split at top-level commas; guides use a container marker longer than any inside; specTables, SpecTable stay private (the Public Surface line for them is out of date). Why: review r2's medium and low bugs, each fixed test first. Effect: none on the pilot pages beyond the Slots table.

## Open questions
-
