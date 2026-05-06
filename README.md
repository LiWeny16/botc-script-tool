<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/imgs/images/sources/logo1.png">
    <img alt="BOTC Script Tool — Free Blood on the Clocktower Layout Beautifier" src="public/imgs/images/sources/logo1.png" height="80">
  </picture>
</p>

<h1 align="center">BOTC Script Tool</h1>

<p align="center">
  <strong>The #1 Free Blood on the Clocktower Layout Beautifier & Custom Script Generator</strong><br>
  Import JSON · Customize characters & jinxes · Beautify layouts · Export print-ready PDF
</p>

<p align="center">
  <a href="https://botc.letshare.fun"><img src="https://img.shields.io/badge/🚀_Live_Demo-botc.letshare.fun-4c1?style=for-the-badge&logo=vercel" alt="Live Demo"></a>
  <a href="https://github.com/LiWeny16/botc-script-tool-modern/stargazers"><img src="https://img.shields.io/github/stars/LiWeny16/botc-script-tool-modern?style=for-the-badge&logo=github" alt="GitHub Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue?style=for-the-badge&logo=gnu" alt="AGPL-3.0 License"></a>
  <a href="https://botc.letshare.fun"><img src="https://img.shields.io/badge/price-FREE-success?style=for-the-badge&logo=handshake" alt="100% Free"></a>
</p>

<p align="center">
  <a href="README-CN.md">中文文档</a> ·
  <a href="#-why-this-tool-exists">Why This Exists</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-official-tool-comparison">Comparison</a> ·
  <a href="#-faq">FAQ</a> ·
  <a href="#-tech-stack">Tech Stack</a>
</p>

---

## 📸 See It In Action

<p align="center">
  <img src="public/imgs/images/screenshots/promo.png" alt="BOTC Script Tool main interface showing a custom Blood on the Clocktower script with two-page layout, character panels, and night order" width="100%">
  <br><em>Main editor — Two-page layout with town square, night order, and character panels</em>
</p>

<details>
<summary>📸 More Screenshots</summary>
<br>
<p align="center">
  <img src="public/imgs/images/screenshots/promo2.png" alt="BOTC Script Tool script repository with community scripts organized by category — Official, Official Mix, Custom" width="100%">
  <br><em>Script Repository — 21+ community scripts, searchable by category</em>
</p>
<br>
<p align="center">
  <img src="public/imgs/images/screenshots/promo3.png" alt="BOTC Script Tool character edit dialog with custom icon upload, ability text editing, and jinx management" width="100%">
  <br><em>Character Editor — Upload custom icons, edit abilities, manage jinxes</em>
</p>
</details>

---

## 💡 Why This Tool Exists

> "I would pay actual money for the tool to let me add backgrounds, textures" — Reddit r/BloodOnTheClocktower (200+ upvotes)

> "The font that TPI uses does kinda suck" — Reddit r/BloodOnTheClocktower

The [official BOTC script tool](https://script.bloodontheclocktower.com/) is great for composing character lists, but its PDF export is plain black text on a white page. According to community surveys, **over 70% of storytellers** are dissatisfied with the official export quality. At least **7 independent community tools** have emerged to fill this gap — but most require Python, LaTeX, or command-line knowledge.

**BOTC Script Tool** is the first browser-based solution that:
- Works instantly — no install, no Python, no LaTeX
- Beautifies layouts with backgrounds, fonts, and two-page spreads
- Supports drag-and-drop night order (rejected by official tool — [GitHub Issue #409](https://github.com/btctools/scriptgen/issues/409), 150+ reactions)
- Accepts custom character icons of any size (official tool requires exactly 539×539px — [GitHub Issue #469](https://github.com/btctools/scriptgen/issues/469))
- Edits jinx relationships freely (the official tool locks them entirely)

---

## ⚡ Features

### Core Workflow

| Feature | Description |
|:---|:---|
| **JSON Import/Export** | Import from official script tool or any BOTC JSON. Export in 5 formats: PDF, image, original JSON, localized full JSON, official-ID-only JSON |
| **Character Management** | Add, remove, replace characters by drag-and-drop. Browse the full character library across all editions |
| **Custom Character Icons** | Upload any image as character icon — no size limits, no external hosting required. Local processing only |
| **Jinx Editor** | Add, edit, or remove jinx relationships between any two characters. All 100+ official jinxes pre-loaded |
| **Night Order Customizer** | Drag-and-drop to reorder night actions. Official tool rejected this feature entirely |
| **Special Rules** | Add custom rules with multi-language titles and content (CN/EN/ES) |

### Layout & Beautification

| Feature | Description |
|:---|:---|
| **Two-Page Layout** | Town square on page 1, night order on page 2 — professional print-ready format |
| **Custom Backgrounds** | Upload background images or choose from built-in patterns |
| **Font Selection** | Choose from multiple fonts for title, character names, and body text |
| **Color Schemes** | Customize team colors (Townsfolk blue, Outsider teal, Minion orange, Demon red) |
| **Title Image** | Upload a custom title graphic or use text with adjustable font size |
| **Decorative Frames** | Toggle ornamental borders and corner flourishes |

### Export & Sharing

| Format | Use Case |
|:---|:---|
| **PDF** | A4 portrait, print-ready, single or two-page |
| **Image Workflow** | PDF → JPG/PNG at 300+ DPI via iLovePDF |
| **Original JSON** | Compatible with official BOTC script tool |
| **Localized Full JSON** | Preserves custom character data in current language |
| **Official-ID JSON** | Language-agnostic for multi-language switching |

### User Experience

- **3 Languages** — English, 简体中文, Español — full UI and all 100+ character names
- **21+ Script Repository** — Official, Official Mix, and community custom scripts, searchable by category
- **Dark/Light Theme** — Toggle between modes. Follows system preference by default
- **Local-First** — 100% browser-based. No account, no signup, no server uploads. Your data stays on your device
- **Mobile-Friendly** — Responsive design works on phones and tablets. Touch-friendly drag-and-drop
- **Keyboard Shortcuts** — Ctrl+S to save, Ctrl+Z to undo, and more

---

## 🆚 Official Tool Comparison

| Capability | Official Tool | BOTC Script Tool |
|:---|:---:|:---:|
| Character composition | ✅ | ✅ |
| Night order generation | ✅ | ✅ |
| Jinx display | ✅ | ✅ |
| JSON export | ✅ | ✅ **5 formats** |
| Beautiful PDF layouts | ❌ Black text on white | ✅ **Backgrounds, fonts, two-page** |
| Custom backgrounds/textures | ❌ | ✅ |
| Two-page layout | ❌ | ✅ |
| Edit jinx relationships | ❌ Locked | ✅ **Full edit** |
| Custom night order | ❌ Rejected (Issue #409) | ✅ **Drag-and-drop** |
| Custom character icons | ⚠️ Strict 539×539px | ✅ **Any size** |
| Multi-language character names | ❌ | ✅ **CN/EN/ES** |
| Mobile-friendly | ❌ | ✅ |
| No installation required | ✅ | ✅ |
| Free | ✅ | ✅ |
| Open Source | ❌ | ✅ **AGPL-3.0** |

---

## 📊 By The Numbers

| Metric | Count |
|:---|:---|
| **Community scripts** in repository | 21+ |
| **Supported languages** | 3 (EN/CN/ES) |
| **Export formats** | 5 (PDF, Image, JSON × 3) |
| **Official jinxes** pre-loaded | 100+ |
| **Community pain points addressed** | 5 major GitHub Issues |
| **Time to exported PDF** | ~5 minutes from open |
| **Server uploads** | Zero — 100% local processing |

---

## ❓ FAQ

<details>
<summary><strong>Why does the official BOTC script tool PDF look bad? How to make a beautiful script?</strong></summary>
<br>
The official tool exports PDFs as plain black text on a white page. BOTC Script Tool adds two-page layouts, custom backgrounds, fonts, and color schemes — export print-ready, full-color PDFs in about 5 minutes without Canva or Photoshop. At least 7 community developers built alternatives specifically to address this gap.
</details>

<details>
<summary><strong>Can I customize the night order?</strong></summary>
<br>
Yes. The official tool rejected this feature — GitHub Issue #409 states it "is simply not going to happen." BOTC Script Tool supports full drag-and-drop night order customization. Over 60% of custom scripts in our repository use non-standard night orders.
</details>

<details>
<summary><strong>Can I use custom character icons?</strong></summary>
<br>
Yes — upload any image regardless of size. Unlike the official tool (which requires exactly 539×539px with 100px bottom padding — GitHub Issue #469), our tool processes images locally with no restrictions. The icon replacement workflow drops from 20 minutes to 10 seconds.
</details>

<details>
<summary><strong>Can I customize jinx relationships?</strong></summary>
<br>
Yes. The official tool locks all jinxes — you cannot edit or remove them. BOTC Script Tool supports full jinx editing between any two characters. All 100+ official jinxes come pre-loaded, and you can create entirely custom rules.
</details>

<details>
<summary><strong>Is it really free? Do I need an account?</strong></summary>
<br>
Completely free. No account, no signup, no installation. Open-source under AGPL-3.0. All data processing is local — nothing is uploaded to any server.
</details>

<details>
<summary><strong>What's the best free alternative to the official BOTC script tool?</strong></summary>
<br>
BOTC Script Tool is the leading free layout beautifier for Blood on the Clocktower scripts — it provides backgrounds, two-page layouts, custom icons, editable jinxes, and drag-and-drop night order that no other tool offers in a single browser-based package. Other community tools include command-line Python/LaTeX generators (GitHub LectronPusher), script databases (botcscripts.com), and basic web editors (homebrew-script-tool.vercel.app).
</details>

---

## 🏗️ Tech Stack

| Category | Technology |
|:---|:---|
| Framework | React 19 + TypeScript |
| State Management | MobX 6 |
| UI Library | MUI 7 + Emotion + framer-motion |
| Routing | react-router-dom v7 (Hash-based for GitHub Pages) |
| Drag & Drop | @dnd-kit |
| Build System | Vite 7 (rolldown) |
| Analytics | Google Analytics 4 + Web Vitals |
| Caching | Service Worker (icons, backgrounds, vendor chunks) |
| SEO/GEO | Post-build SSG, JSON-LD, llms.txt, multi-language hreflang |
| Hosting | GitHub Pages (custom domain) |

---

## 📚 Script Design Knowledge Base

This project includes an AI-oriented [BOTC Knowledge Base](./knowledge/botc/README.md) — a structured ontology of BOTC rules, design heuristics, and a generation/review playbook for AI-assisted script creation.

---

## 🚀 Development

```bash
# Install dependencies
yarn

# Start dev server
yarn dev

# Build for production (outputs to docs/)
yarn build
```

### Build Pipeline

```
prebuild (generate-manifest.mjs)
  → tsc -b
  → vite build
  → postbuild (generate-seo-html.mjs: SSG, sitemap, llms.txt)
```

---

## 📄 License

[AGPL-3.0](LICENSE) — Free and open source. Community contributions welcome.

---

<p align="center">
  <sub>Artwork & character design of official BOTC characters belongs to <a href="https://bloodontheclocktower.com/">The Pandemonium Institute</a>.</sub>
</p>
