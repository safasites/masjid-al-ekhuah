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

async function autoTranslate(db: NonNullable<ReturnType<typeof createServerSupabase>>, id: string, title: string, description: string) {
  try {
    const texts = [title, description].filter(Boolean);
    const [textsAr, textsKu] = await Promise.all([
      translateBatch(texts, 'ar'),
      translateBatch(texts, 'ckb'),
    ]);
    const hasDesc = Boolean(description);
    await db.from('books').update({
      title_ar: textsAr[0] || null,
      title_ku: textsKu[0] || null,
      description_ar: hasDesc ? (textsAr[1] || null) : null,
      description_ku: hasDesc ? (textsKu[1] || null) : null,
    }).eq('id', id);
  } catch {
    // Translation failure is non-fatal
  }
}

export async function GET() {
  const [db, errRes] = requireDb();
  if (errRes) return errRes;
  const { data, error } = await db
    .from('books')
    .select('*, category:book_categories(id,name,name_ar,name_ku)')
    .order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const [db, errRes] = requireDb();
  if (errRes) return errRes;
  const { data, error } = await db.from('books').insert([body]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  autoTranslate(db, data.id, data.title, data.description ?? '');
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, ...body } = await req.json();
  const [db, errRes] = requireDb();
  if (errRes) return errRes;
  const { data, error } = await db.from('books').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  const [db, errRes] = requireDb();
  if (errRes) return errRes;
  const { error } = await db.from('books').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
