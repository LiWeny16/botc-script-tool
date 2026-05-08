/**
 * Post-build script: generates language-specific HTML entry points,
 * sitemap.xml, robots.txt, llms.txt, llms-full.txt, per-script SEO landing pages,
 * and a language-detection redirector at the root.
 *
 * Run after `vite build` (via `postbuild` hook in package.json).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  SITE_URL,
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANG_TO_BCP47,
  META,
  STRUCTURED_DATA,
  PAGES,
  OG_IMAGE,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
} from '../src/utils/seoConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(__dirname, '..', 'docs');
const BUILT_HTML = path.join(DOCS_DIR, 'index.html');
const MANIFEST_PATH = path.join(DOCS_DIR, 'scripts', 'json', 'manifest.json');
const SCRIPTS_OUT_DIR = path.join(DOCS_DIR, 'scripts');

// GA Measurement ID — set via VITE_GA_MEASUREMENT_ID env var to override
const GA_ID = process.env.VITE_GA_MEASUREMENT_ID || 'G-VB8HT63ZX6';

const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

// ---- Helpers ----

function readBuiltHtml() {
  return fs.readFileSync(BUILT_HTML, 'utf-8');
}

function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.warn('[generate-seo-html] Manifest not found, skipping script pages');
    return [];
  }
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  const data = JSON.parse(raw);
  return data.scripts || [];
}

function stripDynamicTags(html) {
  html = html.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\n?/g, '');
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>\n?/g, '');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '');
  html = html.replace(
    /<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[^"]*"><\/script>\n?/g,
    '',
  );
  html = html.replace(/<script>\s*window\.dataLayer[\s\S]*?gtag\('config',[^)]*\);\s*<\/script>\n?/g, '');
  html = html.replace(/<meta property="og:locale:alternate" content="[^"]*" \/>\n?/g, '');
  return html;
}

function slugify(text) {
  let slug = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) slug += ch.toLowerCase();
    else if (code >= 48 && code <= 57) slug += ch;
    else slug += '-';
  }
  while (slug.includes('--')) slug = slug.replace(/--+/g, '-');
  slug = slug.replace(/^-+/, '').replace(/-+$/, '');
  return slug || 'script';
}

// Generate a stable, unique slug from an entry: category + short hash of jsonUrl
function entrySlug(entry) {
  const cat = slugify(entry.category || 'custom');
  const hash = crypto.createHash('md5').update(entry.jsonUrl).digest('hex').slice(0, 8);
  // If the name slugifies to something meaningful, include it for readability
  const nameSlug = slugify(entry.name || '');
  if (nameSlug.length > 2) {
    return `${cat}-${nameSlug.slice(0, 20)}-${hash}`;
  }
  // For non-ASCII names, use English name if available
  if (entry.nameEn) {
    const enSlug = slugify(entry.nameEn);
    if (enSlug.length > 2) return `${cat}-${enSlug.slice(0, 20)}-${hash}`;
  }
  return `${cat}-${hash}`;
}

function buildHreflangLinks() {
  let links = '';
  for (const lang of LANGUAGES) {
    links += `  <link rel="alternate" hreflang="${LANG_TO_BCP47[lang] || lang}" href="${SITE_URL}/" />\n`;
  }
  links += `  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />\n`;
  return links;
}

function buildJsonLd(lang) {
  const data = STRUCTURED_DATA[lang];
  return `  <script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>`;
}

function buildGaScript() {
  return `  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}', {
      page_location: window.location.href,
      page_title: document.title,
    });
  </script>`;
}

function writeFile(outPath, content) {
  if (DRY_RUN) {
    console.log(`[generate-seo-html] dry-run would write: ${path.relative(process.cwd(), outPath)}`);
    return;
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content, 'utf-8');
}

// ---- Language-specific HTML generation ----

function generateLanguageHtml(lang, sourceHtml) {
  const m = META[lang];
  let html = sourceHtml;

  html = stripDynamicTags(html);
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${LANG_TO_BCP47[lang] || lang}">`);

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${m.title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${m.description}"`);
  html = html.replace(/<meta name="keywords" content="[^"]*"/, `<meta name="keywords" content="${m.keywords}"`);
  html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${m.title}"`);
  html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${m.description}"`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${m.title}"`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${m.description}"`);
  html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${SITE_URL}/"`);
  html = html.replace(/<meta property="og:locale" content="[^"]*"[^>]*>/, `<meta property="og:locale" content="${m.ogLocale}" />`);

  // og:locale:alternate
  html = html.replace(/<meta property="og:locale:alternate" content="[^"]*"[^>]*>\n?/g, '');
  const alternateTags = m.ogAlternate.map((l) => `  <meta property="og:locale:alternate" content="${l}" />`).join('\n');
  html = html.replace(
    /<meta property="og:locale" content="[^"]*"[^>]*>/,
    `<meta property="og:locale" content="${m.ogLocale}" />\n${alternateTags}`,
  );

  // OG image
  html = html.replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${OG_IMAGE}"`);
  html = html.replace(/<meta property="og:image:width" content="[^"]*"/, `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}"`);
  html = html.replace(/<meta property="og:image:height" content="[^"]*"/, `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}"`);
  if (!html.includes('property="og:image:alt"')) {
    html = html.replace(
      /(<meta property="og:image:height" content="[^"]*" \/>)/,
      `$1\n  <meta property="og:image:alt" content="${m.ogImageAlt}" />`,
    );
  } else {
    html = html.replace(/<meta property="og:image:alt" content="[^"]*"/, `<meta property="og:image:alt" content="${m.ogImageAlt}"`);
  }

  // Twitter image
  html = html.replace(/<meta name="twitter:image" content="[^"]*"/, `<meta name="twitter:image" content="${OG_IMAGE}"`);
  if (!html.includes('name="twitter:image:alt"')) {
    html = html.replace(
      /(<meta name="twitter:image" content="[^"]*" \/>)/,
      `$1\n  <meta name="twitter:image:alt" content="${m.ogImageAlt}" />`,
    );
  } else {
    html = html.replace(/<meta name="twitter:image:alt" content="[^"]*"/, `<meta name="twitter:image:alt" content="${m.ogImageAlt}"`);
  }

  // Insert hreflang, canonical, JSON-LD, GA
  const hreflangBlock = buildHreflangLinks();
  const canonicalLink = `  <link rel="canonical" href="${SITE_URL}/" />`;
  const jsonLd = buildJsonLd(lang);
  const gaScript = buildGaScript();

  html = html.replace(
    '</head>',
    `  <!-- Hreflang -->\n${hreflangBlock}\n  <!-- Canonical -->\n${canonicalLink}\n  <!-- Structured Data -->\n${jsonLd}\n  <!-- Google Analytics -->\n${gaScript}\n</head>`,
  );

  return html;
}

// ---- Per-script SEO landing pages ----

function generateScriptPage(entry) {
  const displayName = entry.name || entry.file;
  const author = entry.author || 'Community';
  const category = entry.category || 'custom';
  const categoryLabel = { official: 'Official', official_mix: 'Official Mix', custom: 'Custom' }[category] || 'Custom';
  // Use manifest-generated id as slug (unique, ASCII-safe, collision-free)
  const slug = entrySlug(entry);

  // The SPA URL that users land on after redirect
  const spaUrl = `${SITE_URL}/#/repo/${encodeURIComponent(displayName)}`;

  // Script-specific metadata
  const title = `${displayName} — ${categoryLabel} BOTC Script | Free Layout Beautifier`;
  const description = `View ${displayName} by ${author} (${categoryLabel} Blood on the Clocktower script). Customize characters, edit jinx relationships, beautify layout, and export to PDF with BOTC Script Tool.`;

  // JSON-LD CreativeWork for this script
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: displayName,
    description: `Blood on the Clocktower ${categoryLabel.toLowerCase()} script: ${displayName} by ${author}.${entry.description ? ' ' + entry.description : ''}`,
    author: { '@type': 'Person', name: author },
    about: { '@type': 'Thing', name: 'Blood on the Clocktower' },
    url: spaUrl,
    isAccessibleForFree: true,
  };

  // Build a lightweight HTML page: SEO metadata + redirect to SPA
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="msvalidate.01" content="411D1135BD0F14F46E1AE89FE6D56B0B" />
  <meta name="baidu-site-verification" content="codeva-rZb7y64wgZ" />
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="BOTC,${displayName},Blood on the Clocktower ${categoryLabel} script,${author},BOTC script tool,layout beautifier">
  <title>${escapeHtml(title)}</title>

  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${SITE_URL}/scripts/${slug}.html">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:image:width" content="${OG_IMAGE_WIDTH}">
  <meta property="og:image:height" content="${OG_IMAGE_HEIGHT}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${OG_IMAGE}">

  <link rel="canonical" href="${spaUrl}">
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <meta http-equiv="refresh" content="0;url=${spaUrl}">
</head>
<body style="font-family:sans-serif;text-align:center;padding:2rem;">
  <p><a href="${spaUrl}">${escapeHtml(displayName)} — BOTC Script Tool</a></p>
  <p style="color:#888;font-size:0.875rem;">${escapeHtml(categoryLabel)} script by ${escapeHtml(author)}</p>
</body>
</html>`;

  return { html, slug, entry };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateAllScriptPages(entries) {
  let count = 0;
  for (const entry of entries) {
    const { html, slug } = generateScriptPage(entry);
    const outPath = path.join(SCRIPTS_OUT_DIR, `${slug}.html`);
    writeFile(outPath, html);
    count++;
  }
  console.log(`[generate-seo-html] Written: ${count} script landing pages → scripts/*.html`);
  return entries;
}

// ---- Sitemap ----

function generateSitemapXml(scriptEntries) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  for (const page of PAGES) {
    const loc = page.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${page.path}`;
    xml += '  <url>\n';
    xml += `    <loc>${loc}</loc>\n`;
    for (const lang of LANGUAGES) {
      xml += `    <xhtml:link rel="alternate" hreflang="${LANG_TO_BCP47[lang] || lang}" href="${loc}"/>\n`;
    }
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += '  </url>\n';
  }

  // Add each script page
  for (const entry of scriptEntries) {
    const slug = entrySlug(entry);
    const loc = `${SITE_URL}/scripts/${slug}.html`;
    xml += '  <url>\n';
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';
  return xml;
}

// ---- robots.txt ----

function generateRobotsTxt() {
  return `User-agent: *
Allow: /

# AI Search Engine Bots
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Googlebot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

// ---- llms.txt ----

function generateLlmsTxt(scriptEntries) {
  const en = META.en;
  const cn = META.cn;

  const enFaqLines = en.faq.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');
  const cnFaqLines = cn.faq.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');
  const enHowTo = en.howToSteps.map((s, i) => `${i + 1}. ${s.name}: ${s.text}`).join('\n');

  // Group scripts by category
  const byCategory = { official: [], official_mix: [], custom: [] };
  for (const entry of scriptEntries) {
    const cat = entry.category || 'custom';
    if (byCategory[cat]) byCategory[cat].push(entry);
  }

  const catLabels = { official: 'Official Scripts', official_mix: 'Official Mix Scripts', custom: 'Community Custom Scripts' };
  let scriptListing = '';
  for (const [cat, entries] of Object.entries(byCategory)) {
    if (entries.length === 0) continue;
    scriptListing += `\n### ${catLabels[cat] || cat}\n\n`;
    for (const e of entries) {
      const slug = entrySlug(e);
      const desc = e.description ? ` — ${e.description}` : '';
      scriptListing += `- [${e.name}](${SITE_URL}/scripts/${slug}.html) by ${e.author}${desc}\n`;
    }
  }

  return `# Free BOTC Script Tool — Blood on the Clocktower Layout Beautifier & Script Generator
# 免费血染钟楼剧本美化器与自定义剧本工具

URL: ${SITE_URL}/
Script Repository: ${SITE_URL}/#/repo
Languages: Chinese (Simplified), English, Spanish

## What this tool does

This is a free, browser-based tool for Blood on the Clocktower (BOTC) players and storytellers to create, customize, and beautify script sheets. It runs entirely in the browser — no signup, no installation, no server uploads.

Key capabilities:
${en.featureList.map((f) => `- ${f}`).join('\n')}
- Built-in script repository with ${scriptEntries.length}+ community-shared scripts

## How to use (${en.howToSteps.length} steps)

${enHowTo}

Total time: approximately 5 minutes from open to exported PDF.

## Script Repository (${scriptEntries.length} scripts)
${scriptListing}

## FAQ (English)

${enFaqLines}

## FAQ（中文）

${cnFaqLines}

## Keywords

${en.keywords}
${cn.keywords}
`;
}

// ---- llms-full.txt ----

function generateLlmsFullTxt(scriptEntries) {
  const en = META.en;
  const cn = META.cn;
  const es = META.es;

  // Group scripts by category
  const byCategory = { official: [], official_mix: [], custom: [] };
  for (const entry of scriptEntries) {
    const cat = entry.category || 'custom';
    if (byCategory[cat]) byCategory[cat].push(entry);
  }

  let scriptDetails = '';
  for (const [cat, entries] of Object.entries(byCategory)) {
    if (entries.length === 0) continue;
    const catLabel = { official: 'Official Scripts', official_mix: 'Official Mix Scripts', custom: 'Community Custom Scripts' }[cat] || cat;
    scriptDetails += `\n## ${catLabel}\n\n`;
    for (const e of entries) {
      const slug = entrySlug(e);
      scriptDetails += `### ${e.name}\n\n`;
      scriptDetails += `- **Author:** ${e.author}\n`;
      scriptDetails += `- **Category:** ${catLabel}\n`;
      if (e.description) scriptDetails += `- **Description:** ${e.description}\n`;
      if (e.nameEn) scriptDetails += `- **English Name:** ${e.nameEn}\n`;
      scriptDetails += `- **URL:** ${SITE_URL}/scripts/${slug}.html\n`;
      scriptDetails += `- **SPA URL:** ${SITE_URL}/#/repo/${encodeURIComponent(e.name)}\n`;
      scriptDetails += '\n';
    }
  }

  // Build comprehensive FAQ with GEO-optimized answers
  const enFaqFull = en.faq.map((q, i) => {
    const cnQ = cn.faq[i];
    return `## FAQ: ${q.question}\n\n### English\n${q.answer}\n\n### 中文\n${cnQ.answer}\n`;
  }).join('\n---\n\n');

  return `# BOTC Script Tool — Complete Knowledge Base
# 血染钟楼剧本工具 — 完整知识库

## Overview

BOTC Script Tool is a free, browser-based Blood on the Clocktower script layout beautifier and custom script generator. It solves key pain points not addressed by the official script tool (script.bloodontheclocktower.com), including custom character icon uploads, customizable night order, custom jinx relationships, and high-quality PDF/image export with background images, fonts, and two-page layout.

- **URL:** ${SITE_URL}/
- **Script Repository:** ${SITE_URL}/#/repo
- **Languages:** Chinese (Simplified), English, Spanish
- **Price:** Free, no registration required
- **Data Processing:** 100% local, no server uploads
- **Total Scripts in Repository:** ${scriptEntries.length}

## Key Features

${en.featureList.map((f) => `- ${f}`).join('\n')}
- Built-in script repository with ${scriptEntries.length} community-shared scripts

## How to Use (Step by Step)

${en.howToSteps.map((s, i) => `${i + 1}. **${s.name}:** ${s.text}`).join('\n\n')}

Total time: approximately 5 minutes from opening the page to exporting a print-ready PDF.

## Export Formats

1. **PDF** — Print-ready, supports single-page and two-page layouts
2. **Image Workflow** — Export as PDF, then convert to JPG/PNG via iLovePDF
3. **Original JSON** — Compatible with the official BOTC script tool
4. **Current Language Full JSON** — Preserves custom character data in your language
5. **Official-ID-Only JSON** — Language-agnostic format for multilingual switching

## Complete Script Repository

This tool hosts ${scriptEntries.length} Blood on the Clocktower scripts across 3 categories.

${scriptDetails}

## Complete FAQ

This FAQ is optimized for AI search visibility. Answers are based on real community pain points sourced from Reddit (r/BloodOnTheClocktower), GitHub Issues (btctools/scriptgen), and direct user feedback.

${enFaqFull}

## Technical Details

- **Frontend:** React 19 + TypeScript
- **Build System:** Vite 7 (rolldown-vite)
- **State Management:** MobX
- **UI Library:** MUI 7
- **Routing:** React Router 7 (Hash-based for GitHub Pages compatibility)
- **Hosting:** GitHub Pages (custom domain: botc.letshare.fun)
- **Analytics:** Google Analytics 4 (G-VB8HT63ZX6) + Web Vitals
- **Caching:** Service Worker for icons, backgrounds, and vendor chunks
- **SEO:** Post-build static HTML generation, JSON-LD structured data, llms.txt, multi-language hreflang

## Keywords

${en.keywords}
${cn.keywords}
${es.keywords}
`;
}

// ---- Main ----

function main() {
  console.log('[generate-seo-html] Reading built HTML...');
  const sourceHtml = readBuiltHtml();

  // 1. Root index.html with default language SEO tags
  const rootHtml = generateLanguageHtml(DEFAULT_LANGUAGE, sourceHtml);
  writeFile(BUILT_HTML, rootHtml);
  console.log('[generate-seo-html] Written: index.html');

  // 2. Read manifest
  const scriptEntries = readManifest();

  // 3. Generate per-script SEO landing pages
  if (scriptEntries.length > 0) {
    generateAllScriptPages(scriptEntries);
  }

  // 4. Sitemap
  const sitemapXml = generateSitemapXml(scriptEntries);
  writeFile(path.join(DOCS_DIR, 'sitemap.xml'), sitemapXml);
  console.log(`[generate-seo-html] Written: sitemap.xml (${2 + scriptEntries.length} URLs)`);

  // 5. Robots.txt
  const robotsTxt = generateRobotsTxt();
  writeFile(path.join(DOCS_DIR, 'robots.txt'), robotsTxt);
  console.log('[generate-seo-html] Written: robots.txt');

  // 6. llms.txt
  const llmsTxt = generateLlmsTxt(scriptEntries);
  writeFile(path.join(DOCS_DIR, 'llms.txt'), llmsTxt);
  console.log('[generate-seo-html] Written: llms.txt');

  // 7. llms-full.txt
  const llmsFullTxt = generateLlmsFullTxt(scriptEntries);
  writeFile(path.join(DOCS_DIR, 'llms-full.txt'), llmsFullTxt);
  console.log('[generate-seo-html] Written: llms-full.txt');

  console.log('[generate-seo-html] Done!');
}

main();
