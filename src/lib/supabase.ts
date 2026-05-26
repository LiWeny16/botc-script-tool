import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder');

export const SUPABASE_URL = url;
export const isConfigured = !!(url && anonKey);
