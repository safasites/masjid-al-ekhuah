import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createServerSupabase } from '@/lib/supabase-server';
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

/** Auto-translate title and description into Arabic and Kurdish, then update the row. */
async function autoTranslate(db: ReturnType<typeof createServerSupabase>, id: string, title: string, description: string) {
  try {
    const textsAr = await translateBatch([title, description].filter(Boolean), 'ar');
    const textsKu = await translateBatch([title, description].filter(Boolean), 'ckb');
    const idx = description ? 1 : -1;
    await db.from('events').update({
      title_ar: textsAr[0] || null,
      title_ku: textsKu[0] || null,
      description_ar: idx >= 0 ? (textsAr[idx] || null) : null,
      description_ku: idx >= 0 ? (textsKu[idx] || null) : null,
    }).eq('id', id);
  } catch {
    // Translation failure is non-fatal — English content still saved
  }
}

export async function GET() {
  const db = createServerSupabase();
  const { data, error } = await db.from('events').select('*').order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const db = createServerSupabase();
  const { data, error } = await db.from('events').insert([body]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Auto-translate in the background (non-blocking)
  autoTranslate(db, data.id, data.title, data.description);
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, ...body } = await req.json();
  const db = createServerSupabase();
  const { data, error } = await db.from('events').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  const db = createServerSupabase();
  const { error } = await db.from('events').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
