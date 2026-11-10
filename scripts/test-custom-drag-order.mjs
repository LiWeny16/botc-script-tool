import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, logLevel: 'silent' });
globalThis.window = { location: { pathname: '/export-render.html' } };
const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
try {
  const { generateScript } = await server.ssrLoadModule('/src/utils/scriptGenerator.ts');
  const { scriptStore } = await server.ssrLoadModule('/src/stores/ScriptStore.ts');
  const json = JSON.stringify([
    { id: '_meta', name: 'Custom order' },
    'noble',
    { id: 'test_custom_id', name: 'Custom ID', team: 'townsfolk', ability: 'Custom.', author: 'Creator' },
    { name: 'First no ID', team: 'townsfolk', ability: 'One.' },
    { name: 'Second no ID', team: 'townsfolk', ability: 'Two.' },
    'chef',
  ]);
  scriptStore.setOriginalJson(json);
  scriptStore.setScript(generateScript(json, 'en'));
  const characters = scriptStore.script.characters.townsfolk;
  const ordered = [characters[1], characters[3], characters[0], characters[2], characters[4]];
  scriptStore.reorderCharacters('townsfolk', ordered, 2);
  const expected = ['Custom ID', 'Second no ID', 'Noble', 'First no ID', 'Chef'];
  assert.deepEqual(scriptStore.script.characters.townsfolk.map(character => character.name), expected);
  const stored = JSON.parse(scriptStore.originalJson);
  assert.deepEqual(stored.slice(1).map(item => typeof item === 'string' ? item : item.name), ['Custom ID', 'Second no ID', 'noble', 'First no ID', 'chef']);
  assert.equal(stored[0].column_left_count.townsfolk, 2);
  const regenerated = generateScript(scriptStore.originalJson, 'en');
  assert.deepEqual(regenerated.characters.townsfolk.map(character => character.name), expected, 'regeneration must keep custom and id-less characters in the dragged order');
  assert.equal(regenerated.columnLeftCount.townsfolk, 2);
  console.log('Custom and id-less character order persists through JSON regeneration.');
} finally {
  await server.close();
}
