import { asset } from './utils';

/** Built-in assets are portable between a preview and the Pages project subpath. */
export function resolveMediaUrl(source?: string): string | undefined {
  if (!source) return undefined;
  if (
    source === 'asset:images/mountain-dawn.jpg' ||
    /^\/(?:ProViewPresentation\/)?images\/mountain-dawn\.jpg$/.test(source)
  ) {
    return asset('images/mountain-dawn.jpg');
  }
  // Old device-only backup references must be re-uploaded, never treated as cloud files.
  if (source.startsWith('local:')) return undefined;
  return source;
}
export function useMediaUrl(source?: string) {
  return resolveMediaUrl(source);
}
