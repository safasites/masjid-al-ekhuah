import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export const revalidate = 3600; // Re-fetch from Aladhan API at most once per hour

export async function GET() {
  try {
    // Get calculation method from Supabase content table (admin-configurable)
    const db = createServerSupabase();
    if (!db) throw new Error('Supabase not configured');
    const { data: methodRows } = await db
      .from('content')
      .select('key, value')
      .in('key', ['prayer_method', 'prayer_school']);

    const methodMap: Record<string, string> = {};
    (methodRows || []).forEach((r: { key: string; value: string }) => {
      methodMap[r.key] = r.value;
    });

    const method = methodMap['prayer_method'] ?? '1'; // 1 = Karachi (Hanafi)
    const school = methodMap['prayer_school'] ?? '1';  // 1 = Hanafi Asr

    // Fetch prayer times from Aladhan API for Birmingham UK
    const url = `https://api.aladhan.com/v1/timingsByCity?city=Birmingham&country=UK&method=${method}&school=${school}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      throw new Error(`Aladhan API error: ${res.status}`);
    }

    const json = await res.json();
    const timings = json.data.timings;
    const date = json.data.date;

    // Fetch jamat times from Supabase
    const { data: jamatRows } = await db.from('jamat_times').select('prayer, time');
    const jamatMap: Record<string, string> = {};
    (jamatRows || []).forEach((r: { prayer: string; time: string }) => {
      jamatMap[r.prayer] = r.time;
    });

    return NextResponse.json({
      prayers: [
        { id: 'fajr',    azan: timings.Fajr,    jamat: jamatMap['fajr']    ?? '' },
        { id: 'dhuhr',   azan: timings.Dhuhr,   jamat: jamatMap['dhuhr']   ?? '' },
        { id: 'asr',     azan: timings.Asr,     jamat: jamatMap['asr']     ?? '' },
        { id: 'maghrib', azan: timings.Maghrib, jamat: jamatMap['maghrib'] ?? '' },
        { id: 'isha',    azan: timings.Isha,    jamat: jamatMap['isha']    ?? '' },
      ],
      jumuah: jamatMap['jumuah'] ?? '',
      hijri: `${date.hijri.day} ${date.hijri.month.en} ${date.hijri.year}`,
      gregorian: date.gregorian.date,
    });
  } catch (err) {
    console.error('[prayer-times]', err);
    // Return fallback static times so the page still renders
    return NextResponse.json({
      prayers: [
        { id: 'fajr',    azan: '05:45', jamat: '06:00 AM' },
        { id: 'dhuhr',   azan: '12:22', jamat: '01:30 PM' },
        { id: 'asr',     azan: '15:30', jamat: '05:15 PM' },
        { id: 'maghrib', azan: '17:24', jamat: '5 mins after Azan' },
        { id: 'isha',    azan: '18:59', jamat: '09:15 PM' },
      ],
      jumuah: '01:15 PM',
      hijri: '',
      gregorian: '',
    });
  }
}
