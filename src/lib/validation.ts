import type { WorkspaceData } from './types';

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as RecordValue) : {};
const text = (value: unknown, max = 10000): value is string =>
  typeof value === 'string' && value.length <= max;
const optionalText = (value: unknown, max = 10000) => value === undefined || text(value, max);
const numeric = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const theme = (value: unknown) =>
  typeof value === 'string' &&
  ['mountain', 'forest', 'sand', 'midnight', 'lavender', 'light'].includes(value);
const id = (value: unknown): value is string => text(value, 250) && value.trim().length > 0;
const safeUrl = (value: unknown) =>
  text(value, 4000) &&
  (/^https?:\/\//i.test(value) ||
    /^\/(?!\/)/.test(value) ||
    /^local:[\w-]+$/.test(value) ||
    value === 'asset:images/mountain-dawn.jpg');
function list(value: unknown, validate: (value: unknown) => boolean, maximum = 10000): boolean {
  if (!Array.isArray(value) || value.length > maximum || !value.every(validate)) return false;
  const ids = value.map((item) => record(item).id);
  return new Set(ids).size === ids.length;
}
function slide(value: unknown): boolean {
  const data = record(value);
  return (
    id(data.id) &&
    text(data.text, 20000) &&
    theme(data.theme) &&
    numeric(data.fontSize, 12, 120) &&
    optionalText(data.subtitle, 1000) &&
    optionalText(data.label, 300) &&
    optionalText(data.notes, 10000) &&
    optionalText(data.credit, 2000) &&
    (data.backgroundUrl === undefined || safeUrl(data.backgroundUrl)) &&
    (data.mediaType === undefined || data.mediaType === 'image' || data.mediaType === 'video')
  );
}
function serviceItem(value: unknown): boolean {
  const data = record(value);
  return (
    id(data.id) &&
    text(data.title, 300) &&
    typeof data.type === 'string' &&
    ['announcement', 'song', 'scripture', 'sermon', 'media'].includes(data.type) &&
    numeric(data.duration, 0, 1440) &&
    optionalText(data.notes, 10000) &&
    list(data.slides, slide)
  );
}
function service(value: unknown): boolean {
  const data = record(value);
  if (!text(data.date, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return false;
  const date = new Date(`${data.date}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.date) return false;
  return (
    id(data.id) &&
    text(data.title, 300) &&
    text(data.time, 5) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(data.time) &&
    text(data.description, 2000) &&
    theme(data.theme) &&
    list(data.items, serviceItem) &&
    text(data.updatedAt, 100) &&
    Number.isFinite(Date.parse(data.updatedAt))
  );
}
function song(value: unknown): boolean {
  const data = record(value);
  return (
    id(data.id) &&
    text(data.title, 300) &&
    text(data.lyrics, 20000) &&
    text(data.author, 500) &&
    text(data.copyright, 2000) &&
    text(data.ccli, 100) &&
    Array.isArray(data.tags) &&
    data.tags.length <= 30 &&
    data.tags.every((tag) => text(tag, 200))
  );
}
function media(value: unknown): boolean {
  const data = record(value);
  return (
    id(data.id) &&
    text(data.name, 500) &&
    (data.type === 'image' || data.type === 'video') &&
    safeUrl(data.url) &&
    optionalText(data.filename, 1000) &&
    numeric(data.size, 0, 100 * 1024 * 1024) &&
    text(data.createdAt, 100) &&
    Number.isFinite(Date.parse(data.createdAt))
  );
}
/** Validate all nested data before a cloud response or a backup reaches the UI. */
export function isWorkspace(value: unknown): value is WorkspaceData {
  const data = record(value);
  const settings = record(data.settings);
  return (
    data.schemaVersion === 1 &&
    list(data.services, service) &&
    list(data.songs, song) &&
    list(data.media, media) &&
    text(settings.churchName, 300) &&
    text(settings.name, 300) &&
    text(settings.ccliLicense, 100) &&
    theme(settings.defaultTheme) &&
    numeric(settings.defaultFontSize, 24, 90) &&
    numeric(settings.wordsPerSlide, 12, 120)
  );
}
