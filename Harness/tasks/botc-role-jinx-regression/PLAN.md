# botc-role-jinx-regression — PLAN

Task-level implementation plan and evidence.

## Goal

Check whether JSON import fails to recognize official character `spiritofivory` and whether Plague Doctor is incorrectly jinxed with Witch; fix the smallest confirmed data/parser issue.

## Acceptance Criteria

- [x] Confirm whether `spiritofivory` is present in canonical character lookup and JSON import matching.
- [x] Confirm whether Plague Doctor and Witch are treated as a jinx pair.
- [x] Apply a focused fix if either defect exists.
- [x] Record verification evidence.

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

## Assumptions

- The user wants investigation plus a concrete solution; if a source/data-only fix is clear, apply it and verify.
- This is not `/wf` or `/wf-max`; no mode file is present.

## Subagent Dispatch

| Agent | Mode | Read Set | Write Set | Status |
|-------|------|----------|-----------|--------|

## Subagent Synthesis

Agents used: none
Findings accepted:
Findings rejected:
Conflicts:
Decisions:
Residual risk:

## Verification

| Check | Result | Notes |
|-------|--------|-------|
| `node` focused static regression check | Failed as expected | `spiritofivoryRecognized=false`; `plague_doctor -> witch` present in `jinxEn`, `jinxZh`, and `jinxEs`; `jinxDe` already clean. |
| `node` focused static regression check | Passed | `spiritofivoryRecognized=true`; no Plague Doctor/Witch jinx in `jinxEn`, `jinxZh`, `jinxEs`, or `jinxDe`. |
| `pnpm exec tsc -b` | Passed | TypeScript project build check completed. |
| `pnpm lint` | Passed with warnings | 0 errors, 168 existing warnings. |
| `git diff --check` | Passed | No whitespace errors. |
