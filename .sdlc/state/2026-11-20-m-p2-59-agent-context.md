# 2026-11-20-m-p2-59-agent-context
Status: done
Process: 3
Change: docs/sdlc/changes/2026-11-20-m-p2-59-agent-context.md   (this feature's record for people)
Track: M   (sized up because: —; footprint: 8 files)
Risk: low
Top model: opus   (fable only if the user chose it)
Commands: test: `pnpm test`
Started: 2026-11-20
Base: 103433b
Owner: 3235400+tammai@users.noreply.github.com
Tool: claude-code
Verified: 103433b tree 79d2909fccbf0e7b0f87695b46a2425a5e52a4e8
Current: Stage 4 – Ship

## Stages
- [x] 1 Define   — the change file, the plan sections below
- [ ] 2 Build
- [x] 3 Review   — the change file's ## Review
- [ ] 4 Ship     — PR: (Learn: knowledge, recurring-defects.md)

## How the build runs
inline

## Handoff
- registry-build writeOut marker accepts registry.json, r/<name>.json, docs/<name>.api.json (scripts/registry-build.ts owned()); output map built at the end of buildRegistry; publish uploads every marker file
- Upstream skills convention (2026-11-20): SKILL.md frontmatter name (1-64 lowercase, matches folder) + description (1-1024); body < 500 lines; npx skills add accepts a direct SKILL.md URL; Claude Code installs to .claude/skills/, most others .agents/skills/

## Tasks
1. **Generator** — AC-001 AC-002 AC-005
   - Files: `scripts/agent-context.ts`, `scripts/skill-template.md`
2. **Build and publish** — AC-003 AC-004
   - Files: `scripts/registry-build.ts`
3. **Tests and docs** — AC-001 AC-002 AC-003 AC-004 AC-005
   - Files: `tests/agent-context.test.ts`, `docs/registry.md`, `docs/agent-support.md`, `tasks/phase-2.md`

## Public Surface
- command `registry:build writes agents/api-index.md and skills/heart-ui/SKILL.md` — AC-001

## Test lock
- `tests/agent-context.test.ts` sha256:a13209677ed7357f6c8b9ed29ac9cf7fa3f2966c5dd599bae8fab50fcaf7b9e0

## Gate log
- 2026-11-20 Stage 1: pass — plan not stopped for approval: low-risk M
- 2026-11-20 Stage 3: pass

## Deviations
- 2026-11-20 internal exports What: scripts/agent-context.ts exports INDEX_BUDGET, AgentItem, AgentContextError, apiIndex, skillMarkdown. Why: the build and its tests call them. Effect: repo scripts only.
- 2026-11-20 test-change tests/agent-context.test.ts What: AC-001 asserts the compact index (alias headings, exports, typed props, 61-item projection) and default exports; AC-002 checks item text in the skill and a blank useWhen; AC-003 adds a bad-snapshot case; AC-005 uses 1,000 items. Why: review rounds 1 and 2 (wrong imports, unparsed literals, 8 KB overflow by tier 2); accepted by the user at two trust-anchor questions.
- 2026-11-20 internal export moduleExports What: scripts/agent-context.ts exports moduleExports. Why: registry-build reads each entry module's named exports with it, and AC-001 tests it directly. Effect: repo scripts only.

## Open questions
-
