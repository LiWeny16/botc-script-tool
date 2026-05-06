# BOTC Script Tool

Blood on the Clocktower layout beautifier & custom script generator. React 19 + Vite 7 + TypeScript SPA deployed to GitHub Pages (`botc.letshare.fun`).

## Build & Deploy

```bash
npx vite build          # -> docs/
node scripts/generate-seo-html.mjs  # postbuild: SEO files, sitemap, script pages
```

GitHub Pages serves from `docs/`. Build output is committed.

## Commit Convention

```
<emoji> <type>: <description>
```

| Type | Emoji | Use |
|------|-------|-----|
| feat | ✨ | New feature |
| fix | 🔧 | Bug fix |
| docs | 📝 | Documentation only |
| refactor | ♻️ | Code change that neither fixes nor adds |
| perf | ⚡ | Performance improvement |
| chore | 🔧 | Config, CI, deps, metadata |
| style | 🎨 | UI/styling changes |

- Present tense, concise description
- No period at end

## Routing

HashRouter (required for GitHub Pages). All routes use `#/` prefix. Per-script static HTML landing pages in `docs/scripts/` with meta refresh redirect compensate for SEO.

## i18n

Keys in `src/utils/map.ts` under three language blocks: `cn`, `en`, `es`. Component-level usage via `useTranslation()` hook returning `{ t }`.
