import { supabase } from './supabase';

const MAX_BYTES = 2 * 1024 * 1024; // 2MB per user
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

export interface CloudScript {
  id: string;
  name: string;
  script: unknown;
  size_bytes: number;
  updated_at: string;
}

// --- cache ---

let _scriptsCache: { list: CloudScript[]; ts: number } | null = null;
let _storageCache: { used: number; max: number; ts: number } | null = null;

export function invalidateCache() {
  _scriptsCache = null;
  _storageCache = null;
}

// --- CRUD ---

export async function saveScript(name: string, json: string): Promise<{ ok: boolean; error?: string; id?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not logged in' };

  const contentHash = hash(json);
  const sizeBytes = new TextEncoder().encode(json).length;

  // Check if identical content already saved (dedup)
  const { data: existing } = await supabase
    .from('user_scripts')
    .select('id, content_hash')
    .eq('user_id', user.id)
    .eq('name', name)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && existing.content_hash === contentHash) {
    return { ok: true, id: existing.id };
  }

  // Check quota — always fetch fresh for writes to avoid over-quota bugs
  const { data: usage } = await supabase.rpc('get_storage_usage', { p_user_id: user.id }) as { data: number };
  const currentUsage = typeof usage === 'number' ? usage : 0;
  if (currentUsage + sizeBytes > MAX_BYTES) {
    return { ok: false, error: 'Storage quota exceeded (2MB). Delete old scripts first.' };
  }

  // Delete old version if updating
  if (existing) {
    await supabase.from('user_scripts').delete().eq('id', existing.id);
  }

  const { data, error } = await supabase
    .from('user_scripts')
    .insert({
      user_id: user.id,
      name,
      script: JSON.parse(json),
      content_hash: contentHash,
      size_bytes: sizeBytes,
    })
    .select('id')
    .single();

  if (error) {
    // Still invalidate — partial state may have changed
    invalidateCache();
    return { ok: false, error: error.message };
  }

  invalidateCache();
  return { ok: true, id: data.id };
}

export async function listScripts(force = false): Promise<CloudScript[]> {
  if (!force && _scriptsCache && Date.now() - _scriptsCache.ts < CACHE_TTL) {
    return _scriptsCache.list;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    _scriptsCache = { list: [], ts: Date.now() };
    return [];
  }

  const { data } = await supabase
    .from('user_scripts')
    .select('id, name, size_bytes, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(100);

  const list = (data || []) as CloudScript[];
  _scriptsCache = { list, ts: Date.now() };
  return list;
}

export async function loadScript(id: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_scripts')
    .select('script')
    .eq('id', id)
    .single();

  if (!data) return null;
  return JSON.stringify(data.script, null, 2);
}

export async function deleteScript(id: string): Promise<boolean> {
  const { error } = await supabase.from('user_scripts').delete().eq('id', id);
  invalidateCache();
  return !error;
}

export async function getStorageUsage(force = false): Promise<{ used: number; max: number }> {
  if (!force && _storageCache && Date.now() - _storageCache.ts < CACHE_TTL) {
    return _storageCache;
  }

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    _storageCache = { used: 0, max: MAX_BYTES, ts: Date.now() };
    return _storageCache;
  }
  const { data } = await supabase.rpc('get_storage_usage', { p_user_id: user.id }) as { data: number };
  _storageCache = { used: typeof data === 'number' ? data : 0, max: MAX_BYTES, ts: Date.now() };
  return _storageCache;
}

// --- sharing ---

export async function shareScript(name: string, json: string): Promise<string | null> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;

  const contentHash = hash(json);

  // Dedup: same user + same content → return existing share_id
  const { data: existing } = await supabase
    .from('shared_scripts')
    .select('share_id, expires_at')
    .eq('user_id', user.id)
    .eq('content_hash', contentHash)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.share_id;

  const shareId = crypto.randomUUID().slice(0, 8);
  const { error } = await supabase.from('shared_scripts').insert({
    share_id: shareId,
    user_id: user.id,
    name,
    script: JSON.parse(json),
    content_hash: contentHash,
  });

  if (error) return null;
  return shareId;
}

export async function loadSharedScript(shareId: string): Promise<{ name: string; json: string } | null> {
  const { data } = await supabase
    .from('shared_scripts')
    .select('name, script, expires_at')
    .eq('share_id', shareId)
    .single();

  if (!data) return null;

  // Check expiry
  if (new Date(data.expires_at) < new Date()) {
    // Clean up expired record
    await supabase.from('shared_scripts').delete().eq('share_id', shareId);
    return null;
  }

  return {
    name: data.name,
    json: JSON.stringify(data.script, null, 2),
  };
}
