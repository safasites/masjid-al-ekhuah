import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createServerSupabase, requireDb } from '@/lib/supabase-server';
import { translateBatch } from '@/lib/translate';

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

/** Auto-translate meaning_en into Arabic and Kurdish, then update the row. */
async function autoTranslate(db: NonNullable<ReturnType<typeof createServerSupabase>>, id: string, meaning: string) {
  try {
    const [ar, ku] = await Promise.all([
      translateBatch([meaning], 'ar'),
      translateBatch([meaning], 'ckb'),
    ]);
    await db.from('dhikr_items').update({
      meaning_ar: ar[0] || null,
      meaning_ku: ku[0] || null,
    }).eq('id', id);
  } catch {
    // Translation failure is non-fatal
  }
}

export async function GET(req: NextRequest) {
  const [db, errRes] = requireDb();
  if (errRes) return errRes;
  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === 'true';
  let query = db.from('dhikr_items').select('*').order('sort_order');
  if (!all) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const [db, errRes] = requireDb();
  if (errRes) return errRes;
  const { data, error } = await db.from('dhikr_items').insert([body]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  autoTranslate(db, data.id, data.meaning_en);
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, ...body } = await req.json();
  const [db, errRes] = requireDb();
  if (errRes) return errRes;
  const { data, error } = await db.from('dhikr_items').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (body.meaning_en) autoTranslate(db, id, body.meaning_en);
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const [db, errRes] = requireDb();
  if (errRes) return errRes;
  const { error } = await db.from('dhikr_items').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
