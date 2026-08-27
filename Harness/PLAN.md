# PLAN.md — Active Execution Plan

Use this file when work spans more than one step, one file, or one agent.

## Current Goal

Make the print preview maintain a stable first-page aspect ratio across computers, remove unexpected top spacing, and allow manual drag/scale adjustment of the first-page header blocks used for PDF/print export.

## Phase

Current: **Verify**

## Progress Rules

- Phase tracks lifecycle progress.
- Task status tracks execution progress.
- Update before handoff, after verification, and when blocked.

Allowed task statuses: `Pending` / `In Progress` / `Blocked` / `Done` / `Verified`

## Success Criteria

- [ ] Preview uses stable script page geometry independent of host computer viewport/rendered width.
- [ ] Author avatar block, title block, and special-rule block can be dragged and scaled without leaving the first-page script boundary.
- [ ] Top/title and title/role-section spacing can be adjusted through preview-only drag handles.
- [ ] Drag handles and editing UI are hidden from print/PDF output.
- [ ] New layout values persist in localStorage and are available in PDF export settings.
- [ ] Type/build plus browser-visible smoke checks are recorded.

## Scope

Allowed write set:
- `Harness/PLAN.md`
- `Harness/PROGRESS.md`
- `Harness/tasks/print-preview-header-layout/*`
- UI/layout source files directly responsible for preview, print/PDF export settings, header rendering, and persisted UI config

Forbidden:
- `docs/`
- `pnpm-lock.yaml` unless dependency changes are required
- unrelated character data, script parsing, repository browser, or SEO generation changes

## Loaded Context

- `CLAUDE.md`
- `Harness/MEMORY.md`
- `Harness/README.md`
- `Harness/PROGRESS.md`
- `Harness/PLAN.md`
- `Harness/WF.md`
- `Harness/lifecycle.md`
- `Harness/Arch.md`
- `Harness/subagents.md`
- `Harness/dispatch.md`
- `responsible-vibe` skill
- `designing-beautiful-websites` skill

## Tasks

| # | Task | Owner | Verify | Status |
| --- | --- | --- | --- | --- |
| 1 | Locate preview, print/PDF settings, header, and persistence paths | Codex | source inspection | Done |
| 2 | Record second plan and exact write set | Codex | PLAN synthesis | Done |
| 3 | Implement stable preview geometry and header adjustment controls | Codex | diff inspection | Done |
| 4 | Run focused/full verification | Codex | command and browser evidence | Done |

## Decisions

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-07-18 | Treat the user's screenshots as first-page print/PDF preview requirements, not repository preview pages. | The request references preview versus actual print width, PDF export settings, and header blocks. |
| 2026-07-18 | Used three read-only explorer agents before implementation. | The task touches multiple UI/layout/persistence surfaces and Harness WF rules call for parallel exploration. |
| 2026-07-18 | Store header layout in `UIConfigStore`, not script JSON. | User requested browser-local PDF/export settings persistence. |
| 2026-07-18 | Use percent-based header block geometry with print-hidden edit controls. | Percent geometry is stable across computers and easier to clamp inside the preview page. |
| 2026-07-18 | Use fixed A4 landscape screen/print canvas instead of viewport-height preview sizing. | User clarified the first page should not be compressed to fit the view height; it should follow print A4 dimensions and scroll when needed. |
| 2026-07-18 | Restore a taller A4 preview canvas by default (`1358 x 960`) while preserving A4 ratio and print `297mm x 210mm`. | User confirmed A4 ratio was correct but preview height was still too short. |

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| `pnpm exec tsc -b --pretty false` | Passed | TypeScript build check completed after latest layout changes. |
| `pnpm lint` | Passed with warnings | 0 errors, 165 existing warnings. |
| `git diff --check` | Passed | No whitespace errors. |
