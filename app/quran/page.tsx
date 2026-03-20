import SurahGrid from './SurahGrid';

export const revalidate = 86400;

export interface Chapter {
  id: number;
  revelation_place: 'makkah' | 'madinah';
  name_simple: string;
  name_arabic: string;
  translated_name: { name: string };
  verses_count: number;
  bismillah_pre: boolean;
}

async function getChapters(): Promise<Chapter[]> {
  try {
    const res = await fetch('https://api.quran.com/api/v4/chapters?language=en', {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.chapters ?? [];
  } catch {
    return [];
  }
}

export default async function QuranPage() {
  const chapters = await getChapters();
  return <SurahGrid chapters={chapters} />;
}
