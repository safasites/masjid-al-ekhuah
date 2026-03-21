import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { requireDb } from '@/lib/supabase-server';

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

// GET — returns the currently active timetable
export async function GET() {
  const [db, errRes] = requireDb();
  if (errRes) return errRes;
  const { data, error } = await db
    .from('timetable')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? null);
}

// POST — upload a new timetable image (multipart/form-data)
export async function POST(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const label = formData.get('label') as string | null;

  if (!file || !label) {
    return NextResponse.json({ error: 'file and label are required' }, { status: 400 });
  }

  // Validate file type
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or PDF files are allowed' }, { status: 400 });
  }

  const [db, errRes] = requireDb();
  if (errRes) return errRes;
  const fileName = `timetable-${Date.now()}.${file.name.split('.').pop()}`;
  const bytes = await file.arrayBuffer();

  // Upload to Supabase Storage
  const { error: uploadError } = await db.storage
    .from('timetable-images')
    .upload(fileName, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = db.storage.from('timetable-images').getPublicUrl(fileName);
  const imageUrl = urlData.publicUrl;

  // Deactivate all previous timetables
  await db.from('timetable').update({ is_active: false }).eq('is_active', true);

  // Insert new active timetable record
  const { data, error } = await db
    .from('timetable')
    .insert([{ label, image_url: imageUrl, is_active: true }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE — remove a timetable record (and optionally its storage file)
export async function DELETE(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, fileName } = await req.json();
  const [db, errRes] = requireDb();
  if (errRes) return errRes;

  if (fileName) {
    await db.storage.from('timetable-images').remove([fileName]);
  }
  const { error } = await db.from('timetable').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
