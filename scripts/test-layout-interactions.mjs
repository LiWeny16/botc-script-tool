import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, devices } from 'playwright';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ headless: true });
const errors = [];
const fixture = [
  { id: '_meta', name: 'Layout Test', author: 'Onion',
    state: [
      { stateName: 'State One', stateDescription: 'First state', footer_page: 1 },
      { stateName: 'State Two', stateDescription: 'Second state', footer_page: 1 },
    ],
    footer_components: [
      { id: 'legend', type: 'nightLegend', page: 1, x: 25, y: 0, width: 50, text: '* Except 1st night' },
      { id: 'legacy-list', type: 'list', page: 1, x: 30, y: 96, width: 55, title: 'Legacy list', rows: [{ id: 'old-row', text: 'Legacy item', icon: 'data:image/png;base64,AAAA' }] },
    ],
  },
  'noble',
  { id: 'rule-one', team: 'special_rule', title: 'Rule One', content: 'First rule' },
  { id: 'rule-two', team: 'special_rule', title: 'Rule Two', content: 'Second rule' },
];

async function loadScript(page, data) {
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(url);
  await page.locator('#script-preview').waitFor();
  await page.getByRole('textbox', { name: 'Script JSON' }).fill(JSON.stringify(data));
  await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  await page.locator('[data-header-layout-item="title"]').waitFor();
}

async function drag(page, locator, dx, dy) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  assert.ok(box);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 10 });
  await page.mouse.up();
}

async function hideAvatar(page, kind) {
  const avatar = page.locator(`[data-header-layout-item="${kind}"]`);
  await avatar.scrollIntoViewIfNeeded();
  await avatar.hover();
  await avatar.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await avatar.waitFor({ state: 'detached' });
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  await loadScript(page, fixture);
  await page.locator('.special-rule').nth(1).waitFor();

  const authorLine = page.locator('[data-header-layout-item="author-line"]');
  const line = await authorLine.boundingBox();
  const text = await authorLine.locator('.MuiTypography-root').boundingBox();
  assert.ok(line && text && Math.abs(line.width - text.width) < 2, 'author frame should fit the text');

  const divider = page.locator('[data-header-gap-divider]');
  const initialGap = Number(await divider.getAttribute('aria-valuenow'));
  await drag(page, divider, 0, 45);
  assert.ok(Number(await divider.getAttribute('aria-valuenow')) >= initialGap + 40, 'divider should resize the header');
  await drag(page, authorLine, 0, 400);
  const attachedAuthor = await authorLine.boundingBox(), dividerBox = await divider.boundingBox();
  assert.ok(attachedAuthor && dividerBox && Math.abs(attachedAuthor.y + attachedAuthor.height - dividerBox.y - dividerBox.height / 2) < 1,
    'author line should be able to touch the divider');

  const title = page.locator('[data-header-layout-item="title"]');
  await title.hover();
  assert.deepEqual(await title.locator('[data-layout-control]:visible').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label'))), ['Edit', 'More actions']);
  const titleBeforeGuide = await title.boundingBox(), headerPaper = await page.locator('#main_script').boundingBox();
  assert.ok(titleBeforeGuide && headerPaper);
  await page.mouse.move(titleBeforeGuide.x + titleBeforeGuide.width / 2, titleBeforeGuide.y + titleBeforeGuide.height / 2);
  await page.mouse.down();
  await page.mouse.move(headerPaper.x + headerPaper.width / 2, titleBeforeGuide.y + titleBeforeGuide.height / 2 + 8, { steps: 8 });
  const headerGuide = page.locator('.header-drag-guides [data-guide-axis="vertical"]');
  await headerGuide.waitFor({ state: 'visible' });
  const headerGuideBox = await headerGuide.boundingBox(), guideDivider = await divider.boundingBox();
  assert.ok(headerGuideBox && guideDivider && Math.abs(headerGuideBox.y + headerGuideBox.height - guideDivider.y - guideDivider.height / 2) < 1,
    'header alignment guide should end at the team divider');
  await page.mouse.up();
  await drag(page, title, 1400, 600);
  const titleBox = await title.boundingBox();
  const paperBox = await page.locator('#main_script').boundingBox();
  const contentBox = await page.locator('[data-header-content-start]').boundingBox();
  assert.ok(titleBox && paperBox && contentBox);
  assert.ok(titleBox.x >= paperBox.x - 1 && titleBox.x + titleBox.width <= paperBox.x + paperBox.width + 1);
  assert.ok(titleBox.y >= paperBox.y - 1 && titleBox.y + titleBox.height <= contentBox.y + 1, 'title must stay in the header');
  await title.focus();
  await page.keyboard.press('ArrowLeft');
  const nudgedTitle = await title.boundingBox();
  assert.ok(nudgedTitle && nudgedTitle.x < titleBox.x, 'keyboard movement should use the same header bounds');

  const secondRule = page.locator('.special-rule').filter({ hasText: 'Rule Two' });
  await secondRule.scrollIntoViewIfNeeded();
  await secondRule.hover();
  assert.equal(await page.locator('.special-rules [data-layout-control]:visible').count(), 2);
  await secondRule.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  assert.equal(await page.locator('.special-rule').filter({ hasText: 'Rule One' }).count(), 1);
  assert.equal(await page.locator('.special-rule').filter({ hasText: 'Rule Two' }).count(), 0);

  const explanation = page.locator('.inline-state-rules');
  await explanation.scrollIntoViewIfNeeded();
  await explanation.hover();
  assert.equal(await explanation.count(), 1);
  for (const content of ['State One', 'State Two', 'Legacy list', 'Legacy item']) assert.ok((await explanation.innerText()).includes(content));
  assert.equal(await page.locator('[data-footer-item="legacy-list"]').count(), 0);
  assert.equal(await explanation.locator('[data-layout-control]:visible').count(), 2);
  const explanationBeforeGuide = await explanation.boundingBox(), lowerPaper = await page.locator('#main_script').boundingBox();
  assert.ok(explanationBeforeGuide && lowerPaper);
  await page.mouse.move(explanationBeforeGuide.x + explanationBeforeGuide.width / 2, explanationBeforeGuide.y + explanationBeforeGuide.height / 2);
  await page.mouse.down();
  await page.mouse.move(lowerPaper.x + lowerPaper.width / 2, explanationBeforeGuide.y + explanationBeforeGuide.height / 2 + 8, { steps: 8 });
  const footerGuide = page.locator('.footer-drag-guides [data-guide-axis="vertical"]');
  await footerGuide.waitFor({ state: 'visible' });
  const footerGuideBox = await footerGuide.boundingBox(), lowerDivider = await divider.boundingBox();
  assert.ok(footerGuideBox && lowerDivider && Math.abs(footerGuideBox.y - lowerDivider.y - lowerDivider.height / 2) < 1,
    'lower-page alignment guide should start at the team divider');
  await page.mouse.up();
  const originalExplanationBox = await explanation.boundingBox();
  await drag(page, explanation.locator('[data-layout-edge="right"]'), 1000, 0);
  const resizedExplanation = await explanation.boundingBox(), explanationPaper = await page.locator('#main_script').boundingBox();
  assert.ok(originalExplanationBox && resizedExplanation && explanationPaper && resizedExplanation.width > originalExplanationBox.width + 5);
  assert.ok(resizedExplanation.x + resizedExplanation.width <= explanationPaper.x + explanationPaper.width + 1, 'resizing should not leave the paper');
  await explanation.hover();
  await explanation.getByRole('button', { name: 'Edit' }).click();
  const editorDialog = page.getByRole('dialog', { name: 'Edit explanation' });
  const editor = editorDialog.getByRole('textbox', { name: 'Explanation text' });
  await editor.waitFor();
  assert.ok((await editor.innerText()).includes('State Two'));
  const selectFirstParagraph = () => editor.locator('p').first().evaluate(el => {
    const selection = getSelection(), range = document.createRange();
    range.selectNodeContents(el); selection.removeAllRanges(); selection.addRange(range);
  });
  const selectSecondParagraph = () => editor.locator('p').nth(1).evaluate(el => {
    const selection = getSelection(), range = document.createRange();
    range.selectNodeContents(el); selection.removeAllRanges(); selection.addRange(range);
  });
  await selectFirstParagraph();
  await editorDialog.getByRole('button', { name: 'Bold', exact: true }).click();
  assert.ok((await editor.innerHTML()).includes('<b>First state</b>'));
  await editorDialog.getByRole('button', { name: 'Undo' }).click();
  assert.ok(!(await editor.innerHTML()).includes('<b>First state</b>'));
  await editorDialog.getByRole('button', { name: 'Redo' }).click();
  await selectFirstParagraph();
  await editorDialog.getByRole('combobox', { name: 'Font', exact: true }).click();
  await page.getByRole('option', { name: 'Sans-serif', exact: true }).click();
  await selectSecondParagraph();
  await editorDialog.getByRole('combobox', { name: 'Font', exact: true }).click();
  await page.getByRole('option', { name: 'Sans-serif', exact: true }).click();
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Explanation text');
  assert.ok((await editor.locator('p').nth(1).innerHTML()).includes('sans-serif'), 'the same font should apply to another selection');
  await selectFirstParagraph();
  await editorDialog.getByRole('combobox', { name: 'Font size' }).click();
  await page.getByRole('option', { name: '24px' }).click();
  await selectSecondParagraph();
  await editorDialog.getByRole('combobox', { name: 'Font size' }).click();
  await page.getByRole('option', { name: '24px' }).click();
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Explanation text');
  assert.ok((await editor.locator('p').nth(1).innerHTML()).includes('24px'), 'the same size should apply to another selection');
  await selectFirstParagraph();
  await editorDialog.locator('input[aria-label="Text color"]').fill('#aa2200');
  await selectFirstParagraph();
  await editorDialog.locator('input[aria-label="Highlight color"]').fill('#ffff00');
  await selectFirstParagraph();
  await editorDialog.getByRole('button', { name: 'Align center' }).click();
  await editor.focus();
  await page.keyboard.press('Control+End');
  await editor.evaluate(el => {
    const clipboard = new DataTransfer();
    clipboard.setData('text/html', '<p>Safe paste<script>window.__unsafePaste = true</script><img src=x onerror="window.__unsafePaste = true"></p>');
    el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: clipboard }));
  });
  assert.ok((await editor.innerText()).includes('Safe paste'));
  assert.equal(await editor.locator('script, img').count(), 0, 'pasted active content must be removed');
  await editorDialog.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('.MuiModal-root').waitFor({ state: 'detached' });
  let savedMeta = JSON.parse(await page.getByRole('textbox', { name: 'Script JSON' }).inputValue())[0];
  const savedExplanation = savedMeta.footer_components.find(item => item.type === 'stateLayout');
  const savedRichText = JSON.stringify(savedExplanation.richTextDocuments.en);
  assert.ok(savedRichText.includes('strong') && savedRichText.includes('sans-serif') && savedRichText.includes('24px'));
  assert.ok(savedRichText.includes('backgroundColor') && savedRichText.includes('textAlign'));
  assert.equal(savedMeta.state.length, 2);
  assert.equal(savedMeta.footer_components.find(item => item.id === 'legacy-list').rows[0].icon, 'data:image/png;base64,AAAA');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Simplified Chinese' }).click();
  await page.getByRole('button', { name: 'Chinese', exact: true }).waitFor();
  await page.waitForFunction(() => !document.querySelector('.explanation-rich-text strong'));
  await page.getByRole('button', { name: 'Chinese', exact: true }).click();
  await page.getByRole('menuitem', { name: 'English', exact: true }).click();
  await explanation.locator('strong').waitFor();

  await page.locator('[data-script-add-page="header"]').click();
  await page.getByRole('menuitem', { name: 'Restore author avatar' }).click();
  await hideAvatar(page, 'design');
  await hideAvatar(page, 'author');
  await page.reload();
  await page.locator('[data-header-layout-item="title"]').waitFor();
  assert.equal(await page.locator('[data-header-layout-item="design"]').count(), 0);
  assert.equal(await page.locator('[data-header-layout-item="author"]').count(), 0);
  await page.locator('[data-script-add-page="header"]').click();
  await page.getByRole('menuitem', { name: 'Restore designer avatar' }).click();
  await page.locator('[data-script-add-page="header"]').click();
  await page.getByRole('menuitem', { name: 'Restore author avatar' }).click();
  await page.locator('.MuiModal-root').waitFor({ state: 'detached' });
  assert.equal(await page.locator('[data-header-layout-item="design"]').count(), 1);
  assert.equal(await page.locator('[data-header-layout-item="author"]').count(), 1);
  assert.equal(JSON.parse(await page.getByRole('textbox', { name: 'Script JSON' }).inputValue())[0].author, 'Onion');
  const author = page.locator('[data-header-layout-item="author"]');
  let fileChoosers = 0;
  page.on('filechooser', () => { fileChoosers += 1; });
  await drag(page, author.locator('[data-header-avatar-image]'), -30, 0);
  assert.equal(fileChoosers, 0, 'dragging an author avatar should not open the file picker');
  await author.hover();
  const chooser = page.waitForEvent('filechooser');
  await author.getByRole('button', { name: 'Edit' }).click();
  await chooser;
  assert.equal(fileChoosers, 1, 'the edit button should open the file picker');

  const exported = [];
  for (const option of ['Original JSON (Default) (Custom)', 'Full JSON (Official Characters)', 'Official ID Only (Official Characters)']) {
    await page.getByRole('button', { name: /export json/i }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('dialog').getByText(option, { exact: true }).click();
    const file = await download;
    const json = JSON.parse(await readFile(await file.path(), 'utf8'));
    const meta = json.find(item => item && item.id === '_meta');
    const doc = meta.footer_components.find(item => item.type === 'stateLayout').richTextDocuments.en;
    assert.deepEqual(doc, savedExplanation.richTextDocuments.en, `${option} should preserve formatting`);
    assert.equal(meta.footer_components.find(item => item.id === 'legacy-list').rows[0].text, 'Legacy item');
    exported.push(json);
    await page.locator('.MuiModal-root').waitFor({ state: 'detached' });
  }
  await page.getByRole('textbox', { name: 'Script JSON' }).fill(JSON.stringify(exported[0]));
  await page.getByRole('button', { name: 'GENERATE SCRIPT' }).click();
  await explanation.waitFor();
  assert.ok((await explanation.innerText()).includes('Legacy item'));
  assert.equal(await explanation.locator('strong').count(), 1, 'formatted text should survive export and import');
  await explanation.hover();
  await explanation.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await explanation.waitFor({ state: 'detached' });
  await page.reload();
  await page.locator('#script-preview').waitFor();
  assert.equal(await explanation.count(), 0, 'deleted legacy explanation should stay hidden after reload');
  await page.locator('[data-script-add-page="1"]').click();
  const footerDialog = page.getByRole('dialog');
  assert.equal(await footerDialog.getByRole('button', { name: 'Custom explanation list' }).count(), 0);
  await footerDialog.getByRole('button', { name: 'Explanation', exact: true }).click();
  const restoredEditor = page.getByRole('dialog', { name: 'Edit explanation' });
  assert.ok((await restoredEditor.getByRole('textbox', { name: 'Explanation text' }).innerText()).includes('Legacy item'));
  await restoredEditor.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('.MuiModal-root').waitFor({ state: 'detached' });
  await explanation.waitFor();
  savedMeta = JSON.parse(await page.getByRole('textbox', { name: 'Script JSON' }).inputValue())[0];
  assert.equal(savedMeta.state.length, 2);
  assert.equal(savedMeta.footer_components.find(item => item.id === 'legacy-list').rows[0].text, 'Legacy item');

  const cloud = page.locator('[data-footer-item="legend"]');
  await cloud.locator('img').evaluate(img => img.decode());
  await cloud.scrollIntoViewIfNeeded();
  const initialCloudBox = await cloud.boundingBox();
  await drag(page, cloud, 1800, -300);
  const cloudBox = await cloud.boundingBox();
  const bottomPaper = await page.locator('#main_script').boundingBox();
  assert.ok(cloudBox && bottomPaper);
  assert.ok(initialCloudBox && cloudBox.x > initialCloudBox.x + 10, 'cloud should move horizontally');
  assert.ok(Math.abs(cloudBox.y + cloudBox.height - bottomPaper.y - bottomPaper.height) < 1, 'cloud should remain on the bottom edge');
  assert.ok(cloudBox.x + cloudBox.width <= bottomPaper.x + bottomPaper.width + 1, 'cloud should remain inside the paper');
  const savedCloud = JSON.parse(await page.getByRole('textbox', { name: 'Script JSON' }).inputValue())[0].footer_components[0];
  assert.equal(savedCloud.y, 0);
  assert.equal(savedCloud.cloudOnly, true);

  await title.focus();
  await page.keyboard.press('Home');
  await page.evaluate(() => { document.querySelector('#script-preview').style.zoom = '0.8'; });
  await page.waitForFunction(() => {
    const paper = document.querySelector('#main_script');
    return Math.abs(paper.getBoundingClientRect().width / paper.offsetWidth - 0.8) < 0.05;
  });
  await title.scrollIntoViewIfNeeded();
  const scaledTitle = await title.boundingBox();
  assert.ok(scaledTitle);
  await drag(page, title, -60, -25);
  const movedScaledTitle = await title.boundingBox();
  assert.ok(movedScaledTitle && movedScaledTitle.x < scaledTitle.x - 10, 'drag should work when the page is scaled');
  const scaledPaper = await page.locator('#main_script').boundingBox();
  assert.ok(scaledPaper);
  await page.mouse.move(movedScaledTitle.x + movedScaledTitle.width / 2, movedScaledTitle.y + movedScaledTitle.height / 2);
  await page.mouse.down();
  await page.mouse.move(scaledPaper.x + scaledPaper.width / 2, movedScaledTitle.y + movedScaledTitle.height / 2 + 8, { steps: 8 });
  await headerGuide.waitFor({ state: 'visible' });
  const scaledGuide = await headerGuide.boundingBox(), scaledDivider = await divider.boundingBox();
  assert.ok(scaledGuide && scaledDivider && Math.abs(scaledGuide.y + scaledGuide.height - scaledDivider.y - scaledDivider.height / 2) < 1,
    'header guide should still stop at the divider when the page is scaled');
  await page.mouse.up();

  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('[data-layout-frame]').first().evaluate(el => getComputedStyle(el).display), 'none');
  await context.close();

  const mobile = await browser.newContext({ ...devices['iPhone 13'] });
  const mobilePage = await mobile.newPage();
  await loadScript(mobilePage, [{ id: '_meta', name: 'Mobile', state: [{ stateName: 'Poisoned / Drunk', stateDescription: 'State explanation.' }] }, 'noble']);
  const card = mobilePage.locator('.inline-state-rules');
  await card.scrollIntoViewIfNeeded();
  await card.locator('.explanation-rich-text').tap();
  const cardBox = await card.boundingBox();
  const heading = await card.locator('.explanation-rich-text h3').first().evaluate(el => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect().toJSON();
  });
  const edit = await card.getByRole('button', { name: 'Edit' }).boundingBox();
  assert.ok(cardBox && heading && edit);
  assert.ok(heading.y - cardBox.y < 20, 'touch controls should not add an empty row');
  assert.ok(heading.right <= edit.x + 1, 'touch controls should not cover the title');
  assert.equal(await card.locator('[data-layout-control]:visible').count(), 2);
  await card.getByRole('button', { name: 'Edit' }).tap();
  const mobileEditor = mobilePage.getByRole('dialog', { name: 'Edit explanation' });
  assert.ok((await mobileEditor.getByRole('textbox', { name: 'Explanation text' }).innerText()).includes('Poisoned / Drunk'));
  await mobileEditor.getByRole('button', { name: 'Cancel' }).tap();
  await mobile.close();

  const fresh = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const freshPage = await fresh.newPage();
  await loadScript(freshPage, [{ id: '_meta', name: 'New explanation' }, 'noble']);
  const defaultCard = freshPage.locator('.inline-state-rules');
  await defaultCard.waitFor();
  assert.ok((await defaultCard.innerText()).includes('Poisoned / Drunk'), 'new scripts should include the default explanation');
  assert.equal(await freshPage.locator('[data-footer-item="default-night-legend"]').count(), 1, 'new scripts should include the default cloud');
  await defaultCard.scrollIntoViewIfNeeded();
  await defaultCard.hover();
  await defaultCard.getByRole('button', { name: 'More actions' }).click();
  await freshPage.getByRole('menuitem', { name: 'Delete' }).click();
  await defaultCard.waitFor({ state: 'detached' });
  const addExplanation = async () => {
    await freshPage.locator('[data-script-add-page="1"]').click();
    await freshPage.getByRole('dialog').getByRole('button', { name: 'Explanation', exact: true }).click();
    return freshPage.getByRole('dialog', { name: 'Edit explanation' });
  };
  let newEditor = await addExplanation();
  const newText = await newEditor.getByRole('textbox', { name: 'Explanation text' }).innerText();
  assert.ok(newText.includes('Poisoned / Drunk') && newText.includes('Madness'));
  const newEditorBody = newEditor.getByRole('textbox', { name: 'Explanation text' });
  await newEditorBody.locator('p').first().evaluate(el => {
    const selection = getSelection(), range = document.createRange();
    range.selectNodeContents(el); range.collapse(false); selection.removeAllRanges(); selection.addRange(range);
  });
  await newEditor.getByRole('combobox', { name: 'Font size' }).click();
  await freshPage.getByRole('option', { name: '28px' }).click();
  await freshPage.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Explanation text');
  await freshPage.keyboard.type('X');
  assert.equal(await newEditorBody.locator('font[style*="28px"]').innerText(), 'X', 'typing after a size change should apply the chosen size');
  await newEditorBody.locator('p').first().evaluate(el => {
    const selection = getSelection(), range = document.createRange();
    range.selectNodeContents(el); selection.removeAllRanges(); selection.addRange(range);
  });
  await newEditor.getByRole('combobox', { name: 'Font size' }).click();
  await freshPage.getByRole('option', { name: 'Custom size' }).click();
  const customSize = newEditor.getByRole('spinbutton', { name: 'Custom size' });
  await customSize.waitFor();
  await freshPage.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Custom size');
  await customSize.fill('31');
  await customSize.press('Enter');
  assert.ok((await newEditorBody.innerHTML()).includes('font-size: 31px'), 'custom sizes should format the selected text');
  await newEditor.getByRole('button', { name: 'Undo' }).click();
  assert.ok(!(await newEditorBody.innerHTML()).includes('font-size: 31px'));
  await newEditor.getByRole('button', { name: 'Redo' }).click();
  assert.ok((await newEditorBody.innerHTML()).includes('font-size: 31px'));
  await newEditor.getByRole('button', { name: 'Cancel' }).click();
  await freshPage.locator('.MuiModal-root').waitFor({ state: 'detached' });
  assert.equal(await freshPage.locator('.inline-state-rules').count(), 0, 'cancel must not add a card');
  newEditor = await addExplanation();
  await newEditor.getByRole('button', { name: 'Save', exact: true }).click();
  await freshPage.locator('.inline-state-rules').waitFor();
  const newMeta = JSON.parse(await freshPage.getByRole('textbox', { name: 'Script JSON' }).inputValue())[0];
  assert.deepEqual(Object.keys(newMeta.footer_components[0].richTextDocuments).sort(), ['cn', 'de', 'en', 'es']);

  await freshPage.evaluate(async () => {
    const request = indexedDB.open('botc-tower-images-db', 1);
    const db = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise((resolve, reject) => {
      const tx = db.transaction('tower-images', 'readwrite'), store = tx.objectStore('tower-images');
      store.clear();
      store.put({ id: 'back_tower2', url: '/imgs/images/background/back_tower2.png', x: 36, y: 0, scale: 1, opacity: 0.8, isDefault: true, createdAt: 1 });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    db.close();
    const config = JSON.parse(localStorage.getItem('botc-ui-config') || '{}');
    config.towerImagesInitialized = true; config.townSilhouetteRestored = false;
    localStorage.setItem('botc-ui-config', JSON.stringify(config));
  });
  await freshPage.reload();
  await freshPage.locator('[data-tower-item="back_town"]').waitFor();
  assert.equal(await freshPage.locator('[data-tower-item="back_tower2"]').count(), 1, 'restoring the town must preserve the existing ornament');
  await freshPage.locator('[data-script-add-page="1"]').click();
  await freshPage.getByRole('button', { name: 'Delete back_town' }).click();
  await freshPage.locator('[data-tower-item="back_town"]').waitFor({ state: 'detached' });
  await freshPage.reload();
  await freshPage.locator('#script-preview').waitFor();
  await freshPage.waitForFunction(() => JSON.parse(localStorage.getItem('botc-ui-config')).townSilhouetteRestored === true);
  assert.equal(await freshPage.locator('[data-tower-item="back_town"]').count(), 0, 'a deleted town must not be restored on every reload');
  await fresh.close();

  const dual = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const dualPage = await dual.newPage();
  await loadScript(dualPage, [{ id: '_meta', name: 'Two pages', state: [
    { stateName: 'Page One', stateDescription: 'Content One', footer_page: 1 },
    { stateName: 'Page Two', stateDescription: 'Content Two', footer_page: 2 },
  ], footer_components: [{ id: 'list-2', type: 'list', page: 2, x: 30, y: 96, width: 55,
    title: 'Second list', rows: [{ id: 'r', text: 'Second item' }] }] }, 'noble']);
  const combined = dualPage.locator('#main_script .inline-state-rules');
  assert.ok((await combined.innerText()).includes('Content One') && (await combined.innerText()).includes('Second item'));
  await combined.hover();
  await combined.getByRole('button', { name: 'Edit' }).click();
  const dualDialog = dualPage.getByRole('dialog', { name: 'Edit explanation' });
  const dualEditor = dualDialog.getByRole('textbox', { name: 'Explanation text' });
  await dualEditor.locator('p').filter({ hasText: 'Content Two' }).evaluate(el => {
    const selection = getSelection(), range = document.createRange();
    range.selectNodeContents(el); selection.removeAllRanges(); selection.addRange(range);
  });
  await dualDialog.getByRole('button', { name: 'Bold', exact: true }).click();
  await dualDialog.getByRole('button', { name: 'Save', exact: true }).click();
  await dualPage.locator('.MuiModal-root').waitFor({ state: 'detached' });
  const twoPageSwitch = dualPage.getByText('Two-Page Mode', { exact: true }).locator('..').locator('..').getByRole('switch');
  await twoPageSwitch.check();
  const secondPageCard = dualPage.locator('#footer-paper-2 .inline-state-rules');
  await secondPageCard.waitFor();
  assert.ok((await combined.innerText()).includes('Content One'));
  assert.ok(!(await combined.innerText()).includes('Content Two'));
  assert.ok((await secondPageCard.innerText()).includes('Content Two') && (await secondPageCard.innerText()).includes('Second item'));
  assert.equal(await secondPageCard.locator('strong').count(), 1);
  await secondPageCard.scrollIntoViewIfNeeded();
  const secondCardBox = await secondPageCard.boundingBox(), secondPaperBox = await dualPage.locator('#footer-paper-2').boundingBox();
  assert.ok(secondCardBox && secondPaperBox);
  await dualPage.mouse.move(secondCardBox.x + secondCardBox.width / 2, secondCardBox.y + secondCardBox.height / 2);
  await dualPage.mouse.down();
  await dualPage.mouse.move(secondPaperBox.x + secondPaperBox.width / 2, secondCardBox.y + secondCardBox.height / 2 + 8, { steps: 8 });
  const secondGuide = dualPage.locator('.footer-drag-guides [data-guide-axis="vertical"]');
  await secondGuide.waitFor({ state: 'visible' });
  const secondGuideBox = await secondGuide.boundingBox();
  assert.ok(secondGuideBox && Math.abs(secondGuideBox.y - secondPaperBox.y) < 1, 'pages without a header should retain full-height guides');
  await dualPage.mouse.up();
  await twoPageSwitch.uncheck();
  await secondPageCard.waitFor({ state: 'detached' });
  assert.ok((await combined.innerText()).includes('Content One') && (await combined.innerText()).includes('Content Two'));
  assert.equal(await combined.locator('strong').count(), 1);
  await dual.close();

  assert.deepEqual(errors, []);
  console.log('Layout interaction checks passed.');
} finally {
  await browser.close();
  await server.close();
}
