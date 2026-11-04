import { isSameCharacter, toOfficialEnCharacterId } from './characterIdMapping';

/**
 * Identity helpers for characters.
 *
 * A script can be written by hand, and `id` is optional in practice: entries may be a
 * bare `"noble"` string, an object with an `id`, or a custom character with no `id` at
 * all. Treating "no id" as a value (`undefined === undefined`) makes every id-less
 * character look like the same character, which silently merges or drops them.
 *
 * These helpers are the single place where that rule lives:
 * - an empty/absent id never matches another character by id;
 * - exact ids win over normalized ids (`fang_gu` <-> `fanggu`);
 * - live objects are matched by reference, which is the only reliable key when a
 *   character has no id yet.
 */

interface Identifiable {
  id?: string | null;
}

/** A character id only identifies something when it is a non-empty string. */
export function hasCharacterId(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Does `candidateId` refer to `key`? Empty ids never match.
 * Exact match wins, then the normalized comparison used across the app.
 */
export function matchesCharacterId(candidateId: unknown, key: unknown): boolean {
  if (!hasCharacterId(candidateId) || !hasCharacterId(key)) return false;
  if (candidateId === key) return true;
  return isSameCharacter(candidateId, key);
}

/**
 * Resolve `key` (a live object, an id string, or nothing) to an index in `items`.
 *
 * - object  → reference first, then its id
 * - string  → exact id, then normalized id
 * - empty   → the first entry that has no id (never "any entry", and never `undefined === undefined`)
 *
 * Returns -1 when nothing matches.
 */
export function findCharacterIndex<T extends Identifiable>(
  items: readonly T[],
  key: T | string | null | undefined,
): number {
  if (key === null || key === undefined) {
    return items.findIndex(item => !hasCharacterId(item.id));
  }

  if (typeof key !== 'string') {
    const byReference = items.indexOf(key);
    if (byReference !== -1) return byReference;
    return findCharacterIndex(items, key.id);
  }

  const exact = items.findIndex(item => hasCharacterId(item.id) && item.id === key);
  if (exact !== -1) return exact;

  return items.findIndex(item => matchesCharacterId(item.id, key));
}

/** Ids of raw JSON entries (`"noble"` or `{ id: 'noble' }`), for {@link findCharacterIndex}. */
export function jsonEntryIds(items: readonly unknown[]): Identifiable[] {
  return items.map(item => {
    if (typeof item === 'string') return { id: item };
    if (item && typeof item === 'object' && 'id' in item) {
      const id = (item as { id?: unknown }).id;
      return { id: typeof id === 'string' ? id : undefined };
    }
    return { id: undefined };
  });
}

export interface CharacterIdIssues {
  /** Ids used by more than one character (exact or normalized), with the display id. */
  duplicates: Array<{ id: string; count: number }>;
  /** Characters that have no id at all, by display name. */
  missing: Array<{ name: string }>;
}

const NON_CHARACTER_TEAMS = new Set(['a jinxed', 'special_rule']);

/**
 * Scan raw script JSON for identity problems before they silently break a script:
 * duplicated ids, ids that only differ by the known aliases (fang_gu / fanggu),
 * and character entries without an id.
 */
export function analyzeJsonCharacterIds(items: readonly unknown[]): CharacterIdIssues {
  const groups = new Map<string, { id: string; count: number }>();
  const missing: Array<{ name: string }> = [];

  for (const item of items) {
    const entry = typeof item === 'string' ? { id: item, name: undefined } : (item as Record<string, unknown> | null);
    if (!entry) continue;
    if (entry.id === '_meta') continue;
    if (typeof entry.team === 'string' && NON_CHARACTER_TEAMS.has(entry.team)) continue;

    const id = typeof entry.id === 'string' ? entry.id.trim() : '';

    if (!id) {
      missing.push({ name: typeof entry.name === 'string' && entry.name ? entry.name : '(unnamed)' });
      continue;
    }

    const key = toOfficialEnCharacterId(id);
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { id, count: 1 });
    }
  }

  return {
    duplicates: [...groups.values()].filter(group => group.count > 1),
    missing,
  };
}
