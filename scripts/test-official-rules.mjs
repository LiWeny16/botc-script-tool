import assert from 'node:assert/strict';
import { createServer } from 'vite';

// Exercise the same merged dictionaries and parser used by the editor.
const server = await createServer({ server: { middlewareMode: true }, logLevel: 'silent' });
globalThis.window = { location: { pathname: '/export-render.html' } };

try {
  const { getCharacterDictionary, getCharacterInDictionary } = await server.ssrLoadModule('/src/data/canonicalCharacters.ts');
  const { getJinx, hasJinx } = await server.ssrLoadModule('/src/data/jinx.ts');
  const { isSameCharacter } = await server.ssrLoadModule('/src/data/utils/characterIdMapping.ts');
  const { generateScript } = await server.ssrLoadModule('/src/utils/scriptGenerator.ts');

  const officialExtraIds = [
    'hellslibrarian', 'bigwig', 'godofug', 'hindu', 'knaves',
    'pope', 'tor', 'ventriloquist', 'zenomancer', 'gardener',
  ];
  const formerlyMissingGermanPairs = [
    ['atheist', 'riot'], ['drunk', 'mathematician'], ['legion', 'magician'],
    ['legion', 'politician'], ['lilmonsta', 'psychopath'], ['magician', 'marionette'],
    ['marionette', 'mathematician'], ['mastermind', 'vigormortis'], ['recluse', 'sage'],
  ];

  for (const language of ['cn', 'en', 'es', 'de']) {
    const dictionary = getCharacterDictionary(language);
    for (const id of officialExtraIds) {
      assert.ok(getCharacterInDictionary(dictionary, id), `${language}: official id ${id} must resolve`);
    }
    const result = generateScript(JSON.stringify([{ id: '_meta', name: 'Official ID check' }, ...officialExtraIds]), language);
    assert.equal(result.all.length, officialExtraIds.length, `${language}: ID-only import must retain all characters`);
    assert.equal(getCharacterInDictionary(dictionary, 'gardener').team, 'loric');
    assert.ok(hasJinx('mastermind', 'vigormortis', language));
    for (const [a, b] of formerlyMissingGermanPairs) assert.ok(hasJinx(a, b, language), `${language}: ${a}/${b}`);
    if (language !== 'de') {
      assert.ok(hasJinx('barber', 'cultleader', language), 'community/legacy pairs should be retained');
    }
  }

  assert.ok(isSameCharacter('bigwig', 'bigwig_loric'));
  assert.ok(isSameCharacter('hellslibrarian', 'hells_librarian'));
  assert.match(getJinx('legion', 'magician', 'en'), /separate groups/i);
  assert.match(getJinx('legion', 'magician', 'en', { legion: 'legacy' }), /wakes with Legion/i);
  assert.match(getJinx('farmer', 'leviathan', 'en'), /alive good player/i);
  assert.doesNotMatch(getJinx('ravenkeeper', 'leviathan', 'en'), /alive good player/i);
  assert.match(getJinx('riot', 'banshee', 'cn'), /存活的善良玩家/);
  assert.match(getJinx('poppygrower', 'lilmonsta', 'cn'), /都存活/);
  assert.match(getJinx('legion', 'magician', 'de'), /getrennten Gruppen/);
  assert.match(getJinx('drunk', 'mathematician', 'es'), /número del Matemático incluye/);
  assert.match(getJinx('drunk', 'mathematician', 'de'), /Zahl des Mathematikers/);
  assert.match(getJinx('slayer', 'lleech', 'cn'), /使用能力/);

  const cn = getCharacterDictionary('cn');
  const en = getCharacterDictionary('en');
  const de = getCharacterDictionary('de');
  assert.match(getCharacterInDictionary(en, 'king').ability, /equal or outnumber/);
  assert.match(getCharacterInDictionary(en, 'balloonist').otherNightReminder, /previous night/);
  assert.match(getCharacterInDictionary(cn, 'lycanthrope').otherNightReminder, /恶魔当晚不会造成死亡/);
  assert.doesNotMatch(getCharacterInDictionary(cn, 'lycanthrope').otherNightReminder, /不会有其他玩家死亡/);
  assert.match(getCharacterInDictionary(en, 'lilmonsta').ability, /might die/);
  assert.match(getCharacterInDictionary(de, 'lycanthrope').ability, /Dämon tötet heute Nacht nicht/);
  assert.match(getCharacterInDictionary(cn, 'deusexfiasco').ability, /至少一次/);
  assert.match(getCharacterInDictionary(en, 'gardener').ability, /all players/);
  assert.equal(getCharacterInDictionary(en, 'riot').otherNight, 72);
  assert.equal(getCharacterInDictionary(en, 'riot').setup, false);
  assert.deepEqual(getCharacterInDictionary(en, 'riot').reminders, ['Day 1', 'Day 2', 'Day 3']);
  assert.match(getCharacterInDictionary(getCharacterDictionary('es'), 'riot').ability, /deben nominar/);
  assert.match(getCharacterInDictionary(de, 'marionette').ability, /guter Charakter/);
  assert.match(getCharacterInDictionary(en, 'riot').otherNightReminder, /third night/);

  const custom = generateScript(JSON.stringify([
    { id: '_meta', name: 'Custom text check' },
    { id: 'lycanthrope', ability: 'A deliberately customized ability.' },
  ]), 'en');
  assert.equal(custom.all[0].ability, 'A deliberately customized ability.');

  console.log('Official rule updates, translations, legacy pairs, imports and custom text passed.');
} finally {
  await server.close();
}
