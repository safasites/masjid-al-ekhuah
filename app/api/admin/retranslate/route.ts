import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { requireDb } from '@/lib/supabase-server';
import { translateBatch, translateText } from '@/lib/translate';

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

export async function POST(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [db, errRes] = requireDb();
  if (errRes) return errRes;
  const results = { events: 0, courses: 0, dhikr: 0, about: false };

  // Retranslate all events (overwrite existing translations)
  const { data: events } = await db
    .from('events')
    .select('id, title, description');

  if (events && events.length > 0) {
    for (const ev of events) {
      try {
        const texts = [ev.title, ev.description].filter(Boolean) as string[];
        const [arResults, kuResults] = await Promise.all([
          translateBatch(texts, 'ar'),
          translateBatch(texts, 'ckb'),
        ]);
        const hasDesc = ev.description && ev.description.length > 0;
        await db.from('events').update({
          title_ar: arResults[0] || null,
          title_ku: kuResults[0] || null,
          description_ar: hasDesc ? (arResults[1] || null) : null,
          description_ku: hasDesc ? (kuResults[1] || null) : null,
        }).eq('id', ev.id);
        results.events++;
      } catch { /* non-fatal */ }
    }
  }

  // Retranslate all courses (overwrite existing translations)
  const { data: courses } = await db
    .from('courses')
    .select('id, title, description, details');

  if (courses && courses.length > 0) {
    for (const c of courses) {
      try {
        const textsToTranslate = [c.title, c.description, c.details].filter(Boolean) as string[];
        const [arResults, kuResults] = await Promise.all([
          translateBatch(textsToTranslate, 'ar'),
          translateBatch(textsToTranslate, 'ckb'),
        ]);
        const hasDesc = Boolean(c.description);
        const hasDetails = Boolean(c.details);
        let arIdx = 0; let kuIdx = 0;
        const update: Record<string, string | null> = {
          title_ar: arResults[arIdx] || null,
          title_ku: kuResults[kuIdx] || null,
        };
        arIdx++; kuIdx++;
        if (hasDesc) { update.description_ar = arResults[arIdx] || null; update.description_ku = kuResults[kuIdx] || null; arIdx++; kuIdx++; }
        if (hasDetails) { update.details_ar = arResults[arIdx] || null; update.details_ku = kuResults[kuIdx] || null; }
        await db.from('courses').update(update).eq('id', c.id);
        results.courses++;
      } catch { /* non-fatal */ }
    }
  }

  // Retranslate all dhikr meanings (overwrite existing translations)
  const { data: dhikrItems } = await db
    .from('dhikr_items')
    .select('id, meaning_en');

  if (dhikrItems && dhikrItems.length > 0) {
    for (const d of dhikrItems) {
      try {
        const [ar] = await translateBatch([d.meaning_en], 'ar');
        const [ku] = await translateBatch([d.meaning_en], 'ckb');
        await db.from('dhikr_items').update({
          meaning_ar: ar || null,
          meaning_ku: ku || null,
        }).eq('id', d.id);
        results.dhikr++;
      } catch { /* non-fatal */ }
    }
  }

  // Retranslate about description if not yet translated
  const { data: aboutRows } = await db
    .from('content')
    .select('key, value')
    .in('key', ['about_desc', 'about_desc_ar', 'about_desc_ku']);

  const aboutDesc = aboutRows?.find(r => r.key === 'about_desc')?.value;
  const aboutAr = aboutRows?.find(r => r.key === 'about_desc_ar')?.value;
  const aboutKu = aboutRows?.find(r => r.key === 'about_desc_ku')?.value;

  if (aboutDesc && (!aboutAr || !aboutKu)) {
    try {
      const [arText, kuText] = await Promise.all([
        translateText(aboutDesc, 'ar'),
        translateText(aboutDesc, 'ckb'),
      ]);
      await db.from('content').upsert([
        { key: 'about_desc_ar', value: arText, updated_at: new Date().toISOString() },
        { key: 'about_desc_ku', value: kuText, updated_at: new Date().toISOString() },
      ], { onConflict: 'key' });
      results.about = true;
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ ok: true, translated: results });
}
