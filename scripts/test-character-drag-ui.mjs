import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, serviceWorkers: 'block' });
try {
  await page.goto(`${server.resolvedUrls.local[0]}?lang=en`);
  await page.locator('#script-preview').waitFor();
  const sample = [{ id: '_meta', name: 'Drag test' }, 'noble',
    { id: 'custom_draggable', name: 'Custom drag', team: 'townsfolk', ability: 'Custom.', author: 'Creator', image: '/imgs/icons/75px-Di.png' }, 'chef'];
  await page.getByRole('textbox', { name: 'Script JSON' }).fill(JSON.stringify(sample));
  await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  const card = name => page.locator('#script-preview [role="button"]').filter({ hasText: name }).first();
  await card('Custom drag').waitFor();
  await card('Custom drag').scrollIntoViewIfNeeded();
  const from = await card('Custom drag').boundingBox(), to = await card('Noble').boundingBox();
  assert.ok(from && to);
  await page.mouse.move(from.x + from.width * 0.4, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width * 0.4, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForFunction(() => {
    const value = document.querySelector('textarea[aria-label="Script JSON"]')?.value;
    if (!value) return false;
    const entries = JSON.parse(value);
    return entries.findIndex(item => item?.id === 'custom_draggable') < entries.findIndex(item => item === 'noble');
  }, null, { timeout: 8000 }).catch(async error => {
    console.log('Drag positions:', from, to);
    console.log('Script JSON after drag:', await page.getByRole('textbox', { name: 'Script JSON' }).inputValue());
    throw error;
  });
  await page.reload();
  await page.locator('#script-preview').waitFor();
  const positions = await Promise.all([card('Custom drag').boundingBox(), card('Noble').boundingBox()]);
  assert.ok(positions[0] && positions[1] && positions[0].y < positions[1].y, 'custom character stays above its target after reload');
  console.log('Custom character drag persists after reload.');
} finally {
  await browser.close(); await server.close();
}
