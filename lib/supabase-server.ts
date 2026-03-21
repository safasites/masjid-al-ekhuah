import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Create a server-side Supabase client using the service-role key.
 * Returns `null` when the required env vars are not available (e.g. during
 * static generation or on a deployment where they haven't been set yet).
 */
export function createServerSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Helper for API routes: returns the Supabase client or a 503 JSON response.
 * Usage:
 *   const [db, errRes] = requireDb();
 *   if (errRes) return errRes;
 *   // db is guaranteed to be non-null here
 */
export function requireDb(): [SupabaseClient, null] | [null, NextResponse] {
  const db = createServerSupabase();
  if (!db) {
    return [
      null,
      NextResponse.json(
        { error: 'Database not configured — Supabase environment variables are missing.' },
        { status: 503 },
      ),
    ];
  }
  return [db, null];
}
