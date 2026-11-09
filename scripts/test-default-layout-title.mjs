import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on('pageerror', error => errors.push(String(error)));
const meta = async () => JSON.parse(await page.getByRole('textbox', { name: 'Script JSON' }).inputValue())[0];
async function drag(locator, dx, dy) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox(); assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 10 });
  await page.mouse.up();
}
async function relativeTop(locator) {
  return locator.evaluate(el => el.getBoundingClientRect().top - document.querySelector('#script-preview').getBoundingClientRect().top);
}

try {
  await page.goto(server.resolvedUrls.local[0]);
  await page.locator('#script-preview').waitFor();
  await page.getByRole('textbox', { name: 'Script JSON' }).fill(JSON.stringify([{ id: '_meta', name: 'Custom Your Script!', author: 'Onion' }, 'noble']));
  await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  const card = page.locator('.inline-state-rules'), cloud = page.locator('[data-footer-item="default-night-legend"]');
  await card.waitFor(); await cloud.waitFor();
  assert.ok((await card.innerText()).includes('Poisoned / Drunk') && (await card.innerText()).includes('Madness'));
  assert.equal((await meta()).footer_components.find(item => item.type === 'stateLayout').width, 60);
  assert.equal(await page.locator('[data-tower-item="back_town"]').count(), 1);
  assert.equal(await page.locator('[data-tower-item="back_tower2"]').count(), 0);
  const title = page.locator('[data-header-layout-item="title"]'), titleText = title.locator('[data-title-text]'), pattern = title.locator('.title-flourish');
  const titleBox = await title.boundingBox(), creditsBox = await page.locator('.script-header-credits').boundingBox();
  assert.ok(titleBox && creditsBox && Math.abs(titleBox.y + titleBox.height / 2 - creditsBox.y - creditsBox.height / 2) < 25,
    'default title should be vertically centered alongside the credits');
  const initialFont = parseFloat(await titleText.evaluate(el => getComputedStyle(el).fontSize));
  const initialFlower = (await pattern.boundingBox()).height;
  await title.hover(); await drag(title.locator('[data-layout-edge="right"]'), -120, 0);
  const resizedFont = parseFloat(await titleText.evaluate(el => getComputedStyle(el).fontSize));
  const resizedFlower = (await pattern.boundingBox()).height;
  assert.ok(resizedFont < initialFont - 2, 'resizing the title frame should change the font size');
  assert.ok(Math.abs(resizedFlower / initialFlower - resizedFont / initialFont) < 0.06, 'the flourish should scale with the title');
  await titleText.dblclick();
  const titleDialog = page.getByRole('dialog', { name: 'Edit First Page Title' });
  const slider = titleDialog.getByRole('slider', { name: 'Flourish size' });
  await slider.focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  await titleDialog.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('.MuiModal-root').waitFor({ state: 'detached' });
  assert.equal((await meta()).title_flourish_scale, 1.1);
  await titleText.dblclick();
  await titleDialog.getByRole('slider', { name: 'Flourish size' }).focus(); await page.keyboard.press('ArrowLeft');
  await titleDialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.locator('.MuiModal-root').waitFor({ state: 'detached' });
  assert.equal((await meta()).title_flourish_scale, 1.1, 'cancel should preserve the saved flourish size');
  const first = page.locator('[data-night-order-side="first"] [data-night-order-title]');
  const other = page.locator('[data-night-order-side="other"] [data-night-order-title]');
  const firstBefore = await relativeTop(first), otherBefore = await relativeTop(other);
  await drag(first, 0, -55);
  assert.ok((await relativeTop(first)) < firstBefore - 45, 'first-night column should move vertically');
  assert.ok(Math.abs((await relativeTop(other)) - otherBefore) < 1, 'the other-night column should remain independent');
  await first.dblclick();
  const sideDialog = page.getByRole('dialog', { name: 'Edit · First Night Order' });
  await sideDialog.getByRole('textbox', { name: 'First Night Order' }).fill('Opening Night');
  await sideDialog.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('.MuiModal-root').waitFor({ state: 'detached' });
  assert.equal((await meta()).side_first_night_title, 'Opening Night');
  assert.equal((await meta()).storyteller_first_night_title, undefined);
  await other.dblclick();
  const otherDialog = page.getByRole('dialog', { name: 'Edit · Other Nights Order' });
  await otherDialog.getByRole('textbox', { name: 'Other Nights Order' }).fill('Later Nights');
  await otherDialog.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('.MuiModal-root').waitFor({ state: 'detached' });
  assert.equal((await meta()).side_other_night_title, 'Later Nights');
  assert.equal((await meta()).storyteller_other_night_title, undefined);
  await page.reload();
  await page.locator('[data-night-order-side="first"] [data-night-order-title]').waitFor();
  assert.ok((await first.innerText()).replace(/\s/g, '').includes('OpeningNight'));
  assert.equal((await meta()).title_flourish_scale, 1.1);
  assert.ok(Math.abs((await relativeTop(first)) - firstBefore + 55) < 3, 'side position should survive reload');
  for (const option of ['Original JSON (Default) (Custom)', 'Full JSON (Official Characters)', 'Official ID Only (Official Characters)']) {
    await page.getByRole('button', { name: /export json/i }).click();
    const downloading = page.waitForEvent('download');
    await page.getByRole('dialog').getByText(option, { exact: true }).click();
    const download = await downloading, exported = JSON.parse(await readFile(await download.path(), 'utf8'));
    const saved = exported.find(item => item && item.id === '_meta');
    assert.equal(saved.title_flourish_scale, 1.1); assert.equal(saved.side_first_night_title, 'Opening Night');
    assert.equal(saved.side_other_night_title, 'Later Nights');
    assert.equal(saved.footer_defaults_version, 1); assert.equal(saved.footer_layout_version, 1);
    await page.locator('.MuiModal-root').waitFor({ state: 'detached' });
  }
  for (const item of [card, cloud]) {
    await item.scrollIntoViewIfNeeded(); await item.hover();
    await item.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await item.waitFor({ state: 'detached' });
  }
  await page.reload(); await page.locator('#script-preview').waitFor();
  assert.equal(await card.count(), 0); assert.equal(await cloud.count(), 0);
  await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  assert.equal(await card.count(), 0); assert.equal(await cloud.count(), 0, 'removed defaults must not reappear');
  await page.locator('[data-script-add-page="1"]').click();
  const footerDialog = page.getByRole('dialog');
  await footerDialog.getByRole('button', { name: 'First-night legend', exact: true }).click();
  await footerDialog.getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator('.MuiModal-root').waitFor({ state: 'detached' });
  assert.equal(await page.locator('[data-footer-kind="nightLegend"]').count(), 1, 'a removed cloud can be added again');

  await page.evaluate(async () => {
    const config = JSON.parse(localStorage.getItem('botc-ui-config'));
    delete config.layoutVersion; delete config.towerLayoutVersion;
    config.headerLayout.title.x = 123; config.headerLayout.authorLine.x = 280; config.titleContentGap = 90;
    config.titleFontSize.md = '3.5rem'; config.showDesignCredit = false; config.nightOrderOffsets = { first: 42, other: 30 };
    config.towerImagesInitialized = true; config.townSilhouetteRestored = true;
    localStorage.setItem('botc-ui-config', JSON.stringify(config));
    const old = [{ id: '_meta', name: 'Old script', author: 'Old author', state: [{ stateName: 'Old rule', stateDescription: 'Keep me' }],
      footer_components: [{ id: 'old-layout', type: 'stateLayout', page: 1, x: 42, y: 16, width: 82 },
        { id: 'old-cloud', type: 'nightLegend', page: 1, x: 20, y: 5, width: 50, text: 'Keep legend' }] }, 'noble'];
    localStorage.setItem('botc-script-data', JSON.stringify({ version: 2, originalJson: JSON.stringify(old), normalizedJson: '', customTitle: '', customAuthor: '', timestamp: Date.now() }));
    const request = indexedDB.open('botc-tower-images-db', 1);
    const db = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise((resolve, reject) => {
      const tx = db.transaction('tower-images', 'readwrite'), store = tx.objectStore('tower-images'); store.clear();
      store.put({ id: 'back_tower2', url: '/imgs/images/background/back_tower2.png', x: 36, y: 0, scale: 1, opacity: 0.8, isDefault: true, createdAt: 1 });
      store.put({ id: 'back_town', url: '/imgs/images/background/back_town.png', x: 20, y: 0, scale: 0.5, opacity: 0.5, isDefault: true, createdAt: 2 });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    }); db.close();
  });
  await page.reload(); await page.locator('[data-footer-item="old-cloud"]').waitFor();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('botc-ui-config')).towerLayoutVersion === 2);
  let config = await page.evaluate(() => JSON.parse(localStorage.getItem('botc-ui-config')));
  assert.equal(config.headerLayout.title.x, 0); assert.equal(config.headerLayout.authorLine.x, 0); assert.equal(config.titleContentGap, 72);
  assert.equal(config.titleFontSize.md, '3.5rem'); assert.equal(config.showDesignCredit, false);
  assert.deepEqual(config.nightOrderOffsets, { first: 0, other: 0 });
  const oldMeta = await meta();
  assert.equal(oldMeta.state[0].stateDescription, 'Keep me');
  assert.equal(oldMeta.footer_components.find(item => item.id === 'old-layout').width, 60);
  assert.equal(oldMeta.footer_components.find(item => item.id === 'old-cloud').text, 'Keep legend');
  assert.equal(oldMeta.footer_components.find(item => item.id === 'old-cloud').width, 14);
  assert.equal(await page.locator('[data-tower-item="back_tower2"]').count(), 0);
  await page.evaluate(() => {
    const c = JSON.parse(localStorage.getItem('botc-ui-config'));
    c.titleContentGap = 17; c.headerLayout.authorLine.x = 25; c.nightOrderOffsets.first = 12;
    localStorage.setItem('botc-ui-config', JSON.stringify(c));
    const saved = JSON.parse(localStorage.getItem('botc-script-data'));
    const entries = JSON.parse(saved.originalJson); entries[0].footer_components.find(item => item.id === 'old-layout').x = 20;
    saved.originalJson = JSON.stringify(entries); localStorage.setItem('botc-script-data', JSON.stringify(saved));
  });
  await page.reload(); await page.locator('[data-footer-item="old-cloud"]').waitFor();
  config = await page.evaluate(() => JSON.parse(localStorage.getItem('botc-ui-config')));
  assert.equal(config.titleContentGap, 17, 'migration must not repeat on later visits');
  assert.equal(config.headerLayout.authorLine.x, 25); assert.equal(config.nightOrderOffsets.first, 12);
  assert.equal((await meta()).footer_components.find(item => item.id === 'old-layout').x, 20);

  await page.getByRole('textbox', { name: 'Script JSON' }).fill(JSON.stringify([
    { id: '_meta', name: 'Special title' }, 'noble',
    { id: 'special-test', team: 'special_rule', title: 'Special Rule', content: 'Description' },
  ]));
  await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  const specialTitle = page.locator('[data-header-layout-item="title"]');
  const specialText = specialTitle.locator('[data-title-text]');
  await specialTitle.scrollIntoViewIfNeeded(); await specialTitle.hover();
  const specialFont = parseFloat(await specialText.evaluate(el => getComputedStyle(el).fontSize));
  await drag(specialTitle.locator('[data-layout-edge="right"]'), -80, 0);
  assert.ok(parseFloat(await specialText.evaluate(el => getComputedStyle(el).fontSize)) < specialFont - 1,
    'font resizing should work when a special rule is present');

  await page.getByRole('textbox', { name: 'Script JSON' }).fill(JSON.stringify([
    { id: '_meta', name: 'Image title', titleImage: '/imgs/images/sources/logo1.png', titleImageSize: 160, use_title_image: true }, 'noble',
  ]));
  await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  const imageTitle = page.locator('[data-header-layout-item="title"]');
  await imageTitle.locator('[data-title-image] img').evaluate(image => image.decode());
  await imageTitle.scrollIntoViewIfNeeded(); await imageTitle.hover();
  await drag(imageTitle.locator('[data-layout-edge="right"]'), -80, 0);
  assert.ok((await meta()).titleImageSize < 160, 'resizing an image title should change its image size');

  const narrow = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const narrowPage = await narrow.newPage();
  await narrowPage.goto(server.resolvedUrls.local[0]); await narrowPage.locator('#script-preview').waitFor();
  await narrowPage.getByRole('textbox', { name: 'Script JSON' }).fill(JSON.stringify([{ id: '_meta', name: 'Narrow page' }, 'noble']));
  await narrowPage.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  const narrowCard = narrowPage.locator('.inline-state-rules'), narrowPaper = narrowPage.locator('#main_script');
  await narrowCard.waitFor();
  assert.ok((await narrowCard.boundingBox()).width / (await narrowPaper.boundingBox()).width > 0.85,
    'the default explanation should use the available width on a narrow screen');
  await narrow.close();
  const oldDefaultContext = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const oldDefaultPage = await oldDefaultContext.newPage();
  await oldDefaultPage.addInitScript(() => {
    if (!sessionStorage.getItem('old-default-seeded')) {
      localStorage.setItem('botc-ui-config', JSON.stringify({ titleFontSize: { xs: '1.2rem', sm: '1.6rem', md: '4.5rem' } }));
      sessionStorage.setItem('old-default-seeded', 'true');
    }
  });
  await oldDefaultPage.goto(server.resolvedUrls.local[0]); await oldDefaultPage.locator('#script-preview').waitFor();
  const oldDefaultConfig = await oldDefaultPage.evaluate(() => JSON.parse(localStorage.getItem('botc-ui-config')));
  assert.equal(oldDefaultConfig.titleFontSize.md, '6rem', 'the old default title size should upgrade');
  assert.equal(oldDefaultConfig.titleContentGap, 72);
  await oldDefaultContext.close();
  assert.deepEqual(errors, []);
  console.log('Default layout and title checks passed.');
} finally {
  await browser.close(); await server.close();
}
