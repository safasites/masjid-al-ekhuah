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
  const { data, error } = await db.from('courses').select('*').order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const db = createServerSupabase();
  const { data, error } = await db.from('courses').insert([body]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, ...body } = await req.json();
  const db = createServerSupabase();
  const { data, error } = await db.from('courses').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  const db = createServerSupabase();
  const { error } = await db.from('courses').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
