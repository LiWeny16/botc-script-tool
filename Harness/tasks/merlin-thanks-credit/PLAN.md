# merlin-thanks-credit — PLAN

## Goal

Add “Merlin” in English and “梅林” in Chinese to the collapsible More Thanks list on `main`, build, and publish through the existing GitHub Pages workflow.

## Acceptance Criteria

- [ ] The credit appears inside the existing collapsible More Thanks section.
- [ ] The English UI shows “Merlin”; the Chinese UI shows “梅林”. Spanish uses “Merlin”.
- [ ] No reason or contribution details are invented.
- [ ] `pnpm build` succeeds, and the main-branch deployment workflow succeeds.
- [ ] The pre-existing title-area work remains safely stashed and is not included.

## Scope

Allowed write set:
- `src/components/AboutDialog.tsx`
- `src/utils/i18n/about.ts`
- `Harness/tasks/merlin-thanks-credit/PLAN.md`
- `Harness/tasks/merlin-thanks-credit/PROGRESS.md`

Forbidden:
- Any other production source, generated `docs/`, dependency files, or title-area work.
- Inventing a reason or other attribution details for Merlin.

## Loaded Context

- `Harness/Arch.md`
- `Harness/lifecycle.md`
- `.github/workflows/deploy.yml`
- Search results locate the collapsible list in `src/components/AboutDialog.tsx` and localized copy in `src/utils/i18n/about.ts`.

## Subagent Dispatch

### Dispatch Table

| File | Concern | Worker Type | Worker Label | Read-Only? |
|------|---------|-------------|--------------|------------|
| `src/components/AboutDialog.tsx` | Add localized credit row to collapsed More Thanks list | implementer | `impl-about-dialog` | No |
| `src/utils/i18n/about.ts` | Add localized name key: cn `梅林`, en/es `Merlin` | implementer | `impl-about-i18n` | No |

Manager: one implement-manager (minimum for two write files: `ceil(sqrt(2)/3) = 1`). The manager will dispatch both workers together; each has one non-overlapping file claim.

### Self-Audit

- CEO assigned no production source file: **Yes**.
- Every planned source file has exactly one write worker: **Yes**.
- No worker has more than one write file: **Yes**.
- Manager count meets the minimum: **Yes**.
- The existing `AboutDialog.tsx` is large, but the requested row belongs in its existing More Thanks section; no unrelated extraction is in scope.
- Workers will use the shared key `about.thxMerlinName`; translation values are independent of the component change.
- All implementation workers are assigned for one parallel wave: **Yes**.

| Agent | Mode | Read Set | Write Set | Status |
|-------|------|----------|-----------|--------|
| implement-manager | Serial implementation manager | `AboutDialog.tsx`, `i18n/about.ts`, this plan | Delegate one implementer per file; synthesize | Pending |

## Subagent Synthesis

Agents used:
Findings accepted:
Findings rejected:
Conflicts:
Decisions: Add a name-only credit, following the existing localized More Thanks pattern; use “Merlin” for Spanish.
Residual risk:

## Verification

| Check | Result | Notes |
|-------|--------|-------|
| `pnpm build` | Pass | Build and SEO generation completed. Existing Vite chunk-size and ineffective dynamic import warnings only. |
| `git diff --check` | Pass | No whitespace errors. |
| GitHub Actions deploy workflow | Pending | Push to `main` runs CI and publishes `docs/` to GitHub Pages. |
