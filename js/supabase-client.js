import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export async function initSupabase() {
  if (supabaseInstance) return supabaseInstance;

  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    if (res.ok) {
      const config = await res.json();
      if (config.supabaseUrl && config.supabaseAnonKey) {
        supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey, {
          auth: { persistSession: true, autoRefreshToken: true },
        });
        return supabaseInstance;
      }
    }
  } catch (err) {
    console.error('Failed to load Supabase config:', err);
  }

  console.error('Supabase configuration could not be loaded.');
  return null;
}

export function getSupabase() {
  return supabaseInstance;
}

export default supabaseInstance;
