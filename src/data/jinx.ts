/**
 * Character jinx relationships — loaded from trilingual JSON sources.
 * Dictionary keys are normalized via {@link toZhCanonicalCharacterId}.
 *
 * @attribution
 *   English jinx data (jinxEn.json):
 *     https://wiki.bloodontheclocktower.com/Main_Page — Official BOTC Wiki
 *   Chinese jinx data (jinxZh.json):
 *     https://clocktower.gstonegames.com/ — 集石 (Gstone) Blood on the Clocktower
 *   Spanish jinx data (jinxEs.json):
 *     https://wiki.bloodontheclocktower.com/Main_Page — Official BOTC Wiki
 */
import type { Language } from '../utils/languages';
import { toZhCanonicalCharacterId } from './utils/characterIdMapping';
import jinxZhData from './sources/jinxZh.json';
import jinxEnData from './sources/jinxEn.json';
import jinxEsData from './sources/jinxEs.json';

export interface JinxSourceEntry {
  id: string;
  jinx: { id: string; reason: string; reasonLegacy?: string }[];
}

export type JinxVersion = 'legacy' | 'modern';
export type JinxVersionMap = Record<string, JinxVersion>;

/** 将源 JSON 转为 Record<normalizedId, Record<normalizedId, reason>> */
export function parseJinxSource(data: JinxSourceEntry[]): Record<string, Record<string, string>> {
  const dict: Record<string, Record<string, string>> = {};
  for (const entry of data) {
    const outer = toZhCanonicalCharacterId(entry.id);
    if (!dict[outer]) dict[outer] = {};
    for (const j of entry.jinx) {
      const inner = toZhCanonicalCharacterId(j.id);
      dict[outer][inner] = j.reason;
    }
  }
  return dict;
}

/** Legacy 版：有 reasonLegacy 就用它，否则 fallback 到 reason */
export function parseJinxSourceLegacy(data: JinxSourceEntry[]): Record<string, Record<string, string>> {
  const dict: Record<string, Record<string, string>> = {};
  for (const entry of data) {
    const outer = toZhCanonicalCharacterId(entry.id);
    if (!dict[outer]) dict[outer] = {};
    for (const j of entry.jinx) {
      const inner = toZhCanonicalCharacterId(j.id);
      dict[outer][inner] = j.reasonLegacy ?? j.reason;
    }
  }
  return dict;
}

const jinxZh = parseJinxSource(jinxZhData as JinxSourceEntry[]);
const jinxEn = parseJinxSource(jinxEnData as JinxSourceEntry[]);
const jinxEs = parseJinxSource(jinxEsData as JinxSourceEntry[]);

const jinxZhLegacy = parseJinxSourceLegacy(jinxZhData as JinxSourceEntry[]);
const jinxEnLegacy = parseJinxSourceLegacy(jinxEnData as JinxSourceEntry[]);
const jinxEsLegacy = parseJinxSourceLegacy(jinxEsData as JinxSourceEntry[]);

const JINX_BY_LANG: Record<Language, Record<string, Record<string, string>>> = {
  'cn': jinxZh,
  en: jinxEn,
  es: jinxEs,
  de: jinxEn,
};

const JINX_LEGACY_BY_LANG: Record<Language, Record<string, Record<string, string>>> = {
  'cn': jinxZhLegacy,
  en: jinxEnLegacy,
  es: jinxEsLegacy,
  de: jinxEnLegacy,
};

export function getJinxDictionary(language: Language): Record<string, Record<string, string>> {
  return JINX_BY_LANG[language] ?? jinxEn;
}

export function getJinxLegacyDictionary(language: Language): Record<string, Record<string, string>> {
  return JINX_LEGACY_BY_LANG[language] ?? jinxEnLegacy;
}

function normalizedPair(charA: string, charB: string): [string, string] {
  return [toZhCanonicalCharacterId(charA), toZhCanonicalCharacterId(charB)];
}

export function hasJinx(charA: string, charB: string, language: Language = 'cn'): boolean {
  const data = getJinxDictionary(language);
  const [ka, kb] = normalizedPair(charA, charB);
  if (ka in data && kb in data[ka]) return true;
  if (kb in data && ka in data[kb]) return true;
  return false;
}

export function getJinx(
  charA: string,
  charB: string,
  language: Language = 'cn',
  jinxVersion?: JinxVersionMap,
): string {
  const dataModern = getJinxDictionary(language);
  const dataLegacy = jinxVersion ? getJinxLegacyDictionary(language) : null;
  const [ka, kb] = normalizedPair(charA, charB);

  // Either character set to legacy → use legacy text
  const useLegacy = jinxVersion && (
    jinxVersion[ka] === 'legacy' || jinxVersion[kb] === 'legacy'
  );

  // Check ka->kb direction
  if (ka in dataModern && kb in dataModern[ka]) {
    if (useLegacy && dataLegacy && ka in dataLegacy && kb in dataLegacy[ka]) {
      return dataLegacy[ka][kb];
    }
    return dataModern[ka][kb];
  }

  // Check kb->ka direction
  if (kb in dataModern && ka in dataModern[kb]) {
    if (useLegacy && dataLegacy && kb in dataLegacy && ka in dataLegacy[kb]) {
      return dataLegacy[kb][ka];
    }
    return dataModern[kb][ka];
  }

  return '';
}
