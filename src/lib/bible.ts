import { asset } from './utils';

export type Translation = 'kjv' | 'asv';
export type BibleBook = { name: string; abbrev: string; chapters: string[][] };
export type Passage = {
  reference: string;
  translation: Translation;
  verses: { number: number; text: string }[];
};
export const translations = [
  { id: 'kjv' as const, name: 'King James Version', short: 'KJV' },
  { id: 'asv' as const, name: 'American Standard Version', short: 'ASV' },
];
const cache = new Map<Translation, Promise<BibleBook[]>>();
export function loadBible(translation: Translation): Promise<BibleBook[]> {
  if (!cache.has(translation)) {
    const request = fetch(asset(`bibles/${translation}.json`))
      .then(async (response) => {
        if (!response.ok)
          throw new Error('The Bible library couldn’t load. Please check your connection and try again.');
        return (await response.json()) as BibleBook[];
      })
      .catch((error) => {
        cache.delete(translation);
        throw error;
      });
    cache.set(translation, request);
  }
  return cache.get(translation)!;
}
const aliases: Record<string, string> = {
  ps: 'psalms',
  psa: 'psalms',
  psalm: 'psalms',
  prov: 'proverbs',
  song: 'song of solomon',
  'song of songs': 'song of solomon',
  gen: 'genesis',
  ex: 'exodus',
  lev: 'leviticus',
  num: 'numbers',
  deut: 'deuteronomy',
  josh: 'joshua',
  matt: 'matthew',
  mt: 'matthew',
  mk: 'mark',
  lk: 'luke',
  jn: 'john',
  rom: 'romans',
  phil: 'philippians',
  '1 cor': '1 corinthians',
  '2 cor': '2 corinthians',
  rev: 'revelation',
};
const normalize = (text: string) => text.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
export function findPassage(books: BibleBook[], query: string, translation: Translation): Passage {
  const match = query.trim().match(/^(.+?)\s+(\d+)(?:\s*:\s*(\d+)(?:\s*[-–—]\s*(\d+))?)?$/);
  if (!match) throw new Error('Try a reference like “John 3:16–17”, “Psalm 23”, or “1 Corinthians 13:4–7”.');
  const [, rawBook, rawChapter, rawStart, rawEnd] = match;
  const name = aliases[normalize(rawBook)] || normalize(rawBook);
  const exact = books.find((book) => normalize(book.name) === name || normalize(book.abbrev) === name);
  const possible = exact ? [exact] : books.filter((book) => normalize(book.name).startsWith(name));
  if (possible.length !== 1)
    throw new Error('We couldn’t identify that book. Please use its full name, like “John” or “1 John”.');
  const book = possible[0];
  const chapter = Number(rawChapter);
  if (chapter < 1 || chapter > book.chapters.length)
    throw new Error(`${book.name} has ${book.chapters.length} chapters. Choose a chapter in that range.`);
  const verses = book.chapters[chapter - 1];
  const start = rawStart ? Number(rawStart) : 1;
  const end = rawEnd ? Number(rawEnd) : rawStart ? start : verses.length;
  if (start < 1 || end > verses.length || end < start)
    throw new Error(`${book.name} ${chapter} has ${verses.length} verses. Choose a valid verse range.`);
  return {
    reference: `${book.name} ${chapter}:${start}${end !== start ? `–${end}` : ''}`,
    translation,
    verses: verses.slice(start - 1, end).map((text, i) => ({ number: start + i, text })),
  };
}
