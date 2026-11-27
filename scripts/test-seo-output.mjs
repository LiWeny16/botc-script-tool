/** Validate the production search pages against the built script library. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs');
const origin = 'https://botc.letshare.fun';
const read = (file) => fs.readFileSync(path.join(docs, file), 'utf8');
const manifest = JSON.parse(read('scripts/json/manifest.json')).scripts;
const sitemap = read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedLocales = new Map([
  ['zh-CN', `${origin}/zh-cn/`],
  ['en', `${origin}/`],
  ['es', `${origin}/es/`],
  ['x-default', `${origin}/`],
]);

assert.equal(urls.length, manifest.length + 4, 'sitemap includes the directory, locale pages, and every script');
assert.equal(new Set(urls).size, urls.length, 'sitemap URLs are unique');
assert.ok(!urls.some((url) => url.includes('#')), 'sitemap does not contain fragment routes');
assert.ok(!urls.includes(`${origin}/repo`) && !urls.includes(`${origin}/changelog`), 'nonexistent paths are excluded');

const scriptUrls = [];
const seenJsonUrls = new Set();
for (const url of urls) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, origin);
  const relativePath = parsed.pathname.endsWith('/') ? `${parsed.pathname.slice(1)}index.html` : parsed.pathname.slice(1);
  const html = read(relativePath);
  const canonical = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
  assert.equal(canonical.length, 1, `${url} has one canonical`);
  assert.equal(canonical[0][1], url, `${url} is self-canonical`);
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.match(html, /<main>[\s\S]*<h1>/);
  assert.match(html, /googletagmanager\.com\/gtag\/js\?id=/, `${url} measures landing visits`);
  assert.doesNotMatch(html, /<meta\s+http-equiv=["']refresh["']/i, `${url} stays readable`);
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(jsonLd.length > 0, `${url} has structured data`);
  for (const match of jsonLd) JSON.parse(match[1]);

  if (parsed.pathname.startsWith('/scripts/') && parsed.pathname.endsWith('.html')) {
    scriptUrls.push(url);
    const preview = html.match(/href="([^"]+#\/repo\/preview\?json=[^"]+)"/);
    assert.ok(preview, `${url} links to the JSON-backed preview`);
    const hash = new URL(preview[1].replaceAll('&amp;', '&')).hash;
    const jsonUrl = decodeURIComponent(new URLSearchParams(hash.slice(hash.indexOf('?') + 1)).get('json'));
    assert.ok(manifest.some((entry) => entry.jsonUrl === jsonUrl), `${url} points to a script in the manifest`);
    assert.ok(fs.existsSync(path.join(docs, jsonUrl.slice(1))), `${jsonUrl} exists in the build`);
    assert.ok(!seenJsonUrls.has(jsonUrl), `${jsonUrl} has one landing page`);
    seenJsonUrls.add(jsonUrl);
    assert.match(html, /角色列表/, `${url} contains the script's characters`);
  }
}

assert.equal(scriptUrls.length, manifest.length);
const directory = read('scripts/index.html');
for (const url of scriptUrls) assert.ok(directory.includes(url), `directory links to ${url}`);
const llms = read('llms.txt');
for (const url of scriptUrls) assert.ok(llms.includes(url), `llms.txt links to ${url}`);

for (const file of ['index.html', 'zh-cn/index.html', 'es/index.html']) {
  const html = read(file);
  const links = new Map([...html.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((match) => [match[1], match[2]]));
  assert.deepEqual(links, expectedLocales, `${file} links to real language versions`);
}
assert.match(read('zh-cn/index.html'), /href="\/\?lang=cn"/);
assert.match(read('es/index.html'), /href="\/\?lang=es"/);
assert.match(read('robots.txt'), /User-agent: OAI-SearchBot\s+Allow: \/(?:\s|$)/);

const troubleBrewing = manifest.find((entry) => entry.nameEn === 'Trouble Brewing');
assert.ok(troubleBrewing);
const troubleUrl = troubleBrewing.jsonUrl.split('/').map(encodeURIComponent).join('/');
const troublePage = scriptUrls.map((url) => read(new URL(url).pathname.slice(1)))
  .find((html) => html.includes(encodeURIComponent(troubleUrl)));
assert.ok(troublePage && troublePage.includes('洗衣妇') && troublePage.includes('Washerwoman'),
  'official character IDs resolve to readable Chinese and English names');
console.log(`SEO output verified: ${urls.length} canonical URLs, ${scriptUrls.length} script previews and three language pages.`);
