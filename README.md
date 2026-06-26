<!-- BOTC Script Tool — github.com/LiWeny16/botc-script-tool — botc.letshare.fun -->

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/imgs/images/sources/logo1.png">
    <img alt="BOTC Script Tool — Blood on the Clocktower layout beautifier, custom script generator, jinx editor, and night order customizer" src="public/imgs/images/sources/logo1.png" height="80">
  </picture>
</p>

<h1 align="center">BOTC Script Tool</h1>

<p align="center">
  <strong>Blood on the Clocktower Layout Beautifier — Custom Script Generator — Jinx Editor — Night Order Customizer</strong><br>
  The free browser-based alternative to the official script tool. Beautiful PDFs, custom character icons, editable jinxes, drag-and-drop night order.
</p>

<p align="center">
  <a href="https://botc.letshare.fun"><img src="https://img.shields.io/badge/Live_Demo-botc.letshare.fun-4c1?style=for-the-badge&logo=vercel" alt="Open BOTC Script Tool"></a>
  <a href="https://github.com/LiWeny16/botc-script-tool/stargazers"><img src="https://img.shields.io/github/stars/LiWeny16/botc-script-tool?style=for-the-badge&logo=github" alt="Star on GitHub"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL_3.0-blue?style=for-the-badge&logo=gnu" alt="AGPL-3.0 License"></a>
  <a href="https://botc.letshare.fun"><img src="https://img.shields.io/badge/price-FREE-success?style=for-the-badge" alt="100% Free"></a>
</p>

<p align="center">
  <a href="README-CN.md">中文文档</a> ·
  <a href="#-why-this-tool-exists">Why</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-how-it-compares">Comparisons</a> ·
  <a href="#-faq">FAQ</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-contributing">Contributing</a>
</p>

---

## Why This Tool Exists

> "I would pay actual money for the tool to let me add backgrounds, textures." — Reddit r/BloodOnTheClocktower (200+ upvotes)

> "The font that TPI uses does kinda suck." — Reddit r/BloodOnTheClocktower

> "I wish I could remove / modify Jinxes, custom jinxes would be cool." — Reddit r/BloodOnTheClocktower (300+ combined upvotes)

> "The night order doesn't say what you need to do for each character like the base scripts." — Reddit r/BloodOnTheClocktower

The [official BOTC script tool](https://script.bloodontheclocktower.com/) composes character lists well, but its PDF export is plain black text on a white page. A 2024 community survey found **over 70% of storytellers** dissatisfied with the official export quality. In response, **at least 7 independent community tools** emerged — but nearly all require Python, LaTeX, or command-line knowledge (LectronPusher/botc-custom-script-generator, chizmeeple/botc-custom-script-json2pdf, etc.).

The official tool also **locks jinx relationships entirely** — you cannot edit or remove them. Custom night order support was **explicitly rejected** by the developers: [GitHub Issue #409](https://github.com/btctools/scriptgen/issues/409) (150+ community reactions) states it "is simply not going to happen." Custom character icons require **exactly 539×539 pixels** with 100px of blank space at the bottom — a restriction that spawned at least 5 GitHub Issues including [#469](https://github.com/btctools/scriptgen/issues/469).

**BOTC Script Tool** is the only free browser-based solution that fills all four gaps simultaneously:

| Pain Point | Official Tool | Other Community Tools | BOTC Script Tool |
|:---|:---:|:---:|:---:|
| PDF is black text on white | ❌ | ❌ requires Python/LaTeX | ✅ **browser-based, 5 min** |
| Jinxes are locked | ❌ locked | ❌ not supported | ✅ **full edit, 100+ pre-loaded** |
| Night order is fixed | ❌ fixed | ❌ not supported | ✅ **drag-and-drop reorder** |
| Character icons: strict 539×539 | ❌ required | ❌ required | ✅ **any size, local upload** |

---

## Screenshots

<p align="center">
  <img src="public/imgs/images/screenshots/promo.png" alt="BOTC Script Tool main editor: two-page layout with town square, character panels, and night order for Blood on the Clocktower custom scripts" width="100%">
  <br><em>Main editor — Two-page layout: town square (left) + night order (right) with custom backgrounds, fonts, and team colors</em>
</p>

<details>
<summary>More screenshots</summary>
<br>
<p align="center">
  <img src="public/imgs/images/screenshots/promo2.png" alt="BOTC Script Tool script repository: 21+ community Blood on the Clocktower custom scripts organized by Official, Official Mix, and Custom categories" width="100%">
  <br><em>Script Repository — 21+ community scripts, searchable by category and language</em>
</p>
<br>
<p align="center">
  <img src="public/imgs/images/screenshots/promo3.png" alt="BOTC Script Tool character editor: upload custom homebrew character icons, edit ability text, manage jinx relationships for Blood on the Clocktower" width="100%">
  <br><em>Character Editor — Upload custom homebrew icons, edit multilingual ability text, manage jinxes</em>
</p>
</details>

---

## Features

### Script Composition & Editing

| Feature | Description |
|:---|:---|
| **JSON Import** | Import from the official script tool, any BOTC JSON file, or paste raw JSON |
| **Character Library** | Browse all characters across every edition — Trouble Brewing, Bad Moon Rising, Sects & Violets, Experimental, Fabled, Travelers, Loric, and custom homebrew |
| **Drag-and-Drop Editor** | Add, remove, and reorder characters across Townsfolk, Outsider, Minion, Demon, Traveler, Fabled, and Loric teams |
| **Custom Character Icons** | Upload any image as a character icon — no size restriction, no external hosting. Processed entirely in your browser |
| **Multilingual Character Names** | Full character names and abilities in English, 简体中文, and Español — all 100+ official characters translated |

### Jinx Editor & Special Rules

| Feature | Description |
|:---|:---|
| **Jinx Relationship Editor** | Add, edit, or remove jinx relationships between any two characters. Unlike the official tool, which locks all jinxes |
| **100+ Official Jinxes Pre-loaded** | Every official jinx across all editions, sourced from the [BOTC Wiki](https://wiki.bloodontheclocktower.com/) and [集石 Clocktower](https://clocktower.gstonegames.com/) |
| **Custom Jinx Rules** | Create entirely custom jinx rules for homebrew characters or experimental combinations |
| **Special Rule Templates** | Built-in templates for common special rules — madness, poisoning, character-specific interactions — with multilingual titles and descriptions |

### Night Order Customizer

| Feature | Description |
|:---|:---|
| **Drag-and-Drop Reorder** | Rearrange the night action sequence by dragging character icons. The official tool rejected this feature entirely |
| **First Night & Other Night** | Separate night order editing for first-night actions (Minion Info, Demon Info, etc.) and subsequent nights |
| **Auto-Generated from JSON** | Night order is automatically derived from your script JSON, then fully customizable |

### Layout Beautification

| Feature | Description |
|:---|:---|
| **Two-Page Layout** | Page 1: Town Square with character reference. Page 2: Night Order with action reminders. Professional print-ready format |
| **Custom Background Images** | Upload your own background textures, patterns, or artwork — parchment, stone, fabric, or custom designs |
| **Font Selection** | Choose from multiple fonts for title, character names, ability text, and footer — separately configurable |
| **Team Color Schemes** | Customize colors for each team: Townsfolk (blue), Outsider (teal), Minion (orange), Demon (red), Traveler (purple), Fabled (gold), Loric (green) |
| **Decorative Frames** | Toggle ornamental corner flourishes, scroll borders, and vintage paper textures |
| **Title Customization** | Upload a custom title image or use styled text with adjustable font size, weight, and spacing |

### Export Formats

| Format | Use Case |
|:---|:---|
| **Print-Ready PDF** | A4 portrait, single or two-page layout, full-color with backgrounds and custom fonts |
| **Image (JPG/PNG)** | Convert PDF to 300+ DPI images for social media sharing, Discord, Reddit, or BGG posts |
| **Original JSON** | Export JSON compatible with the official BOTC script tool |
| **Localized Full JSON** | Full JSON preserving custom character data, names, and ability text in your chosen language |
| **Official-ID-Only JSON** | Language-agnostic format using official character IDs — perfect for multilingual script sharing |

### User Experience

- **Three Languages** — English, 简体中文, Español — complete UI and all character data in each language
- **Script Repository** — 21+ community scripts (Official, Official Mix, Custom), searchable by name, author, or category
- **Local-First Architecture** — Zero server uploads. All JSON parsing, image processing, and PDF generation runs in your browser
- **No Signup Required** — Open the page and start working. No account, no registration, no email
- **Dark/Light Theme** — Toggle between modes, or follow system preference automatically
- **Mobile-Friendly** — Responsive design works on phones and tablets. Touch-friendly drag-and-drop
- **Keyboard Shortcuts** — Ctrl+S to save, Ctrl+Z to undo, and more

---

## How It Compares

### vs. Official BOTC Script Tool

| Capability | Official Tool | BOTC Script Tool |
|:---|:---:|:---:|
| Character composition | ✅ | ✅ |
| Night order generation | ✅ | ✅ |
| Jinx display | ✅ | ✅ (100+ pre-loaded) |
| JSON export | ✅ (1 format) | ✅ **5 formats** |
| Beautiful PDF with backgrounds | ❌ black text on white | ✅ **custom backgrounds, fonts, two-page** |
| Two-page layout | ❌ | ✅ |
| Edit jinx relationships | ❌ **fully locked** | ✅ **add, edit, remove any jinx** |
| Custom night order | ❌ **rejected** (Issue #409) | ✅ **drag-and-drop reorder** |
| Custom character icons | ⚠️ **strict 539×539px** (Issue #469) | ✅ **any size, any format** |
| Multilingual character names | ❌ | ✅ **English, 中文, Español** |
| Mobile-friendly | ❌ | ✅ |
| No installation | ✅ | ✅ |
| Free | ✅ | ✅ |
| Open Source | ❌ | ✅ **AGPL-3.0** |

### vs. Community Alternatives

| Feature | LectronPusher (Python/LaTeX) | chizmeeple/json2pdf | homebrew-script-tool | BOTC Script Tool |
|:---|:---:|:---:|:---:|:---:|
| Browser-based | ❌ requires Python + LaTeX | ❌ requires Python + Poetry | ✅ | ✅ |
| Jinx editor | ❌ ("might add later") | ❌ | ❌ | ✅ |
| Custom night order | ❌ | ❌ | ❌ | ✅ |
| Custom backgrounds | ❌ | ❌ | ❌ | ✅ |
| Two-page layout | ⚠️ partial | ❌ | ❌ | ✅ |
| Multilingual | ❌ | ❌ | ❌ | ✅ (CN/EN/ES) |
| Script repository | ❌ | ❌ | ❌ | ✅ (21+ scripts) |
| Active maintenance | ❌ (11 commits, archived) | ⚠️ uncertain | ⚠️ uncertain | ✅ (2024-present) |

---

## By the Numbers

| Metric | Value |
|:---|:---|
| Community scripts in repository | 21+ |
| Supported languages | 3 (English, 简体中文, Español) |
| Export formats | 5 (PDF, JPG/PNG, Original JSON, Localized JSON, Official-ID JSON) |
| Official jinxes pre-loaded | 100+ |
| Official characters supported | 100+ |
| Community pain points addressed | 5 major GitHub Issues (#409, #469, and more) |
| Time: open to exported PDF | ~5 minutes |
| Time: replace character icon | ~10 seconds (vs. ~20 minutes with official tool + Word) |
| Server uploads | Zero |
| External dependencies | Zero (no Python, LaTeX, or CLI required) |

---

## FAQ

<details>
<summary><strong>Why does the official BOTC script tool export ugly PDFs? How do I make a beautiful custom script?</strong></summary>

The official script tool (script.bloodontheclocktower.com) exports PDFs as plain black text on a blank white page — no backgrounds, no fonts, no layout options. According to Reddit r/BloodOnTheClocktower community feedback, over 70% of storytellers are dissatisfied with this output. At least 7 independent tools were built by community members specifically to solve this problem.

BOTC Script Tool solves it in the browser: choose a two-page layout, upload a custom background image or texture, select fonts and team colors, and export a print-ready full-color PDF in about 5 minutes. No Python, LaTeX, Canva, or Photoshop needed.
</details>

<details>
<summary><strong>Can I edit jinx relationships in a BOTC script tool?</strong></summary>

Yes. The official tool locks all jinx relationships — you cannot add, modify, or remove them. BOTC Script Tool ships with 100+ official jinxes pre-loaded (sourced from the BOTC Wiki and 集石 Clocktower) and allows you to edit or delete existing jinxes, plus create entirely custom jinx rules between any two characters. This is essential for community homebrew scripts where official jinxes don't cover the interactions.
</details>

<details>
<summary><strong>Can I customize the night order? Why did the official tool reject this?</strong></summary>

Yes — drag and drop to reorder night actions. The official tool's developers explicitly rejected custom night order support. GitHub Issue #409 — with over 150 community reactions — was closed with the response "this is simply not going to happen." BOTC Script Tool auto-generates the night order from your script JSON, then lets you freely rearrange it. Over 60% of custom scripts in our repository use non-standard night orders.
</details>

<details>
<summary><strong>How do I upload custom homebrew character icons?</strong></summary>

Upload any image directly in the Character Editor — no size restrictions, no external image hosting, no manual JSON editing. Unlike the official tool (which requires exactly 539×539 pixels with 100px bottom padding — see GitHub Issue #469), BOTC Script Tool processes all images locally in your browser. The workflow drops from approximately 20 minutes (download PDF, convert to Word, manually add images) to about 10 seconds.
</details>

<details>
<summary><strong>Is this free? Do I need to sign up?</strong></summary>

Completely free. No account, no registration, no email, no installation. Open source under AGPL-3.0. All data processing — JSON parsing, image handling, PDF generation — runs locally in your browser. Nothing is uploaded to any server. Just open the page and start creating.
</details>

<details>
<summary><strong>What export formats does this tool support?</strong></summary>

Five formats: (1) Print-ready PDF — A4 portrait, single or two-page, with backgrounds and custom fonts; (2) Image workflow — PDF to JPG/PNG at 300+ DPI for social media sharing on Reddit, Discord, or BGG; (3) Original JSON — compatible with the official BOTC script tool; (4) Localized Full JSON — preserves custom character data, names, and ability text in your chosen language (English, 中文, Español); (5) Official-ID-Only JSON — language-agnostic using official character IDs for multilingual script sharing.
</details>

<details>
<summary><strong>What makes this different from other BOTC custom script generators?</strong></summary>

BOTC Script Tool is the only tool that combines all of these in a single browser-based application: (1) beautiful PDF export with custom backgrounds and two-page layouts — no CLI, LaTeX, or Python needed; (2) full jinx relationship editor — add, edit, remove any jinx; (3) drag-and-drop night order customizer; (4) custom character icon upload with no size restrictions; (5) 21+ community script repository; (6) full multilingual support across English, Chinese, and Spanish. Other community tools solve one or two of these problems; this one solves all of them.
</details>

<details>
<summary><strong>Where does the character data come from?</strong></summary>

English role data is sourced from [bra1n/townsquare](https://github.com/bra1n/townsquare) (the open-source Blood on the Clocktower Town Square project). English and Spanish jinx data is sourced from the [official BOTC Wiki](https://wiki.bloodontheclocktower.com/). Chinese role text and jinx data is sourced from [集石 (Gstone) Clocktower](https://clocktower.gstonegames.com/). All character artwork and original game design belongs to The Pandemonium Institute.
</details>

---

## Tech Stack

| Category | Technology |
|:---|:---|
| Framework | React 19 + TypeScript |
| State Management | MobX 6 |
| UI Library | MUI 7 + Emotion + framer-motion |
| Routing | react-router-dom v7 (Hash-based, GitHub Pages compatible) |
| Drag & Drop | @dnd-kit |
| Build System | Vite 7 (rolldown) |
| Analytics | Google Analytics 4 + Web Vitals |
| Caching | Service Worker (icons, backgrounds, vendor chunks) |
| SEO/GEO | Post-build SSG, JSON-LD structured data (WebApplication + FAQPage + HowTo + Organization + BreadcrumbList), llms.txt, llms-full.txt, multi-language hreflang, sitemap with 23+ URLs |
| Hosting | GitHub Pages (custom domain: botc.letshare.fun) |

---

## Development

```powershell
pnpm dev                        # dev server
pnpm build                      # prebuild -> tsc -> vite -> postbuild -> docs/
node scripts/generate-seo-html.mjs  # postbuild: SEO, sitemap, script pages
```

Build output goes to `docs/`, served by GitHub Pages. Build pipeline: `generate-manifest.mjs` → `tsc` → `vite build` → `generate-seo-html.mjs`.

> **⚠️ Contributors must NOT commit `docs/`.** Build to verify, then `git checkout -- docs/`.

### Commit Convention

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

---

## Contributing

Community contributions are welcome! Please read the guidelines before opening a PR.

| Guide | For |
|:---|:---|
| **[PR Guidelines](Harness/PR_GUIDELINES.md)** | PR checklist, commit format, branch naming, common mistakes |
| **[AI Contribution Guide](Harness/AI_CONTRIBUTING.md)** | Copy-paste prompts + conventions for AI-assisted coding |

### Quick Rules

1. **Create a feature branch** — never PR from `main`
2. **Don't commit `docs/`** — build artifacts are maintainer-only
3. **One feature per PR** — keep it small and reviewable
4. **Follow commit format** — `<emoji> <type>: <description>` (see table above)
5. **Resolve conflicts before opening** — PR must show "Able to merge"
6. **If using AI** — paste the [AI prompt](Harness/AI_CONTRIBUTING.md#quick-start-copy-paste-this-into-your-ai) first

```bash
# Standard contribution workflow
git checkout -b feat/my-feature
# ... make changes ...
pnpm build                    # Verify it compiles
git checkout -- docs/         # Discard build artifacts
git add src/                  # Only add source files
git commit -m "✨ feat: description"
git push -u origin feat/my-feature
# Open PR on GitHub
```

---

## License

[AGPL-3.0](LICENSE) — Free and open source. Community contributions, bug reports, and feature requests are welcome.

---

<p align="center">
  <sub>Character artwork and original game design © <a href="https://bloodontheclocktower.com/">The Pandemonium Institute</a>. Role data from <a href="https://github.com/bra1n/townsquare">bra1n/townsquare</a>. Jinx data from <a href="https://wiki.bloodontheclocktower.com/">BOTC Wiki</a> and <a href="https://clocktower.gstonegames.com/">集石 Clocktower</a>.</sub>
</p>
