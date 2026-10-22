import type { Slide, ThemeId } from './types';

export const uid = () => crypto.randomUUID();
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
export const formatDate = (date: string, options?: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(
    'en-AU',
    options || { weekday: 'short', day: 'numeric', month: 'short' },
  );
export const formatSize = (size: number) =>
  size < 1024 * 1024 ? `${Math.round(size / 1024)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

/** Wrap at word boundaries; preserve paragraph breaks without empty slides. */
export function reflowText(text: string, maxWords = 28): string[] {
  const limit = Math.max(4, Math.min(120, Math.round(maxWords) || 28));
  const paragraphs = text
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean);
  const slides: string[] = [];
  for (const paragraph of paragraphs) {
    const lines = paragraph.trim().split(/\n/);
    let current: string[] = [];
    let count = 0;
    for (const line of lines) {
      const words = line.trim().split(/\s+/).filter(Boolean);
      while (words.length) {
        const room = limit - count;
        const chunk = words.splice(0, room);
        current.push(chunk.join(' '));
        count += chunk.length;
        if (count >= limit) {
          slides.push(current.join('\n'));
          current = [];
          count = 0;
        }
      }
    }
    if (current.length) slides.push(current.join('\n'));
  }
  return slides;
}

export function makeSlides(
  text: string,
  theme: ThemeId = 'mountain',
  maxWords = 28,
  fontSize = 48,
  credit?: string,
): Slide[] {
  return reflowText(text, maxWords).map((content, index) => ({
    id: uid(),
    text: content,
    theme,
    fontSize,
    label: `Slide ${index + 1}`,
    credit,
  }));
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const result = [...items];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

export const themes: { id: ThemeId; name: string; description: string }[] = [
  { id: 'mountain', name: 'First light', description: 'A little perspective. A fresh beginning.' },
  { id: 'forest', name: 'Still waters', description: 'Quiet greens with room to breathe.' },
  { id: 'sand', name: 'Golden hour', description: 'Warm, welcoming, and full of light.' },
  { id: 'midnight', name: 'After hours', description: 'Deep blues. A clear focus.' },
  { id: 'lavender', name: 'Selah', description: 'A gentle pause in the everyday.' },
  { id: 'light', name: 'Simply said', description: 'Nothing between you and the message.' },
];

export function songCredit(
  song: { title: string; author: string; copyright: string; ccli: string },
  license = '',
) {
  return [
    song.title,
    song.author,
    song.copyright,
    song.ccli && `CCLI Song #${song.ccli}`,
    license && `CCLI Licence #${license}`,
  ]
    .filter(Boolean)
    .join(' · ');
}
