/**
 * One-off: download 奥德赛 (author 太一) character icons into public/imgs/icons
 * and compress them with sharp. Skips the 5 characters that already exist in the pack.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SCRIPT = JSON.parse(fs.readFileSync(path.join(ROOT, '奥德赛.json'), 'utf8'));

// these already have local icons in the pack (retagged author 太一)
const SKIP = new Set(['2fffc7b4', 'b87a195b', '267c5aea', 'b15b6c0a', '61e15ee2']);

function cleanSlug(url) {
  const m = url.match(/\/([^/]+)\.png/);
  if (!m) return null;
  // strip content-hash suffix like -NJ446W4I
  return m[1].replace(/-[A-Z0-9]*$/, '');
}

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function compress(buf, outPath) {
  await sharp(buf)
    .png({ compressionLevel: 9, palette: true, quality: 90, colours: 128 })
    .toFile(outPath);
}

async function main() {
  const jobs = [];
  for (const c of SCRIPT) {
    if (!c || c.id === '_meta' || SKIP.has(c.id)) continue;
    const slug = cleanSlug(c.image || '');
    if (!slug) {
      console.warn('no image slug:', c.id, c.name);
      continue;
    }
    const teamDir = path.join(ROOT, 'public', 'imgs', 'icons', c.team);
    fs.mkdirSync(teamDir, { recursive: true });
    jobs.push({ id: c.id, name: c.name, team: c.team, slug, url: c.image, out: path.join(teamDir, `${slug}.png`) });
  }

  console.log(`downloading & compressing ${jobs.length} icons...`);
  let ok = 0, fail = 0;
  for (const j of jobs) {
    try {
      const raw = await download(j.url);
      await compress(raw, j.out);
      ok++;
      console.log(`  ok ${j.team}/${j.slug}.png  (${j.name})`);
    } catch (e) {
      fail++;
      console.error(`  FAIL ${j.slug}: ${e.message}`);
    }
  }
  console.log(`\ndone: ${ok} ok, ${fail} failed`);
}

main();
