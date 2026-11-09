import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1720, height: 1100 }, acceptDownloads: true });
const icon = await sharp({ create: { width: 32, height: 32, channels: 4, background: '#00ff00' } }).png().toBuffer();
await page.route('https://oss.gstonegames.com/**', route => route.request().resourceType() === 'image'
  ? route.fulfill({ status: 200, contentType: 'image/png', body: icon }) : route.abort());
await page.route(/^https:\/\/(?:clocktower-wiki\.gstonegames\.com|www\.helloimg\.com|i\.postimg\.cc)\//, route => route.request().resourceType() === 'image'
  ? route.fulfill({ status: 200, contentType: 'image/png', body: icon }) : route.abort());
await page.route('https://ecs.zingspark.tech/botc-image-proxy?**', route => route.fulfill({
  status: 200, contentType: 'image/png', body: icon, headers: { 'access-control-allow-origin': '*' },
}));

try {
  const sample = JSON.parse(await readFile('public/scripts/自定义剧本/example.json', 'utf8'));
  await page.goto(`${server.resolvedUrls.local[0]}?lang=en`);
  await page.locator('#script-preview').waitFor();
  const generate = async entries => {
    await page.getByRole('textbox', { name: 'Script JSON' }).fill(JSON.stringify(entries));
    await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
    await page.waitForFunction(() => document.querySelector('[data-a4-guide-preview] iframe')?.dataset.a4Status === 'ready', null, { timeout: 60000 });
  };
  await generate(sample);
  await page.locator('[data-a4-page-status="fit"]').first().waitFor({ timeout: 60000 });
  const guide = page.frames().find(frame => frame.url().includes('export-render.html'));
  const result = await guide.evaluate(() => {
    const root = document.querySelector('#script-preview');
    const rect = selector => root.querySelector(selector)?.getBoundingClientRect();
    const bounds = root.getBoundingClientRect(), main = rect('#main_script'), title = rect('[data-header-layout-item="title"]');
    const design = rect('[data-header-layout-item="design"]'), author = rect('[data-header-layout-item="author-line"]');
    const card = rect('.inline-state-rules'), cloud = rect('[data-footer-kind="nightLegend"]');
    return { page: bounds.height, mainLeft: main.left, mainRight: main.right, titleLeft: title.left, titleRight: title.right,
      designLeft: design.left, authorRight: author.right, cardBottom: card.bottom, cloudTop: cloud.top, cloudBottom: cloud.bottom };
  });
  assert.ok(Math.abs(result.page - 2079) < 2, 'the complete default example fits 54% A4');
  assert.ok(result.cloudTop - result.cardBottom >= 12, 'the default explanation and cloud do not overlap');
  assert.ok(Math.abs(result.cloudBottom - 2079) < 2, 'the cloud remains at the page edge');
  assert.ok(result.designLeft < result.titleLeft && result.mainRight - result.authorRight < 40, 'normal header has designer left and author right');
  assert.equal(await page.locator('#script-preview [data-header-layout-item="author"]').count(), 0, 'empty author avatar is not displayed by default');

  // The second reference: title on the left, special rules and designer on the right.
  const special = [...sample, { id: 'special-test', team: 'special_rule', title: 'God in Play', content: 'God announces they will be on the same team as a player.' }];
  await generate(special);
  const positions = await page.locator('#script-preview').evaluate(root => {
    const rect = selector => root.querySelector(selector).getBoundingClientRect();
    const title = rect('[data-header-layout-item="title"]'), rule = rect('[data-header-layout-item="rule"]');
    const design = rect('[data-header-layout-item="design"]'), author = rect('[data-header-layout-item="author-line"]');
    return { title, rule, design, author };
  });
  assert.ok(positions.title.left < positions.rule.left && positions.rule.right < positions.design.right, 'special rule header places title left and designer right');
  assert.ok(positions.author.left >= positions.title.left && positions.author.right <= positions.rule.left, 'special-rule author belongs under the title');

  // The user can still choose and persist centered author text.
  await page.locator('#script-preview [data-title-text]').dblclick();
  const dialog = page.getByRole('dialog', { name: 'Edit First Page Title' });
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
  assert.equal(JSON.parse(await page.getByRole('textbox', { name: 'Script JSON' }).inputValue())[0].author_alignment, undefined, 'saving unrelated title settings retains automatic alignment');

  await generate(sample);
  await page.locator('#script-preview [data-title-text]').dblclick();
  await dialog.getByRole('button', { name: 'Center', exact: true }).nth(1).click();
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
  assert.equal(JSON.parse(await page.getByRole('textbox', { name: 'Script JSON' }).inputValue())[0].author_alignment, 'center', 'explicit center alignment is serialized');
  await page.reload(); await page.locator('#script-preview [data-header-layout-item="author-line"]').waitFor();
  assert.equal(await page.evaluate(async () => (await import('/src/stores/ScriptStore.ts')).scriptStore.script.authorAlignment), 'center', 'explicit center alignment survives reload');

  // Only old default spacing is upgraded; existing hand-positioned author and custom spacing survive.
  await page.evaluate(() => {
    const config = JSON.parse(localStorage.getItem('botc-ui-config'));
    config.pageDefaultsVersion = 0; config.characterCard.cardPaddingY = 0.5; config.headerLayout.authorLine.x = 250;
    localStorage.setItem('botc-ui-config', JSON.stringify(config));
  });
  await page.reload(); await page.locator('#script-preview').waitFor();
  let config = await page.evaluate(() => JSON.parse(localStorage.getItem('botc-ui-config')));
  assert.equal(config.characterCard.cardPaddingY, 0.2);
  assert.equal(config.headerLayout.authorLine.x, 250);
  assert.ok(config.legacyCenteredAuthorLineTargets.includes('authorLine'));
  await page.evaluate(() => {
    const config = JSON.parse(localStorage.getItem('botc-ui-config'));
    config.pageDefaultsVersion = 0; config.characterCard.cardPaddingY = 0.35;
    localStorage.setItem('botc-ui-config', JSON.stringify(config));
  });
  await page.reload(); await page.locator('#script-preview').waitFor();
  config = await page.evaluate(() => JSON.parse(localStorage.getItem('botc-ui-config')));
  assert.equal(config.characterCard.cardPaddingY, 0.35);
  console.log('Default A4 layout: full example, both header variants, automatic alignment and settings migration passed.');
} finally {
  await browser.close(); await server.close();
}
