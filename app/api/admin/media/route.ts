import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { requireDb } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const BUCKET = 'mosque-media';

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

// POST — upload image for event, course, or book
// Body: multipart/form-data { file, entity: 'event'|'course'|'book', entityId }
export async function POST(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get('file')     as File   | null;
  const entity   = formData.get('entity')   as string | null;
  const entityId = formData.get('entityId') as string | null;

  if (!file || !entity || !entityId) {
    return NextResponse.json({ error: 'file, entity, and entityId are required' }, { status: 400 });
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images are allowed' }, { status: 400 });
  }

  const ext      = file.name.split('.').pop() ?? 'jpg';
  const fileName = `${entity}-${entityId}-${Date.now()}.${ext}`;
  const bytes    = await file.arrayBuffer();

  const [db, errRes] = requireDb();
  if (errRes) return errRes;

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(fileName, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(fileName);
  const imageUrl = urlData.publicUrl;

  // Update the record's image_url column
  const tableMap: Record<string, string> = { event: 'events', course: 'courses', book: 'books' };
  const table = tableMap[entity];
  if (!table) return NextResponse.json({ error: 'Unknown entity type' }, { status: 400 });

  const { error: updateError } = await db.from(table).update({ image_url: imageUrl }).eq('id', entityId);
  if (updateError) {
    // Attempt storage cleanup on DB failure
    await db.storage.from(BUCKET).remove([fileName]);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ image_url: imageUrl, file_name: fileName }, { status: 201 });
}

// DELETE — remove image from storage and clear image_url on the record
// Body: { fileName, entity: 'event'|'course'|'book', entityId }
export async function DELETE(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { fileName, entity, entityId } = await req.json();
  const [db, errRes] = requireDb();
  if (errRes) return errRes;

  if (fileName) {
    await db.storage.from(BUCKET).remove([fileName]);
  }

  const tableMap: Record<string, string> = { event: 'events', course: 'courses', book: 'books' };
  const table = tableMap[entity];
  if (table && entityId) {
    await db.from(table).update({ image_url: null }).eq('id', entityId);
  }

  return NextResponse.json({ ok: true });
}
