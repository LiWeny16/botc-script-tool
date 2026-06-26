# AI-Assisted Contribution Guide

If you're using an AI assistant (Claude Code, Cursor, Copilot, ChatGPT, etc.) to help write code for this project, **this page is for you.** Give these instructions to your AI before it starts coding.

---

## Quick Start: Copy-Paste This Into Your AI

Copy the block below **verbatim** and paste it as your first message to a fresh AI session. Replace `<feature description>` with what you want to build.

```
I want to contribute to the BOTC Script Tool (github.com/LiWeny16/botc-script-tool).

First, read these files in order:
1. CLAUDE.md — behavioral rules (Sections 2-6) + project architecture
2. Harness/README.md — doc router, loads the right context per task
3. Harness/AI_CONTRIBUTING.md — this file, coding conventions

My feature: <feature description>

BEHAVIORAL RULES (from CLAUDE.md Sections 2-6):
- 95% confidence threshold — ask if uncertain, never guess silently
- Maximum 3 blocking questions per decision point
- Minimum code — no speculative features, no unnecessary abstractions
- Surgical changes — touch only what you must, match existing style
- Goal-driven — define success criteria, loop until verified

PROJECT RULES:
1. Create a NEW branch from main: `git checkout -b feat/my-feature-name`
2. NEVER include build output (docs/ directory) in your commits. The maintainer builds.
3. Do NOT modify pnpm-lock.yaml unless you intentionally added a dependency.
4. Make small, focused commits. One feature = one branch.
5. Use the project's i18n system: add keys to src/utils/map.ts under cn/en/es blocks.
6. If adding a new language, follow Harness/extension.md (Adding a Language).
7. Run `pnpm build` to verify your code compiles, but DON'T commit the docs/ output.
8. Before committing, check: `git status` — if docs/ shows changes, restore them: `git checkout -- docs/`
9. Write commits in this EXACT format: `<emoji> <type>: <description>` (e.g., "✨ feat: add German language support")
10. Rebase on upstream main before opening a PR: `git fetch origin main && git rebase origin/main`
11. Open the PR from YOUR feature branch to the upstream main branch.
12. For multi-step work, track progress in Harness/PLAN.md.

Emoji reference:
  ✨ feat     — New feature
  🔨 fix      — Bug fix
  📝 docs     — Documentation
  ♻️ refactor — Restructure
  ⚡ perf     — Performance
  🔨 chore    — Config, deps
  🎨 style    — UI/styling
```

---

## Architecture Overview for AI Assistants

### Tech Stack
- **React 19 + TypeScript** (strict mode)
- **MobX 6** for state (`mobx` + `mobx-react-lite`)
- **MUI 7** for UI components
- **Vite 7** for builds
- **HashRouter** (required — GitHub Pages)

### Key Stores (all singletons, persisted to localStorage)
| Store | File | Responsibility |
|-------|------|---------------|
| ScriptStore | `src/stores/ScriptStore.ts` | Core script data, JSON sync |
| ConfigStore | `src/stores/ConfigStore.ts` | Language, ID parse mode |
| UIConfigStore | `src/stores/UIConfigStore.ts` | Backgrounds, fonts, card layout |

### Data Flow
1. Components use `observer()` from `mobx-react-lite` to read stores
2. `App.tsx` orchestrates mutations, passes data + callbacks down
3. Stores auto-sync every change to localStorage

### Build Pipeline
```
generate-manifest.mjs → tsc → vite build → generate-seo-html.mjs
```
Output goes to `docs/`. Committed. **But contributors should NOT commit docs/ changes.**

---

## Common Modification Paths

| Task | Files to Touch |
|------|---------------|
| Add/edit character fields | `src/types/index.ts` → `src/data/characterBuilder.ts` → `CharacterEditDialog` |
| Change layout/styling | `CharacterCard`, `ScriptRenderer`, `print.css`, `App.tsx` |
| **Add UI language** | `src/utils/map.ts` + `src/utils/languages.ts` |
| Modify JSON parsing | `src/utils/scriptGenerator.ts` (core engine) |
| Add second-page component | `src/types/index.ts` → `SecondPageAddButton` → `ScriptRenderer` |
| Modify jinx logic | `src/data/jinx.ts` + `src/data/sources/jinx*.json` |

---

## i18n System

**Language type:** `'cn' | 'en' | 'es'`

**Adding a new language (e.g., German `de`):**
1. Add `'de'` to the `Language` type in `src/utils/languages.ts`
2. Add `de` translation blocks to ALL i18n files:
   - `src/utils/map.ts` — main translation map
   - `src/utils/i18n/ui.ts` — UI string translations
   - `src/utils/i18n/input.ts` — input/label translations
   - `src/utils/i18n/character.ts` — character ability translations
3. Add `de` entries to `src/utils/i18n/index.ts`
4. Update `LanguageSwitcher.tsx` to include the new language option
5. Add language-specific data files if needed (e.g., `src/data/sources/roles_de.json`)
6. Update `canonicalCharacters.ts` and `characterBuilder.ts` to support the new language

**Component usage:**
```tsx
const { t, language, setLanguage } = useTranslation();
return <span>{t('key_name')}</span>;
```

---

## What NOT to Do

| ❌ Don't | ✅ Do Instead |
|----------|-------------|
| Commit `docs/` files | Build to verify, then `git checkout -- docs/` before commit |
| Modify `pnpm-lock.yaml` unnecessarily | Only change it when adding/removing deps |
| Branch from your fork's `main` | Always branch from upstream `main` |
| Mix multiple features in one PR | One feature = one branch = one PR |
| Skip reading CLAUDE.md | Read it first — behavioral rules + project architecture |
| Overwrite translated files with AI-generated translations | Keep existing translations intact; only add new keys |
| Reformat or "improve" unrelated code | Touch only files relevant to your change |
| Bulk-read docs/ or Harness/ | Use Harness/README.md as the router — load only what matches the task |
| Code before scoping | Fill Harness/PLAN.md for multi-step work first |
| Guess silently when uncertain | State assumptions; ask if below 95% confidence |

## Context Discipline

This project follows the **doc router pattern** from [Harness/README.md](README.md):

- `Harness/README.md` is the primary router — it tells you which doc to load for each task type
- Never bulk-read `Harness/`. Load only the doc matching your current task.
- For multi-step work, track progress in `Harness/PLAN.md`
- If you're spawning subagents, use the context packs in [context-loading.md](context-loading.md)
- If you're coordinating multiple agents, follow [dispatch.md](dispatch.md)

---

## Conflict Resolution

If your PR has conflicts:
```
git fetch origin main
git rebase origin/main
# Resolve conflicts in your editor
git add .
git rebase --continue
git push --force-with-lease
```
