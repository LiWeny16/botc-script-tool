/**
 * Post-build script: generates language-specific HTML entry points,
 * sitemap.xml, robots.txt, and a language-detection redirector at the root.
 *
 * Run after `vite build` (via postbuild hook in package.json or vite plugin).
 */

const fs = require('fs');
const path = require('path');
const { SITE_URL, DEFAULT_LANGUAGE, LANGUAGES, META, STRUCTURED_DATA, PAGES, OG_IMAGE } = require('./seo-config.cjs');

const DOCS_DIR = path.resolve(__dirname, '..', 'docs');
const BUILT_HTML = path.join(DOCS_DIR, 'index.html');

// GA Measurement ID — set via VITE_GA_MEASUREMENT_ID env var to override
const GA_ID = process.env.VITE_GA_MEASUREMENT_ID || 'G-VB8HT63ZX6';

function readBuiltHtml() {
  return fs.readFileSync(BUILT_HTML, 'utf-8');
}

function stripDynamicTags(html) {
  // Remove existing hreflang, canonical, JSON-LD, and GA scripts that will be regenerated
  html = html.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\n?/g, '');
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>\n?/g, '');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '');
  // Remove GA gtag scripts (both the async script tag and inline config)
  html = html.replace(/<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[^"]*"><\/script>\n?/g, '');
  html = html.replace(/<script>\s*window\.dataLayer[\s\S]*?gtag\('config',[^)]*\);\s*<\/script>\n?/g, '');
  // Remove og:locale:alternate tags (regenerated per-language)
  html = html.replace(/<meta property="og:locale:alternate" content="[^"]*" \/>\n?/g, '');
  return html;
}

function buildHreflangLinks() {
  let links = '';
  for (const lang of LANGUAGES) {
    links += `  <link rel="alternate" hreflang="${lang}" href="${SITE_URL}/${lang}/" />\n`;
  }
  links += `  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/${DEFAULT_LANGUAGE}/" />\n`;
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

function generateLanguageHtml(lang, sourceHtml) {
  const m = META[lang];
  let html = sourceHtml;

  // Strip tags that will be regenerated per-language
  html = stripDynamicTags(html);

  // Update html lang attribute
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);

  // Update title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${m.title}</title>`);

  // Update meta description
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${m.description}"`
  );

  // Update meta keywords
  html = html.replace(
    /<meta name="keywords" content="[^"]*"/,
    `<meta name="keywords" content="${m.keywords}"`
  );

  // Update og:title
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${m.title}"`
  );

  // Update og:description
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${m.description}"`
  );

  // Update twitter:title
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${m.title}"`
  );

  // Update twitter:description
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${m.description}"`
  );

  // Update og:url
  html = html.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${SITE_URL}/${lang}/"`
  );

  // Update og:locale
  html = html.replace(
    /<meta property="og:locale" content="[^"]*"[^>]*>/,
    `<meta property="og:locale" content="${m.ogLocale}" />`
  );

  // Update og:locale:alternate (remove existing, add new after og:locale)
  html = html.replace(/<meta property="og:locale:alternate" content="[^"]*"[^>]*>\n?/g, '');
  const alternateTags = m.ogAlternate.map(l => `  <meta property="og:locale:alternate" content="${l}" />`).join('\n');
  html = html.replace(
    /<meta property="og:locale" content="[^"]*"[^>]*>/,
    `<meta property="og:locale" content="${m.ogLocale}" />\n${alternateTags}`
  );

  // Update og:image
  html = html.replace(
    /<meta property="og:image" content="[^"]*"/,
    `<meta property="og:image" content="${OG_IMAGE}"`
  );

  // Update twitter:image
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*"/,
    `<meta name="twitter:image" content="${OG_IMAGE}"`
  );

  // Insert hreflang, canonical, JSON-LD, and GA before </head>
  const hreflangBlock = buildHreflangLinks();
  const canonicalLink = `  <link rel="canonical" href="${SITE_URL}/${lang}/" />`;
  const jsonLd = buildJsonLd(lang);
  const gaScript = buildGaScript();

  html = html.replace(
    '</head>',
    `  <!-- Hreflang -->\n${hreflangBlock}\n  <!-- Canonical -->\n${canonicalLink}\n  <!-- Structured Data -->\n${jsonLd}\n  <!-- Google Analytics -->\n${gaScript}\n</head>`
  );

  return html;
}

function generateRedirectorHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Onion's Clocktower Tool</title>
  <script>
    (function() {
      var supported = ${JSON.stringify(LANGUAGES)};
      var defaultLang = '${DEFAULT_LANGUAGE}';
      var browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
      var matched = defaultLang;
      for (var i = 0; i < supported.length; i++) {
        if (browserLang === supported[i].toLowerCase()) {
          matched = supported[i];
          break;
        }
      }
      if (matched === defaultLang) {
        for (var i = 0; i < supported.length; i++) {
          if (browserLang.startsWith(supported[i].split('-')[0])) {
            matched = supported[i];
            break;
          }
        }
      }
      window.location.replace('/' + matched + '/');
    })();
  </script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>`;
}

function generateSitemapXml() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  for (const page of PAGES) {
    for (const lang of LANGUAGES) {
      const loc = page.path === '/' ? `${SITE_URL}/${lang}/` : `${SITE_URL}/${lang}${page.path}`;
      xml += '  <url>\n';
      xml += `    <loc>${loc}</loc>\n`;
      for (const altLang of LANGUAGES) {
        const altHref = page.path === '/' ? `${SITE_URL}/${altLang}/` : `${SITE_URL}/${altLang}${page.path}`;
        xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altHref}"/>\n`;
      }
      const xDefault = page.path === '/' ? `${SITE_URL}/${DEFAULT_LANGUAGE}/` : `${SITE_URL}/${DEFAULT_LANGUAGE}${page.path}`;
      xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefault}"/>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += '  </url>\n';
    }
  }

  xml += '</urlset>\n';
  return xml;
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml
`;
}

// ---- Main ----

function main() {
  console.log('[generate-seo-html] Reading built HTML...');
  const sourceHtml = readBuiltHtml();

  for (const lang of LANGUAGES) {
    const langDir = path.join(DOCS_DIR, lang);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }

    const langHtml = generateLanguageHtml(lang, sourceHtml);
    const outPath = path.join(langDir, 'index.html');
    fs.writeFileSync(outPath, langHtml, 'utf-8');
    console.log(`[generate-seo-html] Written: ${lang}/index.html`);
  }

  // Rewrite root index.html as language-detection redirector
  const redirectorHtml = generateRedirectorHtml();
  fs.writeFileSync(BUILT_HTML, redirectorHtml, 'utf-8');
  console.log('[generate-seo-html] Written: index.html (redirector)');

  // Generate sitemap.xml
  const sitemapXml = generateSitemapXml();
  fs.writeFileSync(path.join(DOCS_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log('[generate-seo-html] Written: sitemap.xml');

  // Generate robots.txt
  const robotsTxt = generateRobotsTxt();
  fs.writeFileSync(path.join(DOCS_DIR, 'robots.txt'), robotsTxt, 'utf-8');
  console.log('[generate-seo-html] Written: robots.txt');

  console.log('[generate-seo-html] Done!');
}

main();
