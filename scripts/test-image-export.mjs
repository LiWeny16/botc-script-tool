import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { unzipSync } from 'fflate';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const icon = await sharp({ create: { width: 32, height: 32, channels: 4, background: '#00ff00' } }).png().toBuffer();
const sample = JSON.stringify([{ id: '_meta', name: 'Custom Your Script!', author: 'Onion' }, 'noble']);
const errors = [];

async function openScript(width, proxyAvailable = true, json = sample) {
  const page = await browser.newPage({ viewport: { width, height: 950 }, acceptDownloads: true, serviceWorkers: 'block' });
  page.on('pageerror', error => errors.push(String(error)));
  await page.route('https://oss.gstonegames.com/**', route => route.request().resourceType() === 'image'
    ? route.fulfill({ status: 200, contentType: 'image/png', body: icon })
    : route.abort());
  await page.route(/^https:\/\/(?:clocktower-wiki\.gstonegames\.com|www\.helloimg\.com|i\.postimg\.cc)\//, route => route.request().resourceType() === 'image'
    ? route.fulfill({ status: 200, contentType: 'image/png', body: icon })
    : route.abort());
  await page.route('https://ecs.zingspark.tech/botc-image-proxy?**', route => route.fulfill(proxyAvailable
    ? { status: 200, contentType: 'image/png', body: icon, headers: { 'access-control-allow-origin': '*' } }
    : { status: 502, body: 'unavailable', headers: { 'access-control-allow-origin': '*' } }));
  await page.goto(`${server.resolvedUrls.local[0]}?lang=en`);
  await page.locator('#script-preview').waitFor();
  await page.getByRole('textbox', { name: 'Script JSON' }).fill(json);
  await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  return page;
}

async function exportAndDownload(page) {
  await page.getByRole('button', { name: 'Export Image', exact: true }).click();
  await page.locator('[data-export-preview]').first().waitFor({ timeout: 120000 });
  const download = page.waitForEvent('download', { timeout: 120000 });
  await page.getByRole('dialog').getByRole('button', { name: 'Download image', exact: true }).first().click();
  return readFile(await (await download).path());
}

try {
  const desktop = await openScript(1440);
  await desktop.waitForTimeout(800);
  await desktop.locator('[data-a4-page-status]').first().waitFor({ timeout: 60000 });
  assert.equal(await desktop.locator('[data-a4-scale-control] input[type=number]').first().inputValue(), '54', 'A4 scale defaults to 54%');
  assert.equal(await desktop.locator('[data-a4-page-status="overflow"]').count(), 0, 'short sample fits at the default scale');
  const guideFrame = desktop.frames().find(frame => frame.url().includes('export-render.html'));
  assert.equal(await guideFrame.evaluate(() => innerWidth), 1470, 'the editor uses the 54% A4 layout width');
  await desktop.locator('[data-a4-page-status]').nth(1).click();
  await guideFrame.waitForFunction(() => scrollY > 0);
  await desktop.locator('[data-a4-page-status]').first().click();
  await guideFrame.waitForFunction(() => scrollY === 0);
  const scriptBeforeScale = await desktop.evaluate(async () => JSON.stringify((await import('/src/stores/ScriptStore.ts')).scriptStore.script));
  const before = await desktop.evaluate(() => localStorage.getItem('botc-ui-config'));
  const first = await exportAndDownload(desktop);
  const meta = await sharp(first).metadata();
  assert.deepEqual([meta.width, meta.height, meta.density], [2480, 3508, 300], 'PNG must be A4 at 300 DPI');
  assert.equal(await desktop.evaluate(() => localStorage.getItem('botc-ui-config')), before, 'export must not change browser layout');
  assert.equal(await desktop.locator('[data-export-preview]').count(), 1, 'the preview shows one page at a time');
  assert.equal(await desktop.locator('[data-preview-page-count]').innerText(), '1 / 2', 'script and storyteller pages must both be available');
  const { data } = await sharp(first).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let green = 0;
  for (let i = 0; i < data.length; i += 4) if (data[i] < 25 && data[i + 1] > 230 && data[i + 2] < 25) green++;
  assert.ok(green > 100, 'an external image served by the proxy must appear in the PNG');

  const archiveDownload = desktop.waitForEvent('download', { timeout: 120000 });
  await desktop.getByRole('button', { name: 'Download all (ZIP)' }).click();
  const archive = unzipSync(await readFile(await (await archiveDownload).path()));
  assert.equal(Object.keys(archive).filter(name => name.endsWith('.png')).length, 2, 'ZIP contains one image per page');
  const scaleField = desktop.getByRole('dialog').locator('[data-a4-scale-control] input[type=number]');
  await scaleField.fill('48');
  await scaleField.blur();
  await desktop.locator('[data-export-preview]').first().waitFor({ timeout: 120000 });
  assert.equal(await desktop.evaluate(() => JSON.parse(localStorage.getItem('botc-ui-config')).a4ExportScale), 48, 'custom A4 scale is stored in browser settings');
  assert.equal(await desktop.evaluate(async () => JSON.stringify((await import('/src/stores/ScriptStore.ts')).scriptStore.script)), scriptBeforeScale, 'scale must not modify the script');
  await desktop.waitForFunction(() => {
    const frame = document.querySelector('[data-a4-guide-preview] iframe');
    return frame?.contentWindow?.innerWidth === 1654 && document.querySelector('[data-a4-page-status]');
  }, null, { timeout: 60000 });
  assert.equal(await guideFrame.evaluate(() => innerWidth), 1654, 'the editor follows the same custom scale');
  const scaledDownload = desktop.waitForEvent('download', { timeout: 120000 });
  await desktop.getByRole('dialog').getByRole('button', { name: 'Download image', exact: true }).first().click();
  const scaled = await readFile(await (await scaledDownload).path());
  assert.notDeepEqual(scaled, first, 'changing the scale changes the actual exported image');
  await desktop.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();

  const reloadedContext = await browser.newContext({ storageState: await desktop.context().storageState(), serviceWorkers: 'block' });
  const reloaded = await reloadedContext.newPage();
  await reloaded.goto(`${server.resolvedUrls.local[0]}?lang=en`, { waitUntil: 'domcontentloaded' });
  assert.equal(await reloaded.evaluate(async () => (await import('/src/stores/UIConfigStore.ts')).uiConfigStore.config.a4ExportScale), 48, 'custom scale survives a reload');
  await reloadedContext.close();

  const author = guideFrame.locator('[data-header-layout-item="author"]');
  await author.waitFor({ state: 'hidden' });
  await desktop.evaluate(async data => (await import('/src/stores/ScriptStore.ts')).scriptStore.setAuthorImage(data), `data:image/png;base64,${icon.toString('base64')}`);
  await author.locator('img').waitFor({ state: 'visible', timeout: 60000 });

  const printBefore = await desktop.evaluate(() => JSON.parse(localStorage.getItem('botc-ui-config')).headerLayout);
  await desktop.emulateMedia({ media: 'print' });
  await desktop.waitForTimeout(1000);
  const printAfter = await desktop.evaluate(() => JSON.parse(localStorage.getItem('botc-ui-config')).headerLayout);
  assert.deepEqual(printAfter, printBefore, 'print layout must not rewrite header positions');
  await desktop.close();

  const narrow = await openScript(800);
  const second = await exportAndDownload(narrow);
  assert.deepEqual(second, first, 'A4 export must not depend on the editing viewport');
  await narrow.close();

  const unavailable = await openScript(1440, false);
  await unavailable.getByRole('button', { name: 'Export Image', exact: true }).click();
  const dialog = unavailable.getByRole('dialog');
  await dialog.locator('[data-export-preview]').first().waitFor({ timeout: 60000 });
  await dialog.getByRole('button', { name: 'Download image', exact: true }).click();
  await dialog.getByText(/These images could not be read/).waitFor({ timeout: 60000 });
  assert.equal(await dialog.locator('[data-export-preview]').count(), 1, 'live preview remains available while missing images are fixed');
  await dialog.locator('input[type=file]').first().setInputFiles({ name: 'replacement.png', mimeType: 'image/png', buffer: icon });
  await dialog.getByText('Selected', { exact: true }).waitFor();
  const recoveredDownload = unavailable.waitForEvent('download', { timeout: 120000 });
  await dialog.getByRole('button', { name: 'Try again', exact: true }).click();
  await recoveredDownload;
  await unavailable.close();

  const custom = await openScript(1440);
  const customFont = (await readFile('public/font/dumbledor/dum1wide.ttf')).toString('base64');
  await custom.evaluate(async data => {
    const { uiConfigStore } = await import('/src/stores/UIConfigStore.ts');
    const font = { id: 'export-test', name: 'Export test', fontFamily: 'ExportTestFace', dataUrl: `data:font/ttf;base64,${data}` };
    uiConfigStore.updateConfig({ customFonts: [font], enableTwoPageMode: true, fonts: { ...uiConfigStore.config.fonts, stateRuleContent: 'ExportTestFace, serif' } });
    uiConfigStore.loadSingleFont(font);
    await document.fonts.load('16px "ExportTestFace"');
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', { configurable: true, get: descriptor.get, set(value) {
      if (typeof value === 'string' && value.startsWith('data:image/svg+xml')) {
        const svg = decodeURIComponent(value.slice(value.indexOf(',') + 1));
        window.__exportTestCustomFont = /@font-face\s*\{[^}]*ExportTestFace[^}]*data:font\/ttf;base64/.test(svg);
        window.__exportTestExternalPattern = window.__exportTestExternalPattern || svg.includes('/imgs/images/sources/pattern.webp');
      }
      descriptor.set.call(this, value);
    } });
  }, customFont);
  await exportAndDownload(custom);
  assert.equal(await custom.evaluate(() => window.__exportTestCustomFont), true, 'custom uploaded font must be embedded in SVG');
  assert.equal(await custom.evaluate(() => Boolean(window.__exportTestExternalPattern)), false, 'pseudo-element backgrounds must be embedded in SVG');
  await custom.close();

  // A dense script must not be silently shrunk or clipped at the chosen scale.
  const denseScript = await readFile('public/scripts/json/custom/疯哑急.json', 'utf8');
  const dense = await openScript(1440, true, denseScript);
  await dense.waitForTimeout(1000);
  await dense.locator('[data-a4-page-status="overflow"]').first().waitFor({ timeout: 60000 });
  await dense.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', { configurable: true, get: descriptor.get, set(value) {
      if (typeof value === 'string' && value.startsWith('data:image/svg+xml')) {
        const svg = decodeURIComponent(value.slice(value.indexOf(',') + 1));
        window.__exportHasLastRole = window.__exportHasLastRole || svg.includes('往生者');
        window.__exportHasExplanation = window.__exportHasExplanation || svg.includes('Poisoned / Drunk');
      }
      descriptor.set.call(this, value);
    } });
  });
  await dense.getByRole('button', { name: 'Export Image', exact: true }).click();
  const denseDialog = dense.getByRole('dialog');
  await denseDialog.getByText(/Content exceeds A4 at this scale/).waitFor({ timeout: 60000 });
  assert.equal(await denseDialog.locator('[data-export-preview]').count(), 1, 'overflow still permits a live preview');
  await denseDialog.getByRole('tab', { name: 'Print / PDF' }).click();
  assert.equal(await denseDialog.getByRole('button', { name: 'Print / save PDF' }).isDisabled(), true, 'overflow must block printing as well');
  await denseDialog.getByRole('tab', { name: 'Images' }).click();
  await denseDialog.locator('[data-a4-scale-control] input[type=number]').fill('35');
  await denseDialog.locator('[data-a4-scale-control] input[type=number]').blur();
  const denseBefore = await dense.evaluate(() => localStorage.getItem('botc-ui-config'));
  await denseDialog.locator('[data-export-preview]').first().waitFor({ timeout: 120000 });
  await dense.waitForFunction(() => document.querySelector('[data-a4-page-status]')?.getAttribute('data-a4-page-status') === 'fit', null, { timeout: 60000 });
  const denseDownload = dense.waitForEvent('download', { timeout: 120000 });
  await denseDialog.getByRole('button', { name: 'Download image', exact: true }).first().click();
  const densePng = await readFile(await (await denseDownload).path());
  const pixels = await sharp(densePng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const edgeMean = x => {
    let total = 0;
    for (let y = 1000; y < 2500; y++) total += pixels.data[(y * pixels.info.width + x) * 4];
    return total / 1500;
  };
  assert.ok(edgeMean(5) < 150 && edgeMean(pixels.info.width - 6) < 150, 'the side borders must touch both edges of the A4 PNG');
  assert.ok(edgeMean(Math.floor(pixels.info.width / 2)) > 180, 'the parchment must remain in the middle of the page');
  assert.equal(await dense.evaluate(() => window.__exportHasLastRole && window.__exportHasExplanation), true, 'the final role and explanation must be present');
  assert.equal(await dense.evaluate(() => localStorage.getItem('botc-ui-config')), denseBefore, 'A4 reflow must not change stored layout');
  await dense.close();
  assert.deepEqual(errors, []);
  console.log('Image export: configurable A4 scale, editor guidance, overflow blocking, full-bleed output, content, DPI, images, ZIP, viewport stability and recovery passed.');
} finally {
  await browser.close();
  await server.close();
}
