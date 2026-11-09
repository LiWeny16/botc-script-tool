import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

async function waitForDefaults() {
  await page.locator('[data-header-layout-item="design"]').waitFor();
  await page.waitForFunction(() => {
    const config = JSON.parse(localStorage.getItem('botc-ui-config') || '{}');
    return config.creditDefaultsVersion === 2 && config.towerLayoutVersion === 2;
  }, null, { timeout: 30000 });
}

async function readState() {
  return page.evaluate(async () => {
    const { uiConfigStore } = await import('/src/stores/UIConfigStore.ts');
    return JSON.parse(JSON.stringify({ header: uiConfigStore.config.headerLayout, towers: uiConfigStore.config.towerImages }));
  });
}

async function seedPrevious({ designY, towerScale, townOpacity }) {
  await page.evaluate(async ({ designY, towerScale, townOpacity }) => {
    const config = JSON.parse(localStorage.getItem('botc-ui-config'));
    config.creditDefaultsVersion = 0;
    config.headerLayout.design = { x: 0, y: designY, widthDelta: 0, minHeight: 0, scale: 1 };
    config.headerLayout.author = { x: 25, y: 7, widthDelta: 0, minHeight: 0, scale: 1 };
    config.towerLayoutVersion = 1; config.towerImagesInitialized = true; config.townSilhouetteRestored = true;
    localStorage.setItem('botc-ui-config', JSON.stringify(config));
    const request = indexedDB.open('botc-tower-images-db', 1);
    const db = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise((resolve, reject) => {
      const tx = db.transaction('tower-images', 'readwrite'), store = tx.objectStore('tower-images');
      store.clear();
      store.put({ id: 'back_tower', url: '/imgs/images/background/back_tower.png', x: 0, y: 0, scale: towerScale, opacity: 0.35, isDefault: true, createdAt: 1 });
      store.put({ id: 'back_town', url: '/imgs/images/background/back_town.png', x: 43, y: 0, scale: 0.77, opacity: townOpacity, isDefault: true, createdAt: 2 });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, { designY, towerScale, townOpacity });
}

try {
  await page.goto(`${server.resolvedUrls.local[0]}?lang=en`);
  await waitForDefaults();
  let state = await readState();
  assert.equal(state.header.design.y, 24, 'default designer avatar moves below the leaves');
  assert.equal(state.header.author.y, 24, 'default author avatar follows the same baseline');
  assert.equal(state.towers.find(item => item.id === 'back_tower').scale, 0.8, 'left tower is smaller');
  assert.equal(state.towers.find(item => item.id === 'back_town').opacity, 0.45, 'town is more transparent');
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('[data-tower-item="back_town"] img')).opacity) === 0.45);

  await seedPrevious({ designY: 0, towerScale: 1, townOpacity: 0.8 });
  await page.reload(); await waitForDefaults(); state = await readState();
  assert.equal(state.header.design.y, 24, 'the untouched previous avatar default is upgraded');
  assert.equal(state.header.author.x, 25); assert.equal(state.header.author.y, 7, 'custom avatar positions survive');
  assert.equal(state.towers.find(item => item.id === 'back_tower').scale, 0.8);
  assert.equal(state.towers.find(item => item.id === 'back_tower').opacity, 0.35, 'custom tower opacity survives');
  assert.equal(state.towers.find(item => item.id === 'back_town').opacity, 0.45);
  assert.equal(state.towers.find(item => item.id === 'back_town').scale, 0.77, 'custom town size survives');

  await seedPrevious({ designY: 40, towerScale: 0.67, townOpacity: 0.3 });
  await page.reload(); await waitForDefaults(); state = await readState();
  assert.equal(state.header.design.y, 40, 'a deliberately moved avatar is not reset');
  assert.equal(state.towers.find(item => item.id === 'back_tower').scale, 0.67, 'a customized tower size is not reset');
  assert.equal(state.towers.find(item => item.id === 'back_town').opacity, 0.3, 'custom town opacity is not reset');
  console.log('Default visuals: avatar placement, tower size, town opacity and preservation of customized settings passed.');
} finally {
  await browser.close();
  await server.close();
}
