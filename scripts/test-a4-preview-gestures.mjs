import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, acceptDownloads: true, serviceWorkers: 'block' });
const icon = await sharp({ create: { width: 32, height: 32, channels: 4, background: '#00ff00' } }).png().toBuffer();
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
await page.route('https://oss.gstonegames.com/**', route => route.request().resourceType() === 'image'
  ? route.fulfill({ status: 200, contentType: 'image/png', body: icon }) : route.abort());
await page.route(/^https:\/\/(?:clocktower-wiki\.gstonegames\.com|www\.helloimg\.com|i\.postimg\.cc)\//, route => route.request().resourceType() === 'image'
  ? route.fulfill({ status: 200, contentType: 'image/png', body: icon }) : route.abort());
await page.route('https://ecs.zingspark.tech/botc-image-proxy?**', route => route.fulfill({
  status: 200, contentType: 'image/png', body: icon, headers: { 'access-control-allow-origin': '*' },
}));

async function zoomAndPan(dialog) {
  const scroll = dialog.locator('[data-preview-scroll]');
  const box = await scroll.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.keyboard.down('Control'); await page.mouse.wheel(0, -220); await page.keyboard.up('Control');
  await page.waitForFunction(() => {
    const element = document.querySelector('[role="dialog"] [data-preview-zoom]');
    return element && Number.parseInt(element.textContent, 10) > 100;
  });
  assert.ok(await scroll.evaluate(node => node.scrollHeight > node.clientHeight), 'zooming must make the preview scrollable');
  await scroll.evaluate(node => { node.scrollTop = 0; });
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 50);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 50, { steps: 5 }); await page.mouse.up();
  assert.ok(await scroll.evaluate(node => node.scrollTop) > 40, 'dragging moves an enlarged preview');
}

try {
  await page.goto(`${server.resolvedUrls.local[0]}?lang=en`);
  await page.locator('#script-preview').waitFor();
  const sample = JSON.stringify([{ id: '_meta', name: 'Preview gesture sample', author: 'Onion' }, 'noble']);
  await page.getByRole('textbox', { name: 'Script JSON' }).fill(sample);
  await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  await page.locator('[data-a4-page-status="fit"]').first().waitFor({ timeout: 60000 });
  const before = await page.evaluate(() => localStorage.getItem('botc-ui-config'));

  const thumbnail = page.getByRole('button', { name: 'Open larger A4 preview' });
  assert.equal(await thumbnail.evaluate(node => getComputedStyle(node).userSelect), 'none', 'the thumbnail must not be text-selected');
  assert.equal(await thumbnail.evaluate(node => !node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }))), true,
    'mouse selection must be suppressed on the thumbnail');
  await thumbnail.dblclick();
  let dialog = page.getByRole('dialog', { name: 'Export and print' });
  await dialog.waitFor();
  const liveFrame = dialog.frameLocator('iframe');
  await liveFrame.locator('#script-preview').waitFor();
  assert.ok((await liveFrame.locator('#main_script').evaluate(node => getComputedStyle(node).backgroundImage)).includes('url('), 'the enlarged preview keeps the script styles');
  assert.ok((await liveFrame.locator('#script-preview').innerText()).includes('Preview gesture sample'));
  if (process.env.TEMP) await page.screenshot({ path: path.join(process.env.TEMP, 'botc-a4-live-preview.png') });
  await zoomAndPan(dialog);
  await dialog.getByRole('button', { name: 'Next page' }).click();
  await liveFrame.locator('#script-preview-3').waitFor();
  assert.equal(await dialog.locator('[data-preview-page-count]').innerText(), '2 / 2');
  assert.equal(await dialog.getByRole('button', { name: 'Download image', exact: true }).isEnabled(), true, 'the thumbnail preview can directly download the selected page');
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem('botc-ui-config')), before, 'preview gestures must not alter exported layout');

  await page.getByRole('button', { name: 'Export Image', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Export and print' });
  await dialog.locator('[data-export-preview]').first().waitFor({ timeout: 120000 });
  await zoomAndPan(dialog);
  assert.equal(await page.evaluate(() => localStorage.getItem('botc-ui-config')), before, 'export preview zoom must not change the A4 scale');
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();

  // The thumbnail must remain inspectable even when export is blocked.
  const longScript = [{ id: '_meta', name: 'Long preview', author: 'Onion' },
    { id: 'noble', name: 'Noble', team: 'townsfolk', ability: 'A long description needs real space. '.repeat(600) }];
  await page.getByRole('textbox', { name: 'Script JSON' }).fill(JSON.stringify(longScript));
  await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  await page.locator('[data-a4-page-status="overflow"]').first().waitFor({ timeout: 60000 });
  await page.getByRole('button', { name: 'Open larger A4 preview' }).dblclick();
  dialog = page.getByRole('dialog', { name: 'Export and print' });
  await dialog.getByText(/This page exceeds A4/).waitFor();
  await dialog.frameLocator('iframe').locator('#script-preview').waitFor();
  assert.deepEqual(errors, []);
  console.log('A4 previews: double-click, styled page snapshot, page navigation, Ctrl+wheel zoom, drag pan and overflow inspection passed.');
} finally {
  await browser.close();
  await server.close();
}
