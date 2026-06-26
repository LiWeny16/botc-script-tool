# BOTC Script Tool — Architecture Reference

Blood on the Clocktower script editor & layout beautifier. React 19 + Vite 7 + TypeScript SPA → GitHub Pages (`botc.letshare.fun`).

## Build

```powershell
pnpm dev                        # dev server
pnpm build                      # prebuild -> tsc -> vite -> postbuild -> docs/
node scripts/generate-seo-html.mjs  # postbuild: SEO, sitemap, script pages
```
Build output goes to `docs/`, served by GitHub Pages. Committed.

**Contributors must NOT commit `docs/`.** Build to verify, then `git checkout -- docs/`.

## Commit Convention

`<emoji> <type>: <description>` (present tense, no period)

| Emoji | Type | Use |
|--------|------|-----|
| ✨ | feat | New feature |
| 🔨 | fix | Bug fix |
| 📝 | docs | Documentation |
| ♻️ | refactor | Restructure |
| ⚡ | perf | Performance |
| 🔨 | chore | Config, deps |
| 🎨 | style | UI/styling |

## Architecture

**State:** MobX stores (`mobx` + `mobx-react-lite`), all singletons, persisted to localStorage:
- `src/stores/ScriptStore.ts` — core script data (characters, jinx, night order, JSON sync). 1600 lines.
- `src/stores/ConfigStore.ts` — language, ID parse mode. Syncs `?lang=` URL param.
- `src/stores/UIConfigStore.ts` — backgrounds, fonts, card dimensions, two-page mode. Custom fonts in IndexedDB.

**Data flow:** Components use `observer()` to read stores. `App.tsx` orchestrates mutations, passes data + callbacks down. Stores auto-sync every change to localStorage under keys `botc-script-data`, `botc-app-config`, `botc-ui-config`.

**No backend.** Fully client-side SPA. Data sources: JSON files in `public/scripts/`, character icons from `/imgs/icons/` and Gstone CDN. Built-in fonts in `public/font/`.

## Key Files

| File | Role |
|------|------|
| `src/main.tsx` | Entry: GA4, service worker, HashRouter with 5 routes |
| `src/App.tsx` | Root component (~1270 lines), all CRUD orchestration, 20+ dialog states |
| `src/types/index.ts` | All interfaces: `Character`, `Script`, `ScriptMeta`, `JinxInfo`, `SpecialRule`, `Team` |
| `src/utils/scriptGenerator.ts` | **Core engine.** JSON → `Script` object. Character matching, jinx detection, night order. 806 lines. |
| `src/data/canonicalCharacters.ts` | Character dictionaries in cn/en/es from `sources/roles*.json` |
| `src/data/jinx.ts` | Jinx relationship loader, trilingual lookup |
| `src/data/characterBuilder.ts` | CanonicalCharacterBase → Character, with `es → en → zh-CN` fallback |
| `src/utils/map.ts` | All i18n keys under `cn`, `en`, `es` (~1450 lines). ESLint: `no-restricted-exports` on this file. |
| `src/utils/i18n.tsx` | React context: `useTranslation()` → `{ t, language, setLanguage }` |
| `src/utils/languages.ts` | Language type: `'cn' | 'en' | 'es'` |
| `src/utils/analytics.ts` | GA4 custom event tracking |
| `src/utils/event.ts` | Global Ctrl+S handler for save/sync |
| `src/utils/fontStorage.ts` | IndexedDB font persistence with migration from old localStorage format |
| `src/utils/imagePathMap.ts` | Character icon filename → folder mapping |
| `src/utils/alert.ts` | MUI toast wrapper |
| `src/theme/colors.ts` | Color palette, font constants, `teamColorMap` with helpers |
| `src/index.css` | Global styles, `@font-face` for 4 CJK fonts, custom scrollbars |
| `src/print.css` | Print layout: A4, hides UI, forces `print-color-adjust: exact` |
| `src/data/utils/characterIdMapping.ts` | CN/EN ID normalization (`fang_gu` → `fanggu`, `fortune_teller` ↔ `fortuneteller`) |
| `src/data/utils/scriptRepository.ts` | Script repo metadata + JSON loader |
| `src/data/utils/specialRules.ts` | Special rule templates |
| `src/utils/seoConfig.js` | SEO metadata (500+ lines) |
| `scripts/generate-seo-html.mjs` | Postbuild: static HTML pages per script for SEO |
| `scripts/generate-manifest.mjs` | Prebuild: PWA manifest generation |

## Component Map

**Main editor:** `InputPanel` → JSON input + action toolbar. `ScriptRenderer` → `CharacterSection` → `CharacterCard` (team sections with drag-and-drop via `@dnd-kit`). `NightOrder`, `JinxSection`, `SpecialRulesSection`, `StateRulesSection` for other script parts.

**Second page:** `SecondPageTitle`, `SecondPageSortableItem`, `SecondPageAddButton` — drag-and-drop layout for page 2.

**Dialogs** (all managed from `App.tsx`): `CharacterEditDialog`, `CharacterLibraryCard`, `ShareDialog`, `UploadJsonDialog`, `PrintDialog`, `ExportJsonDialog`, `UISettingsDrawer`, `TitleEditDialog`, `SpecialRuleEditDialog`, `CustomJinxDialog`, `AboutDialog`, `FontUploader`.

**Other pages:** `ScriptRepository` (browse scripts), `ScriptPreview` (read-only view), `Changelog`.

## Routing

HashRouter (`#/` prefix, required for GitHub Pages):
- `#/` — main editor (App)
- `#/repo` — script repository
- `#/repo/preview`, `#/repo/:scriptName` — script preview
- `#/changelog` — release notes

Static HTML in `docs/scripts/` for SEO with meta refresh redirect.

## i18n

Keys in `src/utils/map.ts` under `cn`, `en`, `es` blocks. Component usage: `const { t } = useTranslation()`. Language type: `'cn' | 'en' | 'es'`. Spanish is partial override of cn/en base.

## Common Modification Paths

- **Add/edit character fields** → `src/types/index.ts`, then `src/data/characterBuilder.ts`, then `CharacterEditDialog`
- **Change layout/styling** → `CharacterCard`, `ScriptRenderer`, `print.css`, `App.tsx` printStyles
- **Add UI language** → `src/utils/map.ts` + `src/utils/languages.ts`
- **Modify JSON parsing** → `src/utils/scriptGenerator.ts` (core engine)
- **Add second-page component** → `src/types/index.ts` (SecondPageComponentType), `SecondPageAddButton`, `ScriptRenderer`
- **Modify jinx logic** → `src/data/jinx.ts`, `src/data/sources/jinx*.json`
