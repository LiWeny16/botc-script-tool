import { supabase } from './supabase';

const MAX_BYTES = 2 * 1024 * 1024; // 2MB per user
const MAX_SHARES = 50; // max active shares per user
const QUOTA_MSG = 'Storage full (2MB). Contact a454888395@gmail.com to upgrade.';

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
  size_bytes: number;
  updated_at: string;
}

export async function saveScript(name: string, json: string): Promise<{ ok: boolean; error?: string; id?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sign in to save scripts.' };

  const contentHash = hash(json);
  const sizeBytes = new TextEncoder().encode(json).length;

  // Dedup: same name + same content → skip
  const { data: existing } = await supabase
    .from('user_scripts')
    .select('id, content_hash, size_bytes')
    .eq('user_id', user.id)
    .eq('name', name)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.content_hash === contentHash) {
    return { ok: true, id: existing.id };
  }

  // Quota check (account for freeing old version space)
  const { data: usage } = await supabase.rpc('get_storage_usage', { p_user_id: user.id }) as { data: number };
  const currentUsage = typeof usage === 'number' ? usage : 0;
  const oldSize = existing?.size_bytes ?? 0;
  if (currentUsage - oldSize + sizeBytes > MAX_BYTES) {
    return { ok: false, error: QUOTA_MSG };
  }

  // Delete old version
  if (existing) {
    await supabase.from('user_scripts').delete().eq('id', existing.id);
  }

  const { data, error } = await supabase
    .from('user_scripts')
    .insert({ user_id: user.id, name, script: JSON.parse(json), content_hash: contentHash, size_bytes: sizeBytes })
    .select('id').single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function listScripts(): Promise<CloudScript[]> {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return [];
    const { data } = await supabase
      .from('user_scripts')
      .select('id, name, size_bytes, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(100);
    return (data || []) as CloudScript[];
  } catch {
    return [];
  }
}

export async function loadScript(id: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('user_scripts').select('script').eq('id', id).single();
    return data ? JSON.stringify(data.script, null, 2) : null;
  } catch {
    return null;
  }
}

export async function deleteScript(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('user_scripts').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function getStorageUsage(): Promise<{ used: number; max: number }> {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { used: 0, max: MAX_BYTES };
    const { data } = await supabase.rpc('get_storage_usage', { p_user_id: user.id }) as { data: number };
    return { used: typeof data === 'number' ? data : 0, max: MAX_BYTES };
  } catch {
    return { used: 0, max: MAX_BYTES };
  }
}

export async function shareScript(name: string, json: string): Promise<{ ok: boolean; error?: string; id?: string }> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return { ok: false, error: 'Sign in to share scripts.' };

  const contentHash = hash(json);

  // Dedup: same user + same content with valid expiry → return existing
  const { data: existing } = await supabase
    .from('shared_scripts')
    .select('share_id')
    .eq('user_id', user.id)
    .eq('content_hash', contentHash)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return { ok: true, id: existing.share_id };

  // Check share count limit
  const { count } = await supabase
    .from('shared_scripts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('expires_at', new Date().toISOString());

  if (count && count >= MAX_SHARES) {
    return { ok: false, error: `Max ${MAX_SHARES} active shares. Old shares expire in 3 days.` };
  }

  const shareId = crypto.randomUUID().slice(0, 8);
  const { error } = await supabase.from('shared_scripts').insert({
    share_id: shareId, user_id: user.id, name, script: JSON.parse(json), content_hash: contentHash,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: shareId };
}

export async function loadSharedScript(shareId: string): Promise<{ name: string; json: string } | null> {
  try {
    const { data } = await supabase
      .from('shared_scripts').select('name, script, expires_at').eq('share_id', shareId).single();
    if (!data) return null;
    if (new Date(data.expires_at) < new Date()) {
      await supabase.from('shared_scripts').delete().eq('share_id', shareId);
      return null;
    }
    return { name: data.name, json: JSON.stringify(data.script, null, 2) };
  } catch {
    return null;
  }
}
