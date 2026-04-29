/**
 * 角色相克：三语言统一从 JSON 加载，字典 key 均为 {@link toZhCanonicalCharacterId}。
 */
import type { Language } from '../utils/languages';
import { toZhCanonicalCharacterId } from './utils/characterIdMapping';
import jinxZhData from './sources/jinxZh.json';
import jinxEnData from './sources/jinxEn.json';
import jinxEsData from './sources/jinxEs.json';

export interface JinxSourceEntry {
  id: string;
  jinx: { id: string; reason: string }[];
}

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

const jinxZh = parseJinxSource(jinxZhData as JinxSourceEntry[]);
const jinxEn = parseJinxSource(jinxEnData as JinxSourceEntry[]);
const jinxEs = parseJinxSource(jinxEsData as JinxSourceEntry[]);

const JINX_BY_LANG: Record<Language, Record<string, Record<string, string>>> = {
  'cn': jinxZh,
  en: jinxEn,
  es: jinxEs,
};

export function getJinxDictionary(language: Language): Record<string, Record<string, string>> {
  return JINX_BY_LANG[language] ?? jinxEn;
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

export function getJinx(charA: string, charB: string, language: Language = 'cn'): string {
  const data = getJinxDictionary(language);
  const [ka, kb] = normalizedPair(charA, charB);
  if (ka in data && kb in data[ka]) return data[ka][kb];
  if (kb in data && ka in data[kb]) return data[kb][ka];
  return '';
}
