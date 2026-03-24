import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { requireDb } from '@/lib/supabase-server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

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

const BUCKET = 'mosque-media';
const LOGO_PATH = 'logo/mosque-logo.webp';

// POST — upload a new mosque logo
export async function POST(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 });

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP files are allowed' }, { status: 400 });
  }

  const [db, errRes] = requireDb();
  if (errRes) return errRes;

  // Resize to max 80×80 px and convert to WebP for small file size
  const rawBytes = await file.arrayBuffer();
  let uploadBytes: Buffer;
  try {
    uploadBytes = await sharp(Buffer.from(rawBytes))
      .resize({ width: 80, height: 80, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    uploadBytes = Buffer.from(rawBytes);
  }

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(LOGO_PATH, uploadBytes, { contentType: 'image/webp', upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(LOGO_PATH);
  // Append cache-busting timestamp so the browser re-fetches after a new upload
  const url = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: contentError } = await db
    .from('content')
    .upsert({ key: 'logo_url', value: url, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (contentError) return NextResponse.json({ error: contentError.message }, { status: 500 });
  return NextResponse.json({ url });
}

// DELETE — remove the logo
export async function DELETE(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [db, errRes] = requireDb();
  if (errRes) return errRes;

  await db.storage.from(BUCKET).remove([LOGO_PATH]);
  await db.from('content').delete().eq('key', 'logo_url');
  return NextResponse.json({ ok: true });
}
