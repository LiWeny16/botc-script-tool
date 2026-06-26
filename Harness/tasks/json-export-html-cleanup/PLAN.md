# json-export-html-cleanup — PLAN

## Goal

When exporting JSON (all 3 export modes), strip all HTML tags from every string field recursively so external parsers get clean plain text.

## Acceptance Criteria

- [ ] All 3 export modes (Original, Current Language, ID Only) produce NO HTML tags in any field
- [ ] `normalizedJson` (used by cloud share + AI agent tools) also has HTML stripped
- [ ] Character abilities, jinx rules, reminder text, special rule content — all clean
- [ ] Display rendering is NOT affected — HTML stripping happens only at export/serialize time
- [ ] Build + typecheck pass

## Scope

### Allowed write set
- `src/utils/richTextEditorUtils.ts` — add `deepStripHtml()` utility
- `src/App.tsx` — call `deepStripHtml` in 3 export handlers + optimize types/existing code
- `src/stores/ScriptStore.ts` — call `deepStripHtml` in `generateNormalizedJson()`

### Forbidden
- Do NOT modify character data files, i18n files, or source JSON
- Do NOT change the MarkdownEditor or WYSIWYG editing pipeline
- Do NOT change any React rendering components
- Do NOT modify import/parse flow (`scriptGenerator.ts`)

## Loaded Context

- CLAUDE.md, Harness/README.md, Harness/MEMORY.md, Harness/Arch.md
- `src/utils/richTextEditorUtils.ts:103` — existing `stripHtmlTags()` (dead code, ready to use)
- `src/App.tsx:841-1031` — 3 export handlers
- `src/stores/ScriptStore.ts:54-217` — `generateNormalizedJson()`

## WF-MAX → /wf Degradation

**Decision**: Degrade to /wf serial lane for implementation.
**Reason**: 3 files, ~25 lines, all depend on single `deepStripHtml` utility. Overhead ratio ≈ 1.67 (5 coordinator steps / 3 file edits) > 0.30 threshold.
**Organization**: CEO → implementer → reviewer → verifier (flat /wf chain).

## Subagent Dispatch

| Agent | Mode | Read Set | Write Set | Status |
|-------|------|----------|-----------|--------|
| planner (a996f7f6c765ae500) | read-only | App.tsx, ScriptStore.ts, scriptGenerator.ts, richTextEditorUtils.ts, cloudScripts.ts, ShareDialog.tsx, agentTools | none | Returned |
| explorer (subagent 2) | read-only | src/data/, src/stores/, src/utils/i18n/, src/components/CharacterEditDialog.tsx, MarkdownRenderer.tsx, MarkdownEditor.tsx, JinxSection.tsx, SpecialRulesSection.tsx, StorytellerNightOrderSheet.tsx | none | Returned |
| architect (a299532419b29c729) | read-only | src/types/index.ts, src/utils/richTextEditorUtils.ts, src/utils/richTextSanitizer.ts, src/utils/richTextConvert.ts | none | Returned |

## Subagent Synthesis

### Agents used
- planner
- explorer (Explore agent)
- architect

### Findings accepted

1. **Three export entry points** in `App.tsx`:
   - `handleExportCurrentLanguageJson` (line ~841) — parses normalizedJson, enriches with current language, re-stringifies
   - `handleExportOriginalJson` (line ~935) — downloads `originalJson` as-is (currently NO processing)
   - `handleExportIdOnlyJson` (line ~956) — parses normalizedJson, reduces to IDs, re-stringifies
   
2. **`generateNormalizedJson()`** in `ScriptStore.ts` (line ~54-217) builds `normalizedJson` from Script object — this is consumed by cloud share, AI agent tools, and 2 of 3 export modes.

3. **Primary HTML carriers**:
   - `ability` field — MarkdownEditor stores serialized HTML; 2 hardcoded Chinese abilities have `<i>` tags
   - Special rule `title`/`content` — same editor pipeline
   - All other fields (reminders, jinx reason, etc.) are plain text currently but have no guard

4. **Existing `stripHtmlTags()`** at `src/utils/richTextEditorUtils.ts:103` — dead code, never imported, does exactly what we need for individual strings.

5. **`highlightAbilityText()`** in `scriptGenerator.ts` — injects `<span>` tags at render time for keyword highlighting. These spans should be stripped in export (plain text keywords are the canonical form).

### Findings rejected
- Architect's suggestion to also skip `image`/`logo` fields — unnecessary. The regex `<\/?[^>\n]+>` will match nothing in valid image URLs. No evidence of angle brackets in any image URLs in the codebase.
- Architect's suggestion for entity decoding — out of scope. HTML entities (`&amp;`, `&lt;`) are plain text and valid in JSON. External parsers handle them fine.

### Conflicts
None. All 3 agents agree on the approach: recursive deep-strip at export time.

### Decisions
- **Approach**: Add `deepStripHtml()` to `richTextEditorUtils.ts`, call it at ALL 4 injection points (3 export handlers + `generateNormalizedJson`).
- **Utility**: Recursive walk over any JSON-serializable value, applying `stripHtmlTags()` to every string leaf.
- **No entity decoding** in this pass — keep it simple.

### Residual risk
- LOW: If a field name coincidentally contains `<>` characters (none found), it would not be corrupted because we strip only string values, not keys.
- LOW: The `handleExportOriginalJson` currently passes through raw user input. After stripping, user-typed HTML tags in ability will be cleaned, which is the desired behavior.

## Implementation Plan

### Step 1: Add `deepStripHtml()` utility
File: `src/utils/richTextEditorUtils.ts`
- Add after line 105 (after existing `stripHtmlTags`)
- Function: recursively walk objects/arrays/primitives, apply `stripHtmlTags` to all string leaves

### Step 2: Strip in `generateNormalizedJson()`
File: `src/stores/ScriptStore.ts`
- Line ~210: before `JSON.stringify(jsonArray, null, 2)`, apply `deepStripHtml`
- This protects `normalizedJson` → consumed by current-language export, ID-only export, cloud share, AI tools

### Step 3: Strip in `handleExportOriginalJson()`
File: `src/App.tsx`
- Lines ~935-953: parse `originalJson`, apply `deepStripHtml`, re-stringify
- This is the only export that bypasses `normalizedJson`

### Step 4: Strip in `handleExportCurrentLanguageJson()`
File: `src/App.tsx`
- Line ~912: before `JSON.stringify(newJsonArray)`, apply `deepStripHtml` (defense-in-depth, already covered by step 2)

### Step 5: Strip in `handleExportIdOnlyJson()`
File: `src/App.tsx`
- Line ~1016: before `JSON.stringify(idOnlyArray)`, apply `deepStripHtml` (defense-in-depth)

### Step 6: Build + verify
- `npx tsc --noEmit` — typecheck
- `npx vite build` — production build
- Manual check: export a script with formatted ability text, verify JSON has no HTML tags

## Verification

| Check | Expected | Notes |
|-------|----------|-------|
| TypeScript | zero errors | |
| Vite build | success | |
| Export current language JSON | no HTML tags in any field | |
| Export original JSON | no HTML tags | previously passed through raw |
| Export ID-only JSON | no HTML tags | |
| Cloud share | uses normalizedJson → clean | |
| Display rendering unchanged | ability still formatted in-app | stripping only at serialize time |
