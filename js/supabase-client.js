/*
 * Supabase client initialization.
 * Uses the global window.supabase from the CDN script.
 * Fetches config from /api/config endpoint (served by Express).
 */
let supabaseInstance = null;

async function initSupabase() {
  if (supabaseInstance) return supabaseInstance;

  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    if (res.ok) {
      const config = await res.json();
      if (config.supabaseUrl && config.supabaseAnonKey && window.supabase) {
        supabaseInstance = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
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

function getSupabase() {
  return supabaseInstance;
}
