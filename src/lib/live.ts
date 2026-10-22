import type { LiveState } from './types';

export const liveStorageKey = (channel: string) => `pv.output.${channel}`;
export const liveChannelName = (channel: string) => `proview-${channel}`;
export function readLiveState(channel: string): LiveState | null {
  try {
    const value = JSON.parse(localStorage.getItem(liveStorageKey(channel)) || 'null');
    if (value && typeof value.updatedAt === 'number' && typeof value.isLive === 'boolean')
      return value as LiveState;
  } catch {
    /* A cleared or incomplete state is just a disconnected output. */
  }
  return null;
}
export function publishLiveState(channel: string, state: LiveState, broadcast?: BroadcastChannel | null) {
  const current = { ...state, updatedAt: Date.now() };
  broadcast?.postMessage(current);
  try {
    localStorage.setItem(liveStorageKey(channel), JSON.stringify(current));
  } catch {
    /* BroadcastChannel remains available if browser storage is full. */
  }
}
export function outputUrl(kind: 'output' | 'stage', channel: string) {
  return `${window.location.origin}${window.location.pathname}#/${kind}/${encodeURIComponent(channel)}`;
}
export function timeString(seconds: number) {
  const absolute = Math.max(0, Math.floor(seconds));
  return `${Math.floor(absolute / 60)
    .toString()
    .padStart(2, '0')}:${(absolute % 60).toString().padStart(2, '0')}`;
}
