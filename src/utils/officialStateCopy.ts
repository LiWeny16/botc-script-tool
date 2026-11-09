import type { I18nText } from '../types';

// Default state copy follows the official States reference: https://wiki.bloodontheclocktower.com/States
const LANGUAGES = ['cn', 'en', 'es', 'de'] as const;
type Language = typeof LANGUAGES[number];

const TITLES = {
  madness: {
    cn: '疯狂',
    en: 'Madness',
    es: 'Locura',
    de: 'Wahnsinn',
  },
  poisonedDrunk: {
    cn: '中毒／醉酒',
    en: 'Poisoned / Drunk',
    es: 'Envenenado / Ebrio',
    de: 'Vergiftet / Betrunken',
  },
} satisfies Record<string, Record<Language, string>>;

const CONTENT = {
  madness: {
    cn: '“疯狂”是指玩家真诚地努力让其他玩家相信某件事为真。说书人判断这份努力是否足够真诚，并依照角色能力给予相应奖励或惩罚。公开承认或明显暗示自己正在“疯狂”，可能被视为未满足要求。',
    en: 'Madness means a player is sincerely trying to convince the group that something is true. The Storyteller judges whether their effort is genuine and applies any reward or penalty described by the character ability. Openly admitting or clearly signalling madness can count as not being mad.',
    es: 'Estar loco significa que un jugador intenta sinceramente convencer al grupo de que algo es cierto. El narrador juzga si su esfuerzo es genuino y aplica la recompensa o el castigo indicados por la habilidad del personaje. Admitir abiertamente o señalar claramente la locura puede contar como no estar loco.',
    de: 'Wahnsinn bedeutet, dass ein Spieler aufrichtig versucht, die Gruppe davon zu überzeugen, dass etwas wahr ist. Die Spielleitung beurteilt, ob die Bemühung echt ist, und wendet die in der Charakterfähigkeit genannte Belohnung oder Strafe an. Wahnsinn offen zuzugeben oder deutlich darauf hinzuweisen, kann als nicht wahnsinnig gelten.',
  },
  poisonedDrunk: {
    cn: '中毒或醉酒的玩家没有能力，但仍会照常行动。说书人会假装其能力有效，并可在其获得信息时给出错误信息；玩家不会得知自己中毒或醉酒。',
    en: 'Drunk or poisoned players have no ability, but still act as if they do. The Storyteller pretends their ability works and may give them false information. They are not told they are drunk or poisoned.',
    es: 'Los jugadores ebrios o envenenados no tienen habilidad, pero actúan como si la tuvieran. El narrador finge que su habilidad funciona y puede darles información falsa. No se les dice que están ebrios o envenenados.',
    de: 'Vergiftete oder betrunkene Spieler haben keine Fähigkeit, handeln aber so, als hätten sie eine. Die Spielleitung tut so, als würde ihre Fähigkeit funktionieren, und kann ihnen falsche Informationen geben. Ihnen wird nicht gesagt, dass sie vergiftet oder betrunken sind.',
  },
} satisfies Record<string, Record<Language, string>>;

const LEGACY_CONTENT = {
  madness: {
    cn: [
      '如果你对某件事“疯狂”，你需要努力让其他玩家相信它；否则可能受到惩罚。',
      '当玩家陷入“疯狂”时，意味着他需要努力让其他玩家相信某件事为真，否则可能受到惩罚。',
    ],
    en: [
      'If you are mad about something, you must try to convince the other players it is true, or risk a penalty.',
      'When a player is mad about something, they must try to convince the other players that it is true, or they may be penalized.',
    ],
    es: [
      'Si estás loco por algo, debes intentar convencer a los demás de que es cierto o arriesgarte a una penalización.',
    ],
    de: [
      'Wenn du von etwas besessen bist, musst du versuchen, die anderen davon zu überzeugen, oder eine Strafe riskieren.',
    ],
  },
  poisonedDrunk: {
    cn: [
      '中毒或醉酒时，玩家的能力失效；说书人仍会按该能力行动，给予的信息可能错误。',
      '中毒的玩家会失去能力，但会认为自己仍具有能力。说书人会做出这些玩家仍然具有能力的行为。如果中毒玩家的角色能力会给他提供信息，说书人可能会给出错误信息。中毒的玩家不会得知自己中毒。醉酒同理。',
    ],
    en: [
      'While poisoned or drunk, a player has no ability. The Storyteller acts as if they do, but information they receive may be false.',
    ],
    es: [
      'Mientras esté envenenado o ebrio, el jugador no tiene habilidad. El narrador actúa como si la tuviera, pero puede darle información falsa.',
    ],
    de: [
      'Vergiftete oder betrunkene Spieler haben keine Fähigkeit. Die Spielleitung handelt, als hätten sie eine, kann aber falsche Informationen geben.',
    ],
  },
} satisfies Record<string, Record<Language, string[]>>;

export const OFFICIAL_STATE_COPY = {
  madness: {
    title: TITLES.madness,
    content: CONTENT.madness,
  },
  poisonedDrunk: {
    title: TITLES.poisonedDrunk,
    content: CONTENT.poisonedDrunk,
  },
} as const;

function stateKind(stateName: unknown) {
  const values = typeof stateName === 'string'
    ? [stateName]
    : stateName && typeof stateName === 'object'
      ? LANGUAGES.map((language) => (stateName as Partial<Record<Language, unknown>>)[language])
      : [];
  if (values.some((value) => typeof value === 'string' && Object.values(TITLES.madness).includes(value as never))) return 'madness';
  if (values.some((value) => typeof value === 'string' && Object.values(TITLES.poisonedDrunk).includes(value as never))) return 'poisonedDrunk';
  return null;
}

function replaceDefaultDescription(value: unknown, kind: keyof typeof CONTENT): unknown {
  if (typeof value === 'string') {
    const language = LANGUAGES.find((candidate) => LEGACY_CONTENT[kind][candidate].includes(value));
    return language ? CONTENT[kind][language] : value;
  }
  if (!value || typeof value !== 'object') return value;
  const next: Partial<Record<Language, string>> = { ...(value as Partial<Record<Language, string>>) };
  for (const language of LANGUAGES) {
    if (typeof next[language] === 'string' && LEGACY_CONTENT[kind][language].includes(next[language]!)) {
      next[language] = CONTENT[kind][language];
    }
  }
  return next as I18nText;
}

export function normalizeOfficialStateCopy(json: string): { json: string; changed: boolean } {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return { json, changed: false };
    const meta = parsed.find((entry) => entry && typeof entry === 'object' && entry.id === '_meta');
    if (!meta || !Array.isArray(meta.state)) return { json, changed: false };
    let changed = false;
    meta.state.forEach((state: { stateName?: unknown; stateDescription?: unknown }) => {
      const kind = stateKind(state.stateName);
      if (!kind || state.stateDescription === undefined) return;
      const next = replaceDefaultDescription(state.stateDescription, kind);
      if (JSON.stringify(next) !== JSON.stringify(state.stateDescription)) {
        state.stateDescription = next;
        changed = true;
      }
    });
    return changed ? { json: JSON.stringify(parsed, null, 2), changed } : { json, changed: false };
  } catch {
    return { json, changed: false };
  }
}
