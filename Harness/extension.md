# Extension Contract

Purpose: keep new languages, features, and tooling compatible with the project architecture.

## Non-Invasive Extension Rules

Extensions must preserve project ownership boundaries.

- Preserve existing `CLAUDE.md`, `.gitignore`, build configs, and ESLint rules unless the user explicitly requests an overwrite.
- Treat existing project structure as fact. Read `CLAUDE.md` (Project Context) before extending.
- Register added tools, scripts, or workflows in `Harness/README.md` and `MEMORY.md`.
- Core harness docs are `Harness/README.md`, `Harness/PLAN.md`, `Harness/context-loading.md`, `Harness/dispatch.md`, and this file. Extensions must not replace these.

## Adding a Language

Template for adding a new UI language (e.g., German `de`):

1. **Type system** — add `'de'` to `Language` type in `src/utils/languages.ts`
2. **i18n keys** — add `de` blocks to ALL i18n files:
   - `src/utils/map.ts` — main translation map
   - `src/utils/i18n/ui.ts` — UI strings
   - `src/utils/i18n/input.ts` — input/label strings
   - `src/utils/i18n/character.ts` — character ability text
3. **Registry** — add `de` entries to `src/utils/i18n/index.ts`
4. **UI** — update `LanguageSwitcher.tsx` with the new language option
5. **Character data** — add language-specific data files:
   - `src/data/sources/roles_de.json` — character names + abilities
   - `src/data/sources/jinxDe.json` — jinx descriptions
6. **Canonical registry** — update `canonicalCharacters.ts` and `characterBuilder.ts`
7. **Verification** — `pnpm build && pnpm lint` must pass

**Constraints:**
- Never overwrite existing translations in other languages.
- Fallback chain: new language → en → zh-CN (follow the existing `es → en → zh-CN` pattern).
- Character IDs remain language-agnostic. Translations map to IDs, not the other way.

## Adding a Feature

1. Read `CLAUDE.md` (Common Modification Paths) to identify affected files
2. Create `Harness/PLAN.md` entries for the feature
3. Follow `Harness/lifecycle.md` phases
4. After implementation, update `CLAUDE.md` if new files or patterns were added

**Constraints:**
- New components follow existing patterns: MobX `observer()` for state, `useTranslation()` for i18n, MUI for UI.
- New state goes in the appropriate MobX store (`ScriptStore`, `ConfigStore`, or `UIConfigStore`).
- New types go in `src/types/index.ts`.
- Drag-and-drop uses `@dnd-kit` (already a dependency).

## Adding a Build Script or Tool

1. Scripts go in `scripts/` (Node.js `.mjs` or shell)
2. Document the script in `CLAUDE.md` (Key Files table)
3. If it's a new build phase, update the build pipeline description

## Registration

After extending:
- List new files in `CLAUDE.md` (Key Files) if they're permanent project files
- Update `Harness/PLAN.md` when the extension affects current work
- Verify: `pnpm build && pnpm lint` passes
