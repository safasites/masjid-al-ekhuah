import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { requireDb } from '@/lib/supabase-server';
import { translateText } from '@/lib/translate';

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
  const [db, errRes] = requireDb();
  if (errRes) return errRes;
  const { data, error } = await db.from('content').select('key, value');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const obj: Record<string, string> = {};
  (data || []).forEach((r: { key: string; value: string }) => { obj[r.key] = r.value; });
  return NextResponse.json(obj);
}

export async function PUT(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const [db, errRes] = requireDb();
  if (errRes) return errRes;

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

  // Auto-translate about_desc when it's updated
  const aboutUpdate = updates.find((u: { key: string; value: string }) => u.key === 'about_desc');
  if (aboutUpdate?.value) {
    (async () => {
      try {
        const [arText, kuText] = await Promise.all([
          translateText(aboutUpdate.value, 'ar'),
          translateText(aboutUpdate.value, 'ckb'),
        ]);
        await db.from('content').upsert([
          { key: 'about_desc_ar', value: arText, updated_at: new Date().toISOString() },
          { key: 'about_desc_ku', value: kuText, updated_at: new Date().toISOString() },
        ], { onConflict: 'key' });
      } catch {
        // Non-fatal
      }
    })();
  }

  return NextResponse.json({ ok: true });
}
