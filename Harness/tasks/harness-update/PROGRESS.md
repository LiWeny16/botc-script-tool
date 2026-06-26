# Harness Update — PROGRESS.md

## 2026-06-26: v0.6.5 → v0.7.0

### Summary
- **Version:** 0.6.5 → 0.7.0
- **SAFE overwritten:** 30 files (harness runtime updated)
- **SAFE created:** 12 new files
- **SAFE unchanged:** 6 files (already matched remote)
- **MERGE merged:** 3 files (CLAUDE.md, Harness/MEMORY.md, Harness/README.md — v0.7.0 sections woven into user-modified files)
- **PRESERVE skipped:** 14 files (user data, never touched)

### Merge Details
- **CLAUDE.md** — Added: Harness Binding & Startup (§1), CEO Contract (§1a), wf-update/wf-max/wf-auto startup, memory/context-master triggers, closeout triggers (§6), CEO Constraints (§7). Kept: BOTC Project Context, behavioral guidelines (§§2-5).
- **Harness/MEMORY.md** — Added: 6 new agents (memory-master, context-master, explore-manager, architect-manager, implement-manager, review-manager). Replaced old harness-* + readme-optimizer + wf-mode skills with wf-* skills (wf-learn, wf-max, wf-review, wf-update, wf-remove). Added WF-Max mode + .harness-version to Harness section.
- **Harness/README.md** — Added: WF/WK routing priority paragraph, WF mode row, peer review row, harness update row, harness readiness check row. Updated: memory paths (MEMORY.md → Harness/MEMORY.md), doc map entries.

### Verification
- [x] `node Harness/scripts/validate-harness.mjs` → 3 remaining failures, all in PRESERVE file `Harness/architecture.md` (project content quality checks, not harness integrity)
