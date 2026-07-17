# PLAN.md — Active Execution Plan

Use this file when work spans more than one step, one file, or one agent.

## Current Goal

Check whether JSON import fails to recognize official character `spiritofivory` and whether Plague Doctor is incorrectly jinxed with Witch; fix confirmed defects with the smallest source/data change.

## Phase

Current: **Verify**

## Progress Rules

- Phase tracks lifecycle progress.
- Task status tracks execution progress.
- Update before handoff, after verification, and when blocked.

Allowed task statuses: `Pending` / `In Progress` / `Blocked` / `Done` / `Verified`

## Success Criteria

- [x] `spiritofivory` exists in canonical data and is matched from JSON imports.
- [x] Plague Doctor and Witch are not listed as a jinx pair unless source data requires it.
- [x] Focused verification covers both reports.
- [x] TypeScript/lint or equivalent project checks are recorded.

## Scope

Allowed write set:
- `Harness/PLAN.md`
- `Harness/PROGRESS.md`
- `Harness/tasks/botc-role-jinx-regression/*`
- focused source/data/test files directly responsible for character lookup or jinx data

Forbidden:
- `docs/`
- `pnpm-lock.yaml` unless dependency changes are required
- unrelated UI/layout files

## Loaded Context

- `CLAUDE.md`
- `Harness/MEMORY.md`
- `Harness/README.md`
- `Harness/PROGRESS.md`
- `Harness/PLAN.md`
- `Harness/Arch.md`
- `responsible-vibe` skill

## Tasks

| # | Task | Owner | Verify | Status |
| --- | --- | --- | --- | --- |
| 1 | Locate character lookup and jinx data paths | Codex | source inspection | Done |
| 2 | Reproduce reported behavior with focused checks | Codex | command output | Done |
| 3 | Apply focused source/data fix if needed | Codex | diff inspection | Done |
| 4 | Run targeted/full verification | Codex | test/type/lint evidence | Verified |

## Decisions

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-07-17 | Treat the request as investigation plus fix if defects are confirmed. | User asked to check whether the issues exist and how to solve them. |

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| `node` focused static regression check | Failed as expected | `spiritofivoryRecognized=false`; `plague_doctor -> witch` present in `jinxEn`, `jinxZh`, and `jinxEs`; `jinxDe` already clean. |
| `node` focused static regression check | Passed | `spiritofivoryRecognized=true`; no Plague Doctor/Witch jinx in `jinxEn`, `jinxZh`, `jinxEs`, or `jinxDe`. |
| `pnpm exec tsc -b` | Passed | TypeScript project build check completed. |
| `pnpm lint` | Passed with warnings | 0 errors, 168 existing warnings. |
| `git diff --check` | Passed | No whitespace errors. |
