# PLAN.md — Merge dev→main + Build + Deploy + Close PR #4

## Goal

Merge `dev` into `main`, build, deploy to GitHub Pages, close PR #4.

## Non-Goals

- No new features or bug fixes
- No code changes beyond what's already in the working tree

## Confidence: 99%

## Phase: W2_IMPLEMENT

## Subagent Dispatch

| Agent | Role | Status |
|---|---|---|
| planner | Git state audit | ✅ Done — 4 commits ahead, dirty tree, fast-forward possible |
| researcher | PR #4 close verification | ✅ Done — safe to close, no reviews/threads |
| architect | Build/deploy config check | ✅ Done — `pnpm build`→`docs/`, push main→deploy |

## Facts Found

1. **Git**: dev is 4 commits ahead of main, linear fast-forward. Working tree has 19 modified + 7 untracked files.
2. **PR #4**: OPEN, 0 reviews, commit `562e435` already ancestor of dev. Won't auto-close. Must close manually.
3. **Build**: `pnpm build` runs `prebuild → tsc -b → vite build → postbuild`, output to `docs/`.
4. **Deploy**: Push to main, GitHub Pages serves `docs/` at `botc.letshare.fun`.

## Tasks

1. **Commit all changes on dev** — add everything, commit with descriptive message
2. **Checkout main + merge dev** — fast-forward merge
3. **Build** — `pnpm build`
4. **Commit build output + push main** — triggers GitHub Pages deploy
5. **Close PR #4** — `gh pr close 4` with comment
6. **Switch back to dev**

## Write Sets

| Step | Files | Disjoint? |
|---|---|---|
| 1. Commit on dev | All modified + untracked | N/A (git) |
| 2. Merge | .git/HEAD only | N/A |
| 3. Build | docs/ (generated) | Serial after merge |
| 4. Push | Remote main | Serial |

## Verification Path

- [ ] `git log --oneline main..dev` returns empty after merge
- [ ] `pnpm build` succeeds with exit 0
- [ ] `docs/` has updated assets (check new hashes)
- [ ] `gh pr view 4 --json state` shows CLOSED
- [ ] GitHub Actions deploys successfully (check CI if configured)
