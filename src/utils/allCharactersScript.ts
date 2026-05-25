import { generateScript } from './scriptGenerator';
import { CHARACTERS_EN } from '../data/canonicalCharacters';
import type { Script } from '../types';
import type { Language } from './languages';

const CORE_TEAMS = new Set(['townsfolk', 'outsider', 'minion', 'demon']);
const TEAM_ORDER = ['townsfolk', 'outsider', 'minion', 'demon'];

export function buildAllCharactersScript(language: Language): Script {
  const coreEntries = Object.values(CHARACTERS_EN)
    .filter(c => CORE_TEAMS.has(c.team))
    .sort((a, b) => {
      const teamDiff = TEAM_ORDER.indexOf(a.team) - TEAM_ORDER.indexOf(b.team);
      if (teamDiff !== 0) return teamDiff;
      return (a.ability || '').length - (b.ability || '').length;
    })
    .map(c => ({ id: c.id }));

  const travelerEntries = Object.values(CHARACTERS_EN)
    .filter(c => c.team === 'traveler')
    .sort((a, b) => (a.ability || '').length - (b.ability || '').length)
    .map(c => ({ id: c.id }));

  const json = JSON.stringify([
    { id: '_meta', name: '全员谜语人 · Oops! All Amnesiacs', titleEn: '"Oops! All Amnesiacs"' },
    ...coreEntries,
    ...travelerEntries,
  ]);

  return generateScript(json, language);
}
