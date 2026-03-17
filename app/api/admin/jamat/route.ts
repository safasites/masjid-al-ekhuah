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
  const { data, error } = await db.from('jamat_times').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Body is an array: [{ prayer: 'fajr', time: '06:00 AM' }, ...]
  const updates: { prayer: string; time: string }[] = await req.json();
  const db = createServerSupabase();

  // Upsert all jamat times at once
  const { error } = await db.from('jamat_times').upsert(
    updates.map(u => ({ prayer: u.prayer, time: u.time, updated_at: new Date().toISOString() })),
    { onConflict: 'prayer' }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
