/**
 * jsonSafety.ts — Defensive JSON parsing & type normalization for script data.
 *
 * All external JSON (user input, localStorage cache, URL params, file imports)
 * MUST pass through these utilities before touching business logic or React render.
 *
 * Principles:
 *   1. Never trust JSON.parse output — validate structure before use.
 *   2. Normalize at the boundary — business code sees only safe shapes.
 *   3. Never crash on bad data — return error objects, not thrown exceptions.
 *   4. Preserve user input — don't clear localStorage on parse errors.
 */

// ── Safe JSON parse ──────────────────────────────────────────────────────

export interface SafeParseOk<T> {
  ok: true;
  value: T;
}

export interface SafeParseErr {
  ok: false;
  message: string;
}

export type SafeParseResult<T> = SafeParseOk<T> | SafeParseErr;

/**
 * Parse JSON safely. Returns { ok: true, value } or { ok: false, message }.
 * NEVER throws — always returns a result object.
 */
export function safeJsonParse<T = unknown>(input: string): SafeParseResult<T> {
  if (typeof input !== 'string') {
    return { ok: false, message: `Expected a JSON string, got ${typeof input}` };
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, message: 'JSON input is empty' };
  }
  try {
    const value = JSON.parse(trimmed) as T;
    return { ok: true, value };
  } catch (error) {
    const msg = error instanceof SyntaxError ? error.message : String(error);
    // Extract line/column info if present
    const match = msg.match(/at position (\d+)/);
    const friendly = match
      ? `JSON syntax error at position ${match[1]}: ${msg}`
      : `JSON syntax error: ${msg}`;
    return { ok: false, message: friendly };
  }
}

// ── Type guards & safe casts ──────────────────────────────────────────────

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asString(value: unknown, fallback: string = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && isFinite(value)) return String(value);
  return fallback;
}

export function asNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (isFinite(n)) return n;
  }
  return fallback;
}

export function asBoolean(value: unknown, fallback: boolean = false): boolean {
  if (typeof value === 'boolean') return value;
  return fallback;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === 'string');
}

export function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
}

/**
 * Normalize an image field (string | string[] | undefined | null) to a single URL string.
 * Takes the first valid URL if array, returns string as-is, falls back to empty string.
 */
export function normalizeImageUrl(image: unknown): string {
  if (Array.isArray(image)) {
    const first = image.find((x): x is string => typeof x === 'string' && x.length > 0);
    return first || '';
  }
  if (typeof image === 'string' && image.length > 0) {
    return image;
  }
  return '';
}

/**
 * Normalize an image field, returning undefined if missing/invalid (for fallback logic).
 */
export function normalizeImageUrlOrUndefined(image: unknown): string | undefined {
  const result = normalizeImageUrl(image);
  return result || undefined;
}

// ── Script JSON entry normalization ──────────────────────────────────────

export interface NormalizedScriptEntry {
  id: string;
  name?: string;
  ability?: string;
  team?: string;
  teamColor?: string;
  image?: string;
  firstNight?: number;
  otherNight?: number;
  firstNightReminder?: string;
  otherNightReminder?: string;
  reminders?: string[];
  remindersGlobal?: string[];
  setup?: boolean;
  // _meta fields (only on the meta entry)
  author?: string;
  logo?: string;
  background?: string;
  titleImage?: string;
  titleImageSize?: number;
  use_title_image?: boolean;
  show_title_flourish?: boolean;
  playerCount?: string;
  second_page_title?: boolean;
  second_page_title_text?: string;
  second_page_title_image?: string;
  second_page_title_font_size?: number;
  second_page_title_image_size?: number;
  use_second_page_title_image?: boolean;
  second_page_ppl_table1?: boolean;
  second_page_ppl_table2?: boolean;
  second_page_order?: string;
  name_en?: string;
  nameEn?: string;
  // special_rule fields
  title?: unknown;
  content?: unknown;
  rules?: unknown;
  // jinx fields
  jinx?: unknown[];
  // state/status fields
  state?: unknown[];
  status?: unknown[];
  // Allow other passthrough fields
  [key: string]: unknown;
}

export interface NormalizeResult {
  items: NormalizedScriptEntry[];
  warnings: string[];
}

/**
 * Normalize raw parsed JSON array into safe script entries.
 *
 * - Rejects null/undefined/non-object entries (string IDs are promoted).
 * - Normalizes image to always be a string.
 * - Collects warnings instead of crashing.
 */
export function normalizeScriptJsonInput(raw: unknown): NormalizeResult {
  const warnings: string[] = [];

  if (!Array.isArray(raw)) {
    return {
      items: [],
      warnings: [`JSON top-level must be an array, got: ${typeof raw}`],
    };
  }

  const items: NormalizedScriptEntry[] = [];

  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i];

    // String entries → promote to { id }
    if (typeof entry === 'string') {
      if (entry.length > 0) {
        items.push({ id: entry });
      } else {
        warnings.push(`[${i}] empty string entry skipped`);
      }
      continue;
    }

    // Reject null, numbers, booleans, arrays
    if (!isRecord(entry)) {
      warnings.push(`[${i}] invalid entry (${typeof entry}), skipped`);
      continue;
    }

    // Require at least an id
    const id = asString(entry.id);
    if (!id) {
      warnings.push(`[${i}] missing id field, skipped`);
      continue;
    }

    const normalized: NormalizedScriptEntry = { id };

    // String fields
    for (const key of ['name', 'ability', 'team', 'teamColor',
      'firstNightReminder', 'otherNightReminder',
      'author', 'logo', 'background', 'titleImage',
      'playerCount', 'second_page_title_text', 'second_page_title_image',
      'second_page_order', 'name_en', 'nameEn']) {
      const val = (entry as Record<string, unknown>)[key];
      if (val !== undefined && val !== null) {
        (normalized as Record<string, unknown>)[key] = asString(val);
      }
    }

    // image — normalize to single string (this is the klutzbanana fix)
    if ('image' in entry) {
      normalized.image = normalizeImageUrl(entry.image);
    }

    // Number fields
    for (const key of ['firstNight', 'otherNight', 'titleImageSize',
      'second_page_title_font_size', 'second_page_title_image_size']) {
      const val = (entry as Record<string, unknown>)[key];
      if (val !== undefined && val !== null) {
        (normalized as Record<string, unknown>)[key] = asNumber(val);
      }
    }

    // Boolean fields
    for (const key of ['setup', 'use_title_image', 'show_title_flourish',
      'second_page_title', 'use_second_page_title_image',
      'second_page_ppl_table1', 'second_page_ppl_table2']) {
      const val = (entry as Record<string, unknown>)[key];
      if (val !== undefined) {
        (normalized as Record<string, unknown>)[key] = asBoolean(val);
      }
    }

    // Array fields — must actually be arrays
    for (const key of ['reminders', 'remindersGlobal']) {
      const val = (entry as Record<string, unknown>)[key];
      if (val !== undefined) {
        (normalized as Record<string, unknown>)[key] = asStringArray(val);
      }
    }

    // Passthrough complex fields (title, content, rules, jinx, state, status)
    for (const key of ['title', 'content', 'rules', 'jinx', 'state', 'status']) {
      const val = (entry as Record<string, unknown>)[key];
      if (val !== undefined) {
        (normalized as Record<string, unknown>)[key] = val;
      }
    }

    items.push(normalized);
  }

  return { items, warnings };
}

/**
 * Full defensive parse pipeline: JSON string → safe normalized entries.
 */
export function safeParseScriptJson(jsonString: string): NormalizeResult & { parseError?: string } {
  const parsed = safeJsonParse<unknown>(jsonString);
  if (!parsed.ok) {
    return { items: [], warnings: [], parseError: parsed.message };
  }

  const result = normalizeScriptJsonInput(parsed.value);
  return { ...result, parseError: undefined };
}

// ── localStorage helpers ─────────────────────────────────────────────────

const LS_SCRIPT_KEY = 'botc-script-data';
const LS_SCRIPT_VERSION = 2;

export interface CachedScriptData {
  version: number;
  originalJson: string;
  normalizedJson: string;
  customTitle: string;
  customAuthor: string;
  timestamp: number;
}

/**
 * Load cached script data from localStorage with version check.
 * Returns null if missing, outdated version, or malformed.
 * Never throws.
 */
export function loadCachedScriptData(): CachedScriptData | null {
  try {
    const raw = localStorage.getItem(LS_SCRIPT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Version check — migrate old v1 data, discard truly broken versions
    if (!parsed || typeof parsed.version !== 'number' || parsed.version < LS_SCRIPT_VERSION) {
      // v1: no version field — migrate the data instead of discarding
      if (parsed && !parsed.version && (parsed.originalJson || parsed.script)) {
        console.warn('[jsonSafety] Migrating v1 cached data to v2');
        return {
          version: LS_SCRIPT_VERSION,
          originalJson: typeof parsed.originalJson === 'string' ? parsed.originalJson : '',
          normalizedJson: typeof parsed.normalizedJson === 'string' ? parsed.normalizedJson : '',
          customTitle: typeof parsed.customTitle === 'string' ? parsed.customTitle : '',
          customAuthor: typeof parsed.customAuthor === 'string' ? parsed.customAuthor : '',
          timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
        };
      }
      console.warn(`[jsonSafety] Cached data version ${parsed?.version} < ${LS_SCRIPT_VERSION}, discarding`);
      localStorage.removeItem(LS_SCRIPT_KEY);
      return null;
    }

    return {
      version: parsed.version,
      originalJson: typeof parsed.originalJson === 'string' ? parsed.originalJson : '',
      normalizedJson: typeof parsed.normalizedJson === 'string' ? parsed.normalizedJson : '',
      customTitle: typeof parsed.customTitle === 'string' ? parsed.customTitle : '',
      customAuthor: typeof parsed.customAuthor === 'string' ? parsed.customAuthor : '',
      timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : 0,
    };
  } catch {
    // Corrupted localStorage → clean it up
    try { localStorage.removeItem(LS_SCRIPT_KEY); } catch { /* ignore */ }
    return null;
  }
}

/**
 * Save script data to localStorage with version stamp.
 * Handles QuotaExceededError by trimming normalizedJson.
 */
export function saveCachedScriptData(data: Omit<CachedScriptData, 'version' | 'timestamp'>): void {
  const payload: CachedScriptData = {
    ...data,
    version: LS_SCRIPT_VERSION,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(LS_SCRIPT_KEY, JSON.stringify(payload));
  } catch (error: unknown) {
    const err = error as { name?: string; code?: number };
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      console.warn('[jsonSafety] localStorage quota exceeded, saving without normalizedJson');
      try {
        localStorage.setItem(LS_SCRIPT_KEY, JSON.stringify({
          ...payload,
          normalizedJson: '', // drop large derived data
        }));
      } catch {
        console.error('[jsonSafety] Still unable to save to localStorage');
      }
    } else {
      console.warn('[jsonSafety] Failed to save to localStorage:', error);
    }
  }
}
