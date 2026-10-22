import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { reflowText, makeSlides, moveItem, songCredit } from '../../src/lib/utils';
import { findPassage, type BibleBook } from '../../src/lib/bible';
import { createSeed } from '../../src/lib/seed';
import { isWorkspace } from '../../src/lib/validation';
import { normalizeUser } from '../../src/lib/backend';
import { timeString } from '../../src/lib/live';

describe('smart text flow', () => {
  it('does not make empty slides', () => expect(reflowText('  \n\n  ')).toEqual([]));
  it('keeps paragraph boundaries', () =>
    expect(reflowText('A moment to breathe.\n\nA moment to listen.', 28)).toEqual([
      'A moment to breathe.',
      'A moment to listen.',
    ]));
  it('keeps intentional lyric line breaks', () =>
    expect(reflowText('Amazing grace\nHow sweet the sound', 28)).toEqual([
      'Amazing grace\nHow sweet the sound',
    ]));
  it('splits at words without losing or duplicating text', () => {
    const text = Array.from({ length: 119 }, (_, index) => `word${index}`).join(' ');
    const result = reflowText(text, 17);
    expect(result).toHaveLength(7);
    expect(result.every((slide) => slide.split(/\s+/).length <= 17)).toBe(true);
    expect(result.join(' ')).toBe(text);
  });
  it('clamps unsafe word counts', () => {
    expect(reflowText('one two three four five six', 0)).toHaveLength(1);
    expect(reflowText('one two three four five six', -10)).toHaveLength(2);
    expect(reflowText('one two three four five six', NaN)).toHaveLength(1);
  });
  it('creates uniquely identified slides with theme, credits, and size', () => {
    const slides = makeSlides('one two three four\n\nfive six seven eight', 'forest', 4, 56, 'KJV');
    expect(slides).toHaveLength(2);
    expect(slides[0].id).not.toBe(slides[1].id);
    expect(slides[0]).toMatchObject({ theme: 'forest', fontSize: 56, credit: 'KJV', label: 'Slide 1' });
  });
});

describe('service ordering and credits', () => {
  it('reorders immutably', () => {
    const items = ['a', 'b', 'c'];
    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(items).toEqual(['a', 'b', 'c']);
  });
  it('ignores invalid moves', () => {
    const items = ['a', 'b'];
    expect(moveItem(items, -1, 1)).toBe(items);
    expect(moveItem(items, 0, 7)).toBe(items);
  });
  it('combines song details and the church licence', () =>
    expect(
      songCredit({ title: 'An original', author: 'Alex', copyright: '© 2026 Alex', ccli: '123' }, '456'),
    ).toBe('An original · Alex · © 2026 Alex · CCLI Song #123 · CCLI Licence #456'));
  it('does not invent missing credits', () =>
    expect(songCredit({ title: 'A hymn', author: '', copyright: 'Public domain', ccli: '' })).toBe(
      'A hymn · Public domain',
    ));
});

const kjv = JSON.parse(readFileSync('public/bibles/kjv.json', 'utf8')) as BibleBook[];
const asv = JSON.parse(readFileSync('public/bibles/asv.json', 'utf8')) as BibleBook[];
describe('complete Bible lookup', () => {
  it('ships 66 books in each on-demand library', () => {
    expect(kjv).toHaveLength(66);
    expect(asv).toHaveLength(66);
    expect(
      kjv.reduce((count, book) => count + book.chapters.reduce((sum, chapter) => sum + chapter.length, 0), 0),
    ).toBe(31102);
  });
  it('finds a single verse', () =>
    expect(findPassage(kjv, 'John 3:16', 'kjv').verses[0].text).toContain('For God so loved the world'));
  it('supports verse ranges with different dashes and abbreviations', () => {
    expect(findPassage(kjv, 'Phil 4:6–7', 'kjv').verses).toHaveLength(2);
    expect(findPassage(kjv, '1 Cor 13:4-7', 'kjv').verses).toHaveLength(4);
  });
  it('finds a complete chapter and the selected translation', () => {
    const passage = findPassage(asv, 'Psalm 23', 'asv');
    expect(passage.verses).toHaveLength(6);
    expect(passage.translation).toBe('asv');
    expect(passage.verses[0].text).toContain('Jehovah');
  });
  it('reports malformed or out-of-range references', () => {
    for (const query of ['a made-up book 2:3', 'John 0:1', 'John 99', 'John 3:200', 'John 3:9-2', 'John'])
      expect(() => findPassage(kjv, query, 'kjv')).toThrow();
  });
});

describe('safe workspace restoration', () => {
  it('accepts the complete seeded workspace', () => expect(isWorkspace(createSeed())).toBe(true));
  it('rejects partial and malformed nested data', () => {
    const workspace = createSeed();
    (workspace.services[0].items[0] as unknown as { slides: unknown }).slides = [null];
    expect(isWorkspace(workspace)).toBe(false);
    expect(
      isWorkspace({ schemaVersion: 1, services: [], media: [], songs: [], settings: { churchName: 'Fake' } }),
    ).toBe(false);
  });
  it('rejects unsafe media schemes', () => {
    const workspace = createSeed();
    workspace.media[0].url = 'javascript:alert(1)';
    expect(isWorkspace(workspace)).toBe(false);
  });
  it('rejects invalid dates and themes', () => {
    const workspace = createSeed();
    workspace.services[0].date = '2026-02-31';
    expect(isWorkspace(workspace)).toBe(false);
  });
  it('rejects duplicate top-level IDs', () => {
    const workspace = createSeed();
    workspace.services.push(workspace.services[0]);
    expect(isWorkspace(workspace)).toBe(false);
  });
  it('never shares mutable demo masters', () => {
    const a = createSeed();
    const b = createSeed();
    a.services[0].items[0].slides[0].text = 'Edited';
    expect(b.services[0].items[0].slides[0].text).toBe('Welcome home.');
  });
});

describe('authentication response contract', () => {
  it('normalizes direct and wrapped SDK account responses', () => {
    expect(normalizeUser({ user: { id: 'user-one', email: 'a@church.org' } })).toMatchObject({
      id: 'user-one',
      email: 'a@church.org',
      mode: 'cloud',
    });
    expect(normalizeUser({ data: { user: { _id: 'two', email: 'b@church.org' } } }).id).toBe('two');
  });
  it('does not fabricate accounts from errors or empty responses', () => {
    expect(() => normalizeUser({ success: false })).toThrow();
    expect(() => normalizeUser(null)).toThrow();
  });
});

describe('stage timing', () => {
  it('formats elapsed time and never displays negative countdowns', () => {
    expect(timeString(65.9)).toBe('01:05');
    expect(timeString(-8)).toBe('00:00');
    expect(timeString(3661)).toBe('61:01');
  });
});
