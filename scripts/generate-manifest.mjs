/**
 * BOTC Script Tool — Build pipeline: generate manifest.json from JSON script library.
 * github.com/LiWeny16/botc-script-tool | botc.letshare.fun
 *
 * Generate `public/scripts/json/manifest.json` from the JSON script library.
 *
 * This replaces the previous Python generator to keep the whole build toolchain
 * in Node.js/TS/JS.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const JSON_ROOT = path.join(ROOT, 'public', 'scripts', 'json');
const MANIFEST_PATH = path.join(JSON_ROOT, 'manifest.json');

const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

function slugify(text) {
  // Python: ''.join(lower if isalnum else '-' ), collapse '--', trim '-', fallback to md5[0:8]
  let slug = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    if (isUpper || isLower) slug += ch.toLowerCase();
    else if (isDigit) slug += ch;
    else slug += '-';
  }

  while (slug.includes('--')) slug = slug.replace(/--+/g, '-');
  slug = slug.replace(/^-+/, '').replace(/-+$/, '');

  if (!slug) {
    return crypto.createHash('md5').update(text, 'utf8').digest('hex').slice(0, 8);
  }
  return slug;
}

function detectCategory(dirPath) {
  const name = path.basename(dirPath).toLowerCase();
  if (name === 'official') return 'official';
  if (name === 'official_mix') return 'official_mix';
  return 'custom';
}

function readJsonSafely(p) {
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function extractMeta(data) {
  // Python:
  // - dict: data.get('_meta', {}) or {}
  // - list: find first item where item.id == '_meta'
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data._meta || {};
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === 'object' && item.id === '_meta') {
        return item;
      }
    }
  }
  return {};
}

function walkJsonFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkJsonFiles(p));
    } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.json')) {
      out.push(p);
    }
  }
  return out;
}

function collectEntries() {
  const entries = [];
  if (!fs.existsSync(JSON_ROOT)) return entries;

  const subs = fs.readdirSync(JSON_ROOT, { withFileTypes: true });
  subs.sort((a, b) => a.name.localeCompare(b.name));

  for (const sub of subs) {
    if (!sub.isDirectory()) continue;
    const category = detectCategory(path.join(JSON_ROOT, sub.name));
    const subDir = path.join(JSON_ROOT, sub.name);

    const jsonFiles = walkJsonFiles(subDir);
    // Keep stable ordering like Python `sorted(sub.rglob('*.json'))`
    jsonFiles.sort((a, b) => a.localeCompare(b));

    for (const jfPath of jsonFiles) {
      const data = readJsonSafely(jfPath);
      const meta = extractMeta(data);

      const fileName = path.basename(jfPath);
      const stem = fileName.replace(/\.json$/i, '');

      const name = meta.name || stem;
      const name_en =
        meta.name_en ||
        meta.title_en ||
        meta.nameEn ||
        meta.titleEn ||
        '';

      const author =
        meta.author ||
        meta.authors ||
        (category === 'official' ? 'Official' : '未知');
      const description = meta.description || '';
      const logo = meta.logo || meta.icon || '';

      const baseId = `${category}:${name}:${fileName}`;
      const id = slugify(baseId);

      const publicDir = path.join(ROOT, 'public');
      const publicRel = path.relative(publicDir, jfPath).split(path.sep).join('/');
      const jsonUrl = '/' + publicRel;

      const dirRel = path
        .relative(JSON_ROOT, path.dirname(jfPath))
        .split(path.sep)
        .join('/');

      entries.push({
        id,
        name,
        nameEn: name_en,
        author,
        description,
        category,
        logo,
        jsonUrl,
        file: fileName,
        dir: dirRel,
      });
    }
  }

  return entries;
}

function writeManifest(entries) {
  if (DRY_RUN) {
    console.log(`[generate-manifest] dry-run: would write ${MANIFEST_PATH}`);
    return;
  }
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    version: 1,
    scripts: entries,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(payload, null, 2), 'utf8');
}

function main() {
  const entries = collectEntries();
  console.log(`[generate-manifest] Generated ${entries.length} entries`);
  writeManifest(entries);
}

main();

