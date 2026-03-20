/**
 * MyMemory free translation API utility.
 * Free tier: ~500 words/day. Set MYMEMORY_EMAIL env var to unlock 10,000 words/day.
 * Arabic coverage is excellent; Kurdish (Sorani/ckb) coverage is functional.
 * Falls back to the original text if translation fails.
 */

const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get';

async function callMyMemory(text: string, langPair: string): Promise<string> {
  try {
    const email = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : '';
    const url = `${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=${langPair}${email}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return text;
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return text;
  } catch {
    return text;
  }
}

/** Translate a single string from English to the target language.
 *  'ar'  = Arabic  |  'ckb' = Central Kurdish (Sorani dialect) */
export async function translateText(text: string, to: 'ar' | 'ckb'): Promise<string> {
  if (!text?.trim()) return text;
  const langPair = `en|${to}`;
  return callMyMemory(text, langPair);
}

/** Translate multiple strings in parallel from English to the target language. */
export async function translateBatch(texts: string[], to: 'ar' | 'ckb'): Promise<string[]> {
  return Promise.all(texts.map(t => translateText(t, to)));
}
