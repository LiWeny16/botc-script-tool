# PLAN.md — Active Execution Plan

Use this file when work spans more than one step, one file, or one agent.

## Current Goal

Tune Storyteller night order page readability and fix title decoration bleed.

## Phase

Choose one: Idea / Research / Plan / Build / Verify / Review / Feedback

Current: **Verify**

## Progress Rules

- Phase tracks lifecycle progress.
- Task status tracks execution progress.
- Update before handoff, after verification, and when blocked.

Allowed task statuses: `Pending` / `In Progress` / `Blocked` / `Done` / `Verified`

- **Pending**: not started
- **In Progress**: active work
- **Blocked**: needs user input or external change
- **Done**: task complete, evidence not final
- **Verified**: verification evidence is recorded

## Success Criteria

- [x] `Reminder Tokens` tab exposes editable first-night and other-night reminder text fields.
- [x] New reminder text fields use existing `firstNightReminder` and `otherNightReminder` save path.
- [x] `Night Order` tab stays focused on night order numbers without duplicate reminder text fields.
- [x] TypeScript and lint checks pass.
- [x] Storyteller column titles no longer use background-image text clipping that can bleed into a green line.
- [x] Storyteller column titles, role names, and reminder text use a balanced larger size.
- [x] Storyteller reminder lists move down enough to avoid the top corner decoration.

## Scope

Allowed write set:
- `src/components/StorytellerNightOrderSheet.tsx`
- `src/components/ScriptRenderer.tsx`
- `src/components/JinxSection.tsx`
- `src/components/CharacterCard.tsx`
- `src/components/CharacterEditDialog.tsx`
- `src/stores/UIConfigStore.ts`
- related focused tests if existing test setup supports them

Forbidden:
- `docs/` (build artifacts — not in source control scope for contributors)
- `pnpm-lock.yaml` (unless adding a dependency)

## Loaded Context

Keep this list short. Add only docs/files used for the current phase.

- `CLAUDE.md`
- `Harness/MEMORY.md`
- `Harness/README.md`
- `Harness/Arch.md`
- `src/components/StorytellerNightOrderSheet.tsx`
- `src/components/ScriptRenderer.tsx`
- `src/components/CharacterEditDialog.tsx`

## Tasks

| # | Task | Owner | Verify | Status |
| --- | --- | --- | --- | --- |
| 1 | Locate Storyteller title and reminder list sizing paths | Codex | source inspection | Done |
| 2 | Add RED regression check for title bleed/readability targets | Codex | targeted static regression command | Done |
| 3 | Replace background-image title fill and rebalance text spacing | Codex | targeted static regression command | Done |
| 4 | Verify and record evidence | Codex | `pnpm exec tsc -b` and `pnpm lint` | Verified |

## Parallel Dispatch

Use [dispatch.md](dispatch.md) when more than one agent or bounded pass is useful.

| Task | Agent | Mode | Read Set | Write Set | Depends On | Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <!-- task --> | <!-- agent --> | Parallel Read / Serial Write / Isolated Worktree | `<!-- read set -->` | `<!-- write set or none -->` | <!-- dependency or none --> | <!-- expected output --> | Pending |

## Agent Handoffs

| Agent | Role | Context Pack | Result |
| --- | --- | --- | --- |
| <!-- agent --> | <!-- role --> | <!-- docs/files --> | <!-- outcome summary --> |

## Decisions

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-06-26 | Treat "UIUXPROMAX skill" as unavailable and use local UI/UX design guidance instead. | No skill named UIUXPROMAX is installed in this session. |
| 2026-06-26 | Hide jinx rules only for the Storyteller night order sheet output, not the main editor config globally. | User scoped the request to the Storyteller night order table enabled state. |
| 2026-06-26 | Restore Storyteller night pages to natural `minHeight: 100vh` flow instead of forced `100svh`. | User corrected the earlier `100svh` requirement. |
| 2026-06-26 | Force Storyteller night order entries to one column. | User clarified the content will not overflow and prefers one column. |
| 2026-06-26 | Merge first-night and other-night Storyteller sheets into one page. | User observed both pages overflow at top while leaving large blank space and requested left/right columns. |
| 2026-06-26 | Raise Storyteller corner flowers above the content layer. | User wanted the `Other Nights Reminder` divider line below corner flowers. |
| 2026-06-26 | Put Storyteller Reminder text editing under the `Reminder Tokens` tab. | User expects double-click character editing to expose Reminder text in the Reminder Tokens directory. |
| 2026-06-26 | Use plain colored Storyteller column titles instead of background-image clipped text. | The clipped background could render as a stray green line across the header. |

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| `node` static layering check | Passed | No `100svh`; no Storyteller-page `JinxSection`; no outer clocktower image nodes; corner flowers on raised layer. |
| `node` one-column check | Passed | No `useTwoColumns`, no measurement effect, and `columnCount: 1`. |
| `node` combined Storyteller page check | Passed | `script-preview-4` removed; `script-preview-3` contains both `firstNight` and `otherNight` sheets in a grid. |
| `node` Storyteller corner layer check | Passed | Four Storyteller corner flowers use `backgroundIndex + 4`, above content at `backgroundIndex + 3`. |
| `pnpm exec tsc -b` | Passed | TypeScript project build check completed after final changes. |
| `pnpm lint` | Passed with warnings | 0 errors, existing warning set remains. |
| Local dev server | Running | `http://127.0.0.1:5174/` |
| `pnpm build` | Not run | Avoided because project build writes `docs/`; `tsc` and lint were used for source verification. |
| `node` Reminder Tokens RED check | Failed as expected | Before implementation, activeTab 2 did not expose first/other night reminder text editors. |
| `node` Reminder Tokens GREEN check | Passed | `Reminder Tokens` tab now exposes both reminder text editors and `Night Order` tab no longer duplicates them. |
| `node` Storyteller header/readability RED check | Failed as expected | Previous title style still used background-image text fill and spacing/size targets were not met. |
| `node` Storyteller header/readability GREEN check | Passed | Column titles use plain color, list spacing cap is 20px, and role/reminder text uses balanced larger clamps. |
| `git diff --check` | Passed | Checked Storyteller style files for whitespace errors. |
