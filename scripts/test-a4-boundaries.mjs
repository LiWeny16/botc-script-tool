import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1720, height: 1100 }, acceptDownloads: true });
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

try {
  // The user's example: the default script, without the optional explanation.
  const sample = JSON.parse(await readFile('public/scripts/自定义剧本/example.json', 'utf8'));
  Object.assign(sample[0], {
    footer_defaults_version: 1,
    footer_layout_version: 1,
    footer_components: [
      { id: 'default-explanation', type: 'stateLayout', page: 1, x: 0, y: 0, width: 60, hidden: true },
      { id: 'default-night-legend', type: 'nightLegend', page: 1, x: 43, y: 0, width: 14, cloudOnly: true, autoReserve: true },
    ],
  });
  await page.goto(`${server.resolvedUrls.local[0]}?lang=en`);
  await page.locator('#script-preview').waitFor();
  await page.getByRole('textbox', { name: 'Script JSON' }).fill(JSON.stringify(sample));
  await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  await page.waitForFunction(() => {
    const frame = document.querySelector('[data-a4-guide-preview] iframe');
    const root = frame?.contentDocument?.querySelector('#script-preview');
    return root && !root.querySelector('.inline-state-rules') && root.querySelector('[data-footer-kind="nightLegend"]')
      && document.querySelector('[data-a4-page-status]')?.getAttribute('data-a4-page-status') === 'fit';
  }, null, { timeout: 60000 });
  const guide = page.frames().find(frame => frame.url().includes('export-render.html'));
  const report = () => guide.evaluate(() => {
    const root = document.querySelector('#script-preview');
    const main = root.querySelector('#main_script');
    const bounds = root.getBoundingClientRect();
    const content = main.querySelector('[data-header-content-start]').getBoundingClientRect();
    const cloud = main.querySelector('[data-footer-kind="nightLegend"]').getBoundingClientRect();
    const sidebar = selector => {
      const side = root.querySelector(selector);
      const list = side.querySelector('[data-night-order-title]').nextElementSibling;
      const icons = [...list.querySelectorAll('img')];
      return { count: icons.length, scrollHeight: list.scrollHeight, clientHeight: list.clientHeight,
        lastBottom: Math.max(...icons.map(image => image.getBoundingClientRect().bottom - bounds.top)) };
    };
    return { viewportWidth: innerWidth, viewportHeight: innerHeight, pageHeight: bounds.height,
      contentBottom: content.bottom - bounds.top, cloudTop: cloud.top - bounds.top, cloudBottom: cloud.bottom - bounds.top,
      left: sidebar('#night-order-left'), right: sidebar('#night-order-right') };
  });
  const at54 = await report();
  assert.equal(at54.viewportWidth, 1470);
  assert.ok(Math.abs(at54.pageHeight - at54.viewportHeight) <= 1, 'fitting page must not stretch beyond A4');
  assert.ok(at54.contentBottom + 8 < at54.cloudTop, 'there is space between real content and the bottom ornament');
  assert.ok(Math.abs(at54.cloudBottom - at54.viewportHeight) <= 1, 'the cloud stays against the A4 edge');
  for (const side of [at54.left, at54.right]) {
    assert.ok(side.count > 0 && side.lastBottom <= at54.viewportHeight && side.scrollHeight <= side.clientHeight + 1, 'night-order icons must all fit');
  }

  // Exercise the real export, including the last role and the bottom legend.
  await page.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', { configurable: true, get: descriptor.get, set(value) {
      if (typeof value === 'string' && value.startsWith('data:image/svg+xml')) {
        const svg = decodeURIComponent(value.slice(value.indexOf(',') + 1));
        window.__a4IncludesLastRole = window.__a4IncludesLastRole || svg.includes('Fang Gu');
        window.__a4IncludesCloud = window.__a4IncludesCloud || svg.includes('Except 1st night');
      }
      descriptor.set.call(this, value);
    } });
  });
  await page.getByRole('button', { name: 'Export Image', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('[data-export-preview="1"]').waitFor({ timeout: 120000 });
  const download = page.waitForEvent('download', { timeout: 120000 });
  await dialog.getByRole('button', { name: 'Download image', exact: true }).click();
  const png = await readFile(await (await download).path());
  const metadata = await sharp(png).metadata();
  assert.deepEqual([metadata.width, metadata.height, metadata.density], [2480, 3508, 300]);
  assert.equal(await page.evaluate(() => window.__a4IncludesLastRole && window.__a4IncludesCloud), true, 'export retains the last role and the bottom cloud');
  if (process.env.TEMP) await writeFile(path.join(process.env.TEMP, 'botc-a4-boundaries-54.png'), png);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();

  const scale = page.locator('[data-a4-layout-guide] input[type=number]');
  await scale.fill('52'); await scale.blur();
  await page.waitForFunction(() => {
    const frame = document.querySelector('[data-a4-guide-preview] iframe');
    return frame?.contentWindow?.innerWidth === 1526 && document.querySelector('[data-a4-page-status]')?.getAttribute('data-a4-page-status') === 'fit';
  }, null, { timeout: 60000 });
  const at52 = await report();
  assert.ok(Math.abs(at52.pageHeight - at52.viewportHeight) <= 1 && Math.abs(at52.cloudBottom - at52.viewportHeight) <= 1,
    'changing scale keeps the page A4-shaped and the cloud at the bottom');

  // A genuinely overlong description still blocks output at the selected scale.
  const overlong = structuredClone(sample);
  overlong[1] = { id: 'noble', name: 'Noble', team: 'townsfolk', ability: 'This deliberately long rule needs real page space. '.repeat(500) };
  await page.getByRole('textbox', { name: 'Script JSON' }).fill(JSON.stringify(overlong));
  await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  await page.locator('[data-a4-page-status="overflow"]').first().waitFor({ timeout: 60000 });
  await page.getByRole('button', { name: 'Export Image', exact: true }).click();
  await page.getByRole('dialog').getByText(/Content exceeds A4 at this scale/).waitFor({ timeout: 60000 });
  assert.equal(await page.getByRole('dialog').locator('[data-export-preview]').count(), 1, 'genuine overflow is still inspectable');
  assert.equal(await page.getByRole('dialog').getByRole('button', { name: 'Download image', exact: true }).isDisabled(), true, 'genuine overflow must not export a clipped page');
  assert.deepEqual(errors, []);
  console.log('A4 boundaries: default example fits at 54% and 52%, cloud stays at the edge, night orders are complete, and real overflow is blocked.');
} finally {
  await browser.close();
  await server.close();
}
