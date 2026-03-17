import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createServerSupabase } from '@/lib/supabase-server';

function getSecret() {
  return new TextEncoder().encode(
    process.env.ADMIN_SESSION_SECRET ?? 'mosque-dev-secret-change-before-deploy'
  );
}

async function auth(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value;
  if (!token) return false;
  try { await jwtVerify(token, getSecret()); return true; } catch { return false; }
}

export async function GET() {
  const db = createServerSupabase();
  const { data, error } = await db.from('content').select('key, value');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Return as an object { key: value, ... }
  const obj: Record<string, string> = {};
  (data || []).forEach((r: { key: string; value: string }) => { obj[r.key] = r.value; });
  return NextResponse.json(obj);
}

export async function PUT(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Body: { key: string, value: string } OR array of { key, value }
  const body = await req.json();
  const db = createServerSupabase();

  const updates = Array.isArray(body) ? body : [body];
  const { error } = await db.from('content').upsert(
    updates.map((u: { key: string; value: string }) => ({
      key: u.key,
      value: u.value,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'key' }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
