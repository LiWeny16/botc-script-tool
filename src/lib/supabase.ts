import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxtwbqsbkrwyowblblvk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dHdicXNia3J3eW93YmxibHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDk2ODIsImV4cCI6MjA5NTM4NTY4Mn0.CxNKg_2X_2JWyqeCHXsfCAiwwyNiDvxntoNhkjFLIQ4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const isConfigured = true;
