import { supabase } from './supabase';

const MAX_BYTES = 2 * 1024 * 1024; // 2MB per user

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
    return { ok: true, id: existing.id }; // No change, skip save
  }

  // Check quota
  const { data: usage } = await supabase.rpc('get_storage_usage', { p_user_id: user.id }) as { data: number };
  const currentUsage = typeof usage === 'number' ? usage : 0;
  if (currentUsage + sizeBytes > MAX_BYTES && (!existing || existing.content_hash === contentHash)) {
    // If it's an update to existing, we free old space
    const oldSize = existing ? 0 : 0; // approximate — old record gets deleted below
    if (currentUsage + sizeBytes > MAX_BYTES) {
      return { ok: false, error: 'Storage quota exceeded (2MB). Delete old scripts first.' };
    }
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

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function listScripts(): Promise<CloudScript[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('user_scripts')
    .select('id, name, size_bytes, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(100);

  return (data || []) as CloudScript[];
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
  return !error;
}

export async function getStorageUsage(): Promise<{ used: number; max: number }> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return { used: 0, max: MAX_BYTES };
  const { data } = await supabase.rpc('get_storage_usage', { p_user_id: user.id }) as { data: number };
  return { used: typeof data === 'number' ? data : 0, max: MAX_BYTES };
}

export async function shareScript(name: string, json: string): Promise<string | null> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;

  const shareId = crypto.randomUUID().slice(0, 8);
  const { error } = await supabase.from('shared_scripts').insert({
    share_id: shareId,
    user_id: user.id,
    name,
    script: JSON.parse(json),
  });

  if (error) return null;
  return shareId;
}

export async function loadSharedScript(shareId: string): Promise<{ name: string; json: string } | null> {
  const { data } = await supabase
    .from('shared_scripts')
    .select('name, script')
    .eq('share_id', shareId)
    .single();

  if (!data) return null;
  return {
    name: data.name,
    json: JSON.stringify(data.script, null, 2),
  };
}
