import { createClient } from '@supabase/supabase-js';

// Server-only client using the service role key — never expose to the browser.
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)'
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
