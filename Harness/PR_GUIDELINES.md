# Pull Request Guidelines

## Before Opening a PR

### 0. Read the Project Rules

Before coding, read these files in order:
1. `CLAUDE.md` — behavioral rules (Sections 2-6) + project architecture
2. `Harness/README.md` — doc router, context discipline
3. `Harness/lifecycle.md` — feature lifecycle phases

### 1. Branch Setup
```bash
# ALWAYS create a feature branch from upstream main
git checkout main
git pull upstream main        # or: git fetch origin main && git reset --hard origin/main
git checkout -b feat/my-feature-name
```

**Never branch from your fork's `main`.** This causes the PR to include unrelated commits.

### 2. Code Quality

- [ ] Run `pnpm build` — must compile with zero errors
- [ ] Run `pnpm lint` — must pass with zero warnings
- [ ] Test your changes in `pnpm dev` on at least one real script JSON
- [ ] No TypeScript `any` unless unavoidable (document why)
- [ ] New i18n keys added to ALL languages (cn, en, es — plus your new language if applicable)

### 3. Commit Hygiene

Each commit must follow the format:
```
<emoji> <type>: <description>
```

| Emoji | Type | Use |
|--------|------|-----|
| ✨ | feat | New feature |
| 🔨 | fix | Bug fix |
| 📝 | docs | Documentation |
| ♻️ | refactor | Restructure |
| ⚡ | perf | Performance |
| 🔨 | chore | Config, deps |
| 🎨 | style | UI/styling |

Example: `✨ feat: add German language support for character names`

### 4. Files NOT to Include

**These must NEVER appear in your PR diff:**

| File/Directory | Why |
|---------------|-----|
| `docs/assets/*.js` | Build artifacts — auto-generated, hashed filenames change every build |
| `docs/assets/*.css` | Build artifacts |
| `docs/index.html` | Build artifact |
| `docs/scripts/` | Build artifact (unless you intentionally added new script JSON to `public/scripts/`) |
| `pnpm-lock.yaml` | Only change if you intentionally added/removed a dependency |
| `yarn-error.log` | Local error logs |
| `.env` | Local environment (should be in .gitignore) |

**Before every commit:**
```bash
git status                          # Check what's staged
git diff --stat --cached            # Review the diff summary
git checkout -- docs/               # Discard docs/ changes (maintainer controls builds)
```

### 5. PR Size

Keep PRs small and focused:
- **One feature per PR**
- **One language per PR** (if adding translations)
- **Keep under ~20 files changed** (excluding new data files)
- If your PR is >500 lines of logic changes, split it

### 6. PR Description Template

```markdown
## What

(Brief description of your feature/fix)

## Why

(Why this change is useful for BOTC storytellers)

## How to Test

1. (Step-by-step instructions)
2. (What behavior to verify)

## Screenshots

(If your change affects UI, include before/after screenshots)

## Notes for Reviewer

(Anything the maintainer should know — tricky logic, known limitations, etc.)
```

### 7. Conflict Check

Before opening the PR:
```bash
git fetch origin main
git rebase origin/main
# Fix any conflicts
git push --force-with-lease
```

Your PR must show **"Able to merge"** (green) on GitHub. If it shows **"CONFLICTING"** (gray), you must rebase first.

---

## Common Mistakes & How to Fix Them

### "My PR includes tons of docs/assets/ files"
```bash
# Remove docs/ changes from your branch
git checkout origin/main -- docs/
git commit -m "🔨 chore: remove build artifacts from PR"
git push
```

### "My PR has conflicts"
```bash
git fetch origin main
git rebase origin/main
# Resolve conflicts in your editor
git add .
git rebase --continue
git push --force-with-lease
```

### "I committed to my main branch by accident"
```bash
# Move your work to a feature branch
git checkout -b feat/my-feature
git checkout main
git reset --hard origin/main
git checkout feat/my-feature
git push -u origin feat/my-feature
# Then open PR from feat/my-feature
```

---

## After Opening

- [ ] Verify CI checks pass (no lint errors, no build failures)
- [ ] Respond to review comments within a few days
- [ ] Don't force-push after review starts (use new commits to address feedback)
- [ ] Update `Harness/PLAN.md` if the PR involved multi-step work

## See Also

| Doc | For |
|:---|:---|
| [lifecycle.md](lifecycle.md) | Feature lifecycle phases + gates |
| [PLAN.md](PLAN.md) | Active execution tracking for multi-step changes |
| [AI_CONTRIBUTING.md](AI_CONTRIBUTING.md) | AI prompt templates + coding conventions |
| [extension.md](extension.md) | Adding languages, features, or tooling |

Questions? Open an Issue first: https://github.com/LiWeny16/botc-script-tool/issues
