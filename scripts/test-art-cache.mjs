import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const worker = await readFile(new URL('../public/art-cache-sw.js', import.meta.url), 'utf8');
let version = 'v1', revision = 'first', image = Buffer.from('first-image'), requests = 0;
let iconRequests = 0, proxyRequests = 0;
const icon = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/W8sAAAAASUVORK5CYII=', 'base64');
const handle = (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  if (url.pathname === '/art-cache-sw.js') {
    const testWorker = worker.replace("const ART_PROXY = 'https://ecs.zingspark.tech/botc-image-proxy'", `const ART_PROXY = 'http://127.0.0.1:${remoteServer.address().port}/proxy'`)
      .replace("const CANONICAL_ICON_HOST = 'oss.gstonegames.com'", "const CANONICAL_ICON_HOST = '127.0.0.1'")
      .replace("url.protocol === 'https:' && url.hostname === CANONICAL_ICON_HOST", "url.protocol === 'http:' && url.hostname === CANONICAL_ICON_HOST");
    response.writeHead(200, { 'content-type': 'application/javascript', 'cache-control': 'no-store' }); response.end(testWorker);
  } else if (url.pathname === '/art-cache-manifest.json') {
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ version, assets: { '/imgs/sample.png': revision } }));
  } else if (url.pathname === '/imgs/sample.png') {
    requests++;
    response.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-cache' }); response.end(image);
  } else if (url.pathname.startsWith('/data_file/clocktower/web/icons/')) {
    iconRequests++;
    response.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' }); response.end(icon);
  } else if (url.pathname === '/proxy') {
    proxyRequests++;
    response.writeHead(200, { 'content-type': 'image/png', 'access-control-allow-origin': '*', 'cache-control': 'private, max-age=3600' }); response.end(icon);
  } else {
    response.writeHead(200, { 'content-type': 'text/html' }); response.end('<!doctype html><title>Cache test</title>');
  }
};
const server = createServer(handle);
const remoteServer = createServer(handle);
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
await new Promise(resolve => remoteServer.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch();
const context = await browser.newContext();
try {
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(async () => { await navigator.serviceWorker.register('/art-cache-sw.js?v=v1'); await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.includes('v=v1'));
  const getImage = () => page.evaluate(async () => await (await fetch('/imgs/sample.png')).text());
  assert.equal(await getImage(), 'first-image');
  await page.waitForFunction(() => new Promise(resolve => {
    const open = indexedDB.open('botc-art-assets-v1', 1);
    open.onsuccess = () => {
      const request = open.result.transaction('images').objectStore('images').get('/imgs/sample.png');
      request.onsuccess = () => resolve(request.result?.revision === 'first');
      request.onerror = () => resolve(false);
    };
    open.onerror = () => resolve(false);
  }));
  const firstRequests = requests;
  assert.equal(await getImage(), 'first-image');
  assert.equal(requests, firstRequests, 'a repeated image is served from IndexedDB');
  const iconUrl = `http://127.0.0.1:${remoteServer.address().port}/data_file/clocktower/web/icons/sample.png`;
  await page.evaluate(url => new Promise((resolve, reject) => {
    const element = new Image(); element.onload = resolve; element.onerror = reject; element.src = url;
    document.body.appendChild(element);
  }), iconUrl);
  await page.waitForFunction(url => new Promise(resolve => {
    const open = indexedDB.open('botc-art-assets-v1', 1);
    open.onsuccess = () => {
      const request = open.result.transaction('images').objectStore('images').get(`remote:${url}`);
      request.onsuccess = () => resolve(Boolean(request.result)); request.onerror = () => resolve(false);
    };
    open.onerror = () => resolve(false);
  }), iconUrl);
  assert.equal(iconRequests, 1, 'the first icon displays using its original URL');
  assert.equal(proxyRequests, 1, 'the public proxy warms a readable cached copy');
  await context.setOffline(true);
  assert.equal(await getImage(), 'first-image', 'a cached image is available offline');
  assert.equal(await page.evaluate(async url => (await (await fetch(url, { mode: 'cors', credentials: 'omit' })).blob()).size, iconUrl), icon.length,
    'the cached proxy image is readable for export even when its original host has no CORS');
  await context.setOffline(false);

  await page.evaluate(async () => { await caches.open('botc-static-v6'); await caches.open('unrelated-cache'); });
  version = 'v2'; revision = 'second'; image = Buffer.from('new-image');
  await page.evaluate(() => navigator.serviceWorker.register('/art-cache-sw.js?v=v2'));
  await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.includes('v=v2'));
  await page.waitForFunction(async () => !(await caches.keys()).includes('botc-static-v6'));
  assert.ok((await page.evaluate(() => caches.keys())).includes('unrelated-cache'), 'other caches must be preserved');
  assert.equal(await getImage(), 'new-image', 'a new manifest revision must replace stale artwork');
  assert.ok(requests > firstRequests);
  console.log('IndexedDB artwork cache, external icon/proxy fallback, offline reuse, and revision invalidation passed.');
} finally {
  await context.close(); await browser.close();
  await Promise.all([new Promise(resolve => server.close(resolve)), new Promise(resolve => remoteServer.close(resolve))]);
}
