import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { preview } from 'vite';

const server = await preview({ preview: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.addInitScript(() => localStorage.setItem('botc-script-data', JSON.stringify({
    version: 2, timestamp: Date.now(), customTitle: '', customAuthor: '', normalizedJson: '',
    originalJson: JSON.stringify([{ id: '_meta', name: 'Cache build test' },
      { id: 'localtest', name: 'Local test', team: 'townsfolk', ability: 'Test', image: '/imgs/icons/75px-Di.png' }]),
  })));
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 30000 });
  const versions = await page.evaluate(async () => ({
    manifest: (await (await fetch('/art-cache-manifest.json', { cache: 'no-store' })).json()).version,
    worker: new URL(navigator.serviceWorker.controller.scriptURL).searchParams.get('v'),
    imageSize: (await (await fetch('/imgs/images/sources/night-legend-cloud-v1.webp')).blob()).size,
  }));
  assert.equal(versions.worker, versions.manifest);
  assert.ok(versions.imageSize > 0);
  await page.waitForFunction(() => new Promise(resolve => {
    const request = indexedDB.open('botc-art-assets-v1', 1);
    request.onsuccess = () => {
      const item = request.result.transaction('images').objectStore('images').get('/imgs/images/sources/night-legend-cloud-v1.webp');
      item.onsuccess = () => resolve(Boolean(item.result)); item.onerror = () => resolve(false);
    };
    request.onerror = () => resolve(false);
  }));
  console.log('Production build registers the matching artwork-cache manifest and caches images.');
} finally {
  await browser.close(); await new Promise(resolve => server.httpServer.close(resolve));
}
