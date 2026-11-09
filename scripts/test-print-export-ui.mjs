import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { unzipSync } from 'fflate';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });
const icon = await sharp({ create: { width: 32, height: 32, channels: 4, background: '#00ff00' } }).png().toBuffer();
const sample = JSON.stringify([{ id: '_meta', name: 'Print UI Sample', author: 'Onion' }, 'noble']);
const previewSample = JSON.stringify([{ id: '_meta', name: 'Preview Only Script', author: 'Onion' }, 'noble']);
const errors = [];

await context.addInitScript(() => {
  // Exercise the user's click without opening a real OS printer dialog.
  window.print = () => { document.documentElement.dataset.testPrintRequested = 'true'; };
});
await context.route('https://oss.gstonegames.com/**', route => route.request().resourceType() === 'image'
  ? route.fulfill({ status: 200, contentType: 'image/png', body: icon }) : route.abort());
await context.route(/^https:\/\/(?:clocktower-wiki\.gstonegames\.com|www\.helloimg\.com|i\.postimg\.cc)\//, route => route.request().resourceType() === 'image'
  ? route.fulfill({ status: 200, contentType: 'image/png', body: icon }) : route.abort());
await context.route('https://ecs.zingspark.tech/botc-image-proxy?**', route => route.fulfill({
  status: 200, contentType: 'image/png', body: icon, headers: { 'access-control-allow-origin': '*' },
}));

try {
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(`${server.resolvedUrls.local[0]}?lang=en`);
  await page.locator('#script-preview').waitFor();
  await page.getByRole('textbox', { name: 'Script JSON' }).fill(sample);
  await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  await page.locator('[data-a4-page-status="fit"]').first().waitFor({ timeout: 60000 });
  await page.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', { configurable: true, get: descriptor.get, set(value) {
      if (typeof value === 'string' && value.startsWith('data:image/svg+xml')) window.__outputRenderCount = (window.__outputRenderCount || 0) + 1;
      descriptor.set.call(this, value);
    } });
  });
  const openedAt = Date.now();
  await page.getByRole('button', { name: 'Export PDF', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('[data-export-preview="1"]').waitFor({ timeout: 5000 });
  assert.ok(Date.now() - openedAt < 5000, 'opening the live preview must not wait for high-resolution export');
  assert.equal(await page.evaluate(() => window.__outputRenderCount || 0), 0, 'opening the preview must not generate output');
  if (process.env.TEMP) await page.screenshot({ path: path.join(process.env.TEMP, 'botc-a4-export-ui-desktop.png') });
  assert.equal(await dialog.getByRole('tab', { name: 'Print / PDF' }).getAttribute('aria-selected'), 'true', 'the existing PDF entry opens print mode');
  assert.equal(await dialog.locator('[data-preview-page-count]').innerText(), '1 / 2');
  assert.equal(await dialog.getByRole('button', { name: 'Previous page' }).isDisabled(), true);

  const savedConfig = await page.evaluate(() => localStorage.getItem('botc-ui-config'));
  const initialWidth = await dialog.locator('[data-export-preview]').evaluate(node => node.getBoundingClientRect().width);
  assert.ok(await dialog.locator('[data-export-preview]').evaluate(node => node.getBoundingClientRect().height <= node.closest('[data-preview-scroll]').clientHeight - 30), 'the default view fits the complete page');
  await dialog.getByRole('button', { name: 'Zoom in' }).click();
  await dialog.getByRole('button', { name: 'Zoom in' }).click();
  assert.equal(await dialog.locator('[data-preview-zoom]').innerText(), '150%');
  const enlargedWidth = await dialog.locator('[data-export-preview]').evaluate(node => node.getBoundingClientRect().width);
  assert.ok(enlargedWidth > initialWidth * 1.45, 'preview zoom visibly enlarges the page');
  await dialog.getByRole('button', { name: 'Fit width' }).click();
  await dialog.getByRole('button', { name: 'Zoom in' }).click();
  const pageZoom = await dialog.locator('[data-preview-zoom]').innerText();
  assert.ok(await dialog.locator('[data-preview-scroll]').evaluate(node => node.scrollWidth > node.clientWidth), 'an enlarged page can be scrolled horizontally');
  assert.equal(await page.evaluate(() => localStorage.getItem('botc-ui-config')), savedConfig, 'preview zoom must not change export scale');
  await dialog.getByRole('button', { name: 'Next page' }).click();
  assert.equal(await dialog.locator('[data-export-preview]').getAttribute('data-export-preview'), '2');
  assert.equal(await dialog.locator('[data-preview-page-count]').innerText(), '2 / 2');
  assert.equal(await dialog.getByRole('button', { name: 'Next page' }).isDisabled(), true);
  assert.equal(await dialog.locator('[data-preview-zoom]').innerText(), pageZoom, 'zoom is retained when changing pages');

  await dialog.getByRole('tab', { name: 'Images' }).click();
  const currentDownload = page.waitForEvent('download', { timeout: 120000 });
  await dialog.getByRole('button', { name: 'Download image', exact: true }).click();
  const download = await currentDownload;
  assert.match(download.suggestedFilename(), /-A4-2\.png$/, 'download uses the selected page');
  const selectedImage = await readFile(await download.path());
  assert.deepEqual([(await sharp(selectedImage).metadata()).width, (await sharp(selectedImage).metadata()).height], [2480, 3508]);
  const allDownload = page.waitForEvent('download', { timeout: 120000 });
  await dialog.getByRole('button', { name: 'Download all (ZIP)' }).click();
  const archive = unzipSync(await readFile(await (await allDownload).path()));
  assert.equal(Object.keys(archive).length, 2);

  await dialog.getByRole('tab', { name: 'Print / PDF' }).click();
  const popupEvent = page.waitForEvent('popup');
  await dialog.getByRole('button', { name: 'Print / save PDF' }).click();
  const popup = await popupEvent;
  await popup.waitForFunction(() => document.documentElement.dataset.testPrintRequested === 'true', null, { timeout: 120000 });
  assert.equal(await popup.locator('.print-page').count(), 2, 'printing uses every rendered page');
  assert.equal(await popup.locator('#script-preview').count(), 0, 'printing does not reflow the editable application');
  const dimensions = await popup.locator('.print-page').first().evaluate(node => {
    const { width, height } = node.getBoundingClientRect();
    return { width, height };
  });
  assert.ok(Math.abs(dimensions.width - 210 / 25.4 * 96) < 1 && Math.abs(dimensions.height - 297 / 25.4 * 96) < 1, 'print pages are physically A4');
  assert.deepEqual(await popup.locator('.print-page img').evaluateAll(nodes => nodes.map(node => [node.naturalWidth, node.naturalHeight])), [[2480, 3508], [2480, 3508]]);
  await popup.evaluate(() => { window.close = () => {}; });
  const pdf = await popup.pdf({ preferCSSPageSize: true, printBackground: true });
  const pdfText = pdf.toString('latin1');
  assert.equal((pdfText.match(/\/Type\s*\/Page\b/g) || []).length, 2, 'PDF has exactly one A4 page per image');
  const mediaBox = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdfText);
  assert.ok(mediaBox && Math.abs(Number(mediaBox[1]) - 595.28) < 1.5 && Math.abs(Number(mediaBox[2]) - 841.89) < 1.5, 'PDF page size is A4');
  if (process.env.TEMP) await writeFile(path.join(process.env.TEMP, 'botc-a4-print-ui-test.pdf'), pdf);
  await popup.close();

  await page.evaluate(() => { window.open = () => null; });
  await dialog.getByRole('button', { name: 'Print / save PDF' }).click();
  await dialog.getByText(/browser blocked the print window/i).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await dialog.getByRole('button', { name: 'Fit page' }).click();
  assert.equal(await dialog.locator('[data-preview-zoom]').innerText(), '100%');
  assert.ok(await dialog.getByRole('button', { name: 'Print / save PDF' }).isVisible(), 'print remains available on a narrow screen');
  if (process.env.TEMP) await page.screenshot({ path: path.join(process.env.TEMP, 'botc-a4-export-ui-mobile.png') });
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();

  // The read-only route owns a different script than the editor's store.
  await context.route('**/scripts/json/official/tb.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: previewSample }));
  const preview = await context.newPage();
  preview.on('pageerror', error => errors.push(String(error)));
  await preview.goto(`${server.resolvedUrls.local[0]}#/repo/Trouble%20Brewing`);
  await preview.locator('#script-preview').waitFor();
  await preview.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', { configurable: true, get: descriptor.get, set(value) {
      if (typeof value === 'string' && value.startsWith('data:image/svg+xml')) {
        const svg = decodeURIComponent(value.slice(value.indexOf(',') + 1));
        window.__previewCorrectScript = window.__previewCorrectScript || svg.includes('Preview Only Script');
      }
      descriptor.set.call(this, value);
    } });
  });
  await preview.getByRole('button', { name: 'Export PDF', exact: true }).click();
  await preview.getByRole('dialog').locator('[data-export-preview]').first().waitFor({ timeout: 120000 });
  assert.ok((await preview.getByRole('dialog').frameLocator('iframe[srcdoc]').locator('#script-preview').innerText()).includes('Preview Only Script'));
  await preview.getByRole('tab', { name: 'Images' }).click();
  const previewDownload = preview.waitForEvent('download', { timeout: 120000 });
  await preview.getByRole('dialog').getByRole('button', { name: 'Download image', exact: true }).click();
  await previewDownload;
  assert.equal(await preview.evaluate(() => window.__previewCorrectScript), true, 'read-only print renders the preview script, not the editor store');
  assert.deepEqual(errors, []);
  console.log('Export UI: page navigation, zoom, downloads, print/PDF pages, popup recovery, mobile layout and read-only preview passed.');
} finally {
  await context.close();
  await browser.close();
  await server.close();
}
