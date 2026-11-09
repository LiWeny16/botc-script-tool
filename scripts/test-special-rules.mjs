import assert from 'node:assert/strict';
import { createServer } from 'vite';

// The generator's config store reads browser preferences during import.
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.window = {
  location: { search: '', hash: '', pathname: '/' },
  history: { replaceState: () => {} },
  addEventListener: () => {},
};
Object.defineProperty(globalThis, 'navigator', { value: { language: 'en' }, configurable: true });

const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { generateScript } = await server.ssrLoadModule('/src/utils/scriptGenerator.ts');
  const scrolls = [
    { id: 'first', team: 'special_rule', title: 'First scroll', content: 'First text' },
    { id: 'second', team: 'special_rule', title: 'Second scroll', rules: [{ title: 'Item', content: 'Item text' }] },
  ];
  const generate = (meta) => generateScript(JSON.stringify([meta, ...scrolls]), 'en');

  const onlyScrolls = generate({ id: '_meta', name: 'Test' });
  assert.deepEqual(onlyScrolls.specialRules.map((rule) => rule.id), ['first', 'second']);
  assert.deepEqual(onlyScrolls.secondPageRules.map((rule) => rule.id), ['first', 'second']);
  assert.equal(onlyScrolls.specialRules[1].rules[0].content, 'Item text');

  const withStates = generate({
    id: '_meta',
    name: 'Test',
    state: [{ stateName: 'State one', stateDescription: 'One' }, { stateName: 'State two', stateDescription: 'Two' }],
  });
  assert.deepEqual(withStates.specialRules.map((rule) => rule.id), ['first', 'second']);
  assert.deepEqual(withStates.secondPageRules.map((rule) => rule.id), ['_meta_state_0', '_meta_state_1', 'first', 'second']);
  assert.deepEqual(withStates.secondPageRules.filter((rule) => rule.isState).map((rule) => rule.title), ['State one', 'State two']);
  const statusOnly = generateScript(JSON.stringify([{ id: '_meta', status: [{ name: 'Poisoned', skill: 'No ability' }] }]), 'en');
  assert.equal(statusOnly.specialRules.length, 0);
  assert.equal(statusOnly.secondPageRules[0].title, 'Poisoned');
  const { scriptStore } = await server.ssrLoadModule('/src/stores/ScriptStore.ts');
  scriptStore.setOriginalJson(JSON.stringify([{ id: '_meta' }, ...scrolls]));
  scriptStore.setScript(withStates);
  const normalized = JSON.parse(scriptStore.normalizedJson);
  assert.equal(normalized[0].state.length, 2);
  assert.equal(normalized.find((item) => item.id === 'second').rules[0].content, 'Item text');
  const { upgradeSpecialRuleTypography } = await server.ssrLoadModule('/src/utils/specialRuleTypography.ts');
  assert.deepEqual(upgradeSpecialRuleTypography({ specialRuleTitleFontSize: '1rem', specialRuleContentFontSize: '0.85rem' }), {
    specialRuleTitleFontSize: '1.5rem', specialRuleContentFontSize: '1.15rem', specialRuleTypographyVersion: 3,
  });
  assert.deepEqual(upgradeSpecialRuleTypography({ specialRuleTitleFontSize: '1.1rem', specialRuleContentFontSize: '0.9rem' }), {
    specialRuleTitleFontSize: '1.1rem', specialRuleContentFontSize: '0.9rem', specialRuleTypographyVersion: 3,
  });
  assert.equal(upgradeSpecialRuleTypography({ specialRuleTypographyVersion: 2, specialRuleTitleFontSize: '1rem' }).specialRuleTitleFontSize, '1rem');
  assert.equal(upgradeSpecialRuleTypography({ specialRuleTypographyVersion: 1, specialRuleTitleFontSize: '1.25rem' }).specialRuleTitleFontSize, '1.5rem');
  assert.equal(upgradeSpecialRuleTypography({ specialRuleTypographyVersion: 2, specialRuleContentFontSize: '1.05rem' }).specialRuleContentFontSize, '1.15rem');
  const { normalizeHeaderLayout } = await server.ssrLoadModule('/src/utils/headerLayout.ts');
  const layout = normalizeHeaderLayout({ title: { x: 42, y: -18 }, rule: { x: 600, minHeight: -20, widthDelta: 30 } });
  assert.deepEqual(layout.title, { x: 42, y: -18, widthDelta: 0, minHeight: 0, scale: 1 });
  assert.deepEqual(layout.rule, { x: 600, y: 0, widthDelta: 30, minHeight: 0, scale: 1 });
  assert.deepEqual(layout.titleMobile, { x: 0, y: 0, widthDelta: 0, minHeight: 0, scale: 1 });
  assert.equal(normalizeHeaderLayout({ design: { scale: 9 } }).design.scale, 1.5);
  assert.equal(normalizeHeaderLayout({ author: { scale: 0.1 } }).author.scale, 0.6);
  const { snapHeaderMove, clampRectMove, unionHeaderRects } = await server.ssrLoadModule('/src/utils/headerAlignment.ts');
  const snapped = snapHeaderMove({ left: 10, right: 30, top: 10, bottom: 30 }, 39, 0, [60], [100]);
  assert.equal(snapped.dx, 40);
  assert.equal(snapped.vertical, 60);
  assert.equal(snapped.horizontal, null);
  const border = { left: 0, right: 100, top: 0, bottom: 100 };
  const item = { left: 20, right: 60, top: 10, bottom: 40 };
  assert.deepEqual(clampRectMove(item, border, -100, -100), { dx: -20, dy: -10 });
  assert.deepEqual(clampRectMove(item, border, 100, 100), { dx: 40, dy: 60 });
  assert.deepEqual(unionHeaderRects(item, { left: 15, right: 70, top: 4, bottom: 43 }), { left: 15, right: 70, top: 4, bottom: 43 });
  const { measureHeaderLayoutBounds } = await server.ssrLoadModule('/src/utils/headerLayoutBounds.ts');
  const page = { offsetWidth: 1000, getBoundingClientRect: () => ({ left: 100, right: 600, top: 20, bottom: 900, width: 500 }) };
  const root = { getBoundingClientRect: () => ({ bottom: 900 }), querySelector: () => ({ getBoundingClientRect: () => ({ top: 180 }) }) };
  const headerBounds = measureHeaderLayoutBounds(root, page);
  assert.equal(headerBounds.screen.bottom, 180);
  assert.equal(headerBounds.layout.bottom, 320);
  const withDivider = { ...root, querySelector: selector => ({ getBoundingClientRect: () => selector.includes('gap-divider') ? { top: 190, height: 28 } : { top: 180 } }) };
  assert.equal(measureHeaderLayoutBounds(withDivider, page, 'authorLine').screen.bottom, 204);
  assert.equal(measureHeaderLayoutBounds(withDivider, page, 'title').screen.bottom, 180);
  const { normalizeLegendLayout, nudgeFooterComponentLayout, resetFooterComponentLayout } = await server.ssrLoadModule('/src/utils/footerLayout.ts');
  const oldLegend = { id: 'old', type: 'nightLegend', page: 1, x: 25, y: 10, width: 50 };
  const cloud = normalizeLegendLayout(oldLegend);
  assert.equal(cloud.x, 41.5);
  assert.equal(cloud.width, 17);
  assert.equal(cloud.y, 0);
  assert.equal(cloud.cloudOnly, true);
  assert.deepEqual(normalizeLegendLayout(cloud), cloud);
  assert.equal(nudgeFooterComponentLayout(cloud, 'ArrowUp', 10, 1000), null);
  assert.equal(resetFooterComponentLayout(oldLegend).cloudOnly, true);
  const { buildExplanationDocument, normalizeExplanationDocument, resolveExplanationDocument } = await server.ssrLoadModule('/src/utils/explanationRichText.ts');
  const merged = buildExplanationDocument(
    [{ id: 'one', title: { en: 'Drunk', cn: '醉酒' }, content: { en: 'First', cn: '第一条' } }, { id: 'two', title: 'Madness', content: 'Second' }],
    [{ id: 'legacy', type: 'list', page: 1, x: 0, y: 0, width: 50, title: 'Old list', rows: [{ id: 'row', text: 'Kept row' }] }], 'en');
  assert.equal(merged.nodes.length, 6);
  assert.equal(resolveExplanationDocument({ id: 'state', type: 'stateLayout', page: 1, x: 0, y: 0, width: 82, hidden: true }, [], [], 'en'), null);
  const untrusted = { kind: 'botc-rich-text', version: 1, nodes: [
    { type: 'text', text: '<literal>' },
    { type: 'element', tag: 'script', children: [{ type: 'text', text: 'bad' }] },
    { type: 'element', tag: 'span', style: { color: 'url(javascript:bad)', backgroundColor: '#ffff00', fontFamily: 'bad;url(x)' }, children: [{ type: 'text', text: 'safe' }] },
  ] };
  const safeDocument = normalizeExplanationDocument(untrusted);
  assert.equal(safeDocument.nodes.length, 2);
  assert.deepEqual(safeDocument.nodes[1].style, { backgroundColor: '#ffff00' });
  const { deepStripHtml } = await server.ssrLoadModule('/src/utils/richTextEditorUtils.ts');
  const cleaned = deepStripHtml([{ id: '_meta', footer_components: [{ richTextDocuments: { en: untrusted } }] }, { ability: '<b>plain</b>' }]);
  assert.equal(cleaned[0].footer_components[0].richTextDocuments.en.nodes[0].text, '<literal>');
  assert.equal(cleaned[1].ability, 'plain');
  const footer = [
    { id: 'legend', type: 'nightLegend', page: 1, x: 25, y: 0, width: 50, text: '* Except 1st night' },
    { id: 'list', type: 'list', page: 1, x: 30, y: 96, width: 55, title: 'Weather', columns: 2, rows: [{ id: 'one', text: 'Storm' }] },
    { id: 'image', type: 'image', page: 1, x: 2, y: 0, width: 8, url: 'data:image/png;base64,AAAA' },
  ];
  scriptStore.setFooterComponents(footer);
  const saved = JSON.parse(scriptStore.originalJson);
  const exported = JSON.parse(scriptStore.normalizedJson);
  assert.deepEqual(saved[0].footer_components, footer);
  assert.deepEqual(exported[0].footer_components, footer);
  assert.deepEqual(generateScript(JSON.stringify(exported), 'en').footerComponents, footer);
  assert.equal(exported[0].state.length, 2);
  const placed = [{ id: '_meta', state: [
    { stateName: 'One', stateDescription: 'First', footer_page: 1 },
    { stateName: 'Two', stateDescription: 'Second', footer_page: 2 },
  ] }];
  scriptStore.setOriginalJson(JSON.stringify(placed));
  scriptStore.setScript(generateScript(JSON.stringify(placed), 'en'));
  assert.deepEqual(scriptStore.script.secondPageRules.map(rule => rule.footerPage), [1, 2]);
  assert.deepEqual(JSON.parse(scriptStore.normalizedJson)[0].state.map(rule => rule.footer_page), [1, 2]);
  scriptStore.removeSpecialRule(scriptStore.script.secondPageRules[0]);
  assert.equal(scriptStore.script.secondPageRules[0].sourceIndex, 0);
  scriptStore.removeSpecialRule(scriptStore.script.secondPageRules[0]);
  assert.equal(JSON.parse(scriptStore.originalJson)[0].state, undefined);
  console.log('Special rule parsing checks passed.');
} finally {
  await server.close();
}
