import type { User, WorkspaceData } from './types';
import { isWorkspace } from './validation';
export { isWorkspace } from './validation';

export const backendConfig = {
  baseUrl: import.meta.env.VITE_BREAD_BASE_URL || 'https://kaidaz18.duckdns.org/api/v1/proview',
  sdkUrl: import.meta.env.VITE_BREAD_SDK_URL || 'https://kaidaz18.duckdns.org/sdk/bread-client.js',
  apiKey: import.meta.env.VITE_BREAD_PUBLIC_KEY || 'pk_live_kzIciEsEmutDNA22zmUkx14Y',
};

type RecordValue = Record<string, unknown>;
interface BreadCollection {
  create(data: RecordValue): Promise<unknown>;
  get(): Promise<unknown>;
  getById(id: string): Promise<unknown>;
  update(id: string, data: RecordValue): Promise<unknown>;
  delete(id: string): Promise<unknown>;
}
interface BreadSDK {
  auth: {
    signup(email: string, password: string): Promise<unknown>;
    login(email: string, password: string): Promise<unknown>;
    me(): Promise<unknown>;
    logout?: () => Promise<unknown>;
  };
  collection(name: string): BreadCollection;
  files: {
    upload(file: File): Promise<unknown>;
    list(): Promise<unknown>;
    delete(filename: string): Promise<unknown>;
  };
}
declare global {
  interface Window {
    BreadClient?: new (config: { baseUrl: string; apiKey: string }) => BreadSDK;
  }
}
type BreadConstructor = new (config: { baseUrl: string; apiKey: string }) => BreadSDK;
// A classic SDK may declare `class BreadClient` in the global lexical scope
// without assigning window.BreadClient. Support both documented script forms.
declare const BreadClient: BreadConstructor | undefined;
function sdkConstructor(): BreadConstructor | undefined {
  return window.BreadClient || (typeof BreadClient !== 'undefined' ? BreadClient : undefined);
}
let client: BreadSDK | null = null;
let sdkPromise: Promise<void> | null = null;

export async function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error(
                'The server did not respond in time. Check your connection and try again. If you were creating an account, try signing in first.',
              ),
            ),
          ms,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout!);
  }
}

export async function getBread(): Promise<BreadSDK> {
  if (client) return client;
  if (!sdkConstructor()) {
    if (!sdkPromise) {
      sdkPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('#bread-sdk');
        existing?.remove();
        const script = document.createElement('script');
        script.id = 'bread-sdk';
        script.src = backendConfig.sdkUrl;
        script.async = true;
        const timeout = setTimeout(() => {
          script.remove();
          sdkPromise = null;
          reject(new Error('We couldn’t reach the account service. Check your connection and try again.'));
        }, 12000);
        script.onload = () => {
          clearTimeout(timeout);
          if (sdkConstructor()) resolve();
          else {
            sdkPromise = null;
            reject(new Error('The account service could not be loaded. Please try again.'));
          }
        };
        script.onerror = () => {
          clearTimeout(timeout);
          sdkPromise = null;
          script.remove();
          reject(new Error('We couldn’t reach the account service. Check your connection and try again.'));
        };
        document.head.appendChild(script);
      });
    }
    await sdkPromise;
  }
  if (!sdkConstructor()) throw new Error('Account service unavailable. Please try again.');
  const Constructor = sdkConstructor()!;
  client = new Constructor({ baseUrl: backendConfig.baseUrl, apiKey: backendConfig.apiKey });
  return client;
}

function object(value: unknown): RecordValue {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as RecordValue) : {};
}
function unwrap(value: unknown): RecordValue {
  const record = object(value);
  return record.data && typeof record.data === 'object' ? { ...record, ...object(record.data) } : record;
}
export function normalizeUser(value: unknown): User {
  const record = unwrap(value);
  const data = record.user ? object(record.user) : record;
  const rawId = data.id ?? data._id ?? data.uid;
  const id = typeof rawId === 'number' && Number.isSafeInteger(rawId) ? String(rawId) : rawId;
  if (typeof id !== 'string' || !id)
    throw new Error('The server did not return a valid account. Please try signing in again.');
  const email = typeof data.email === 'string' ? data.email : '';
  return {
    id,
    email,
    name: typeof data.name === 'string' ? data.name : email.split('@')[0] || 'Friend',
    mode: 'cloud',
  };
}

// Track only storage keys changed by SDK authentication, never credentials.
// The SDK owns tokens; the fallback logout removes its observed session keys.
function storageSnapshot(storage: Storage) {
  return Object.fromEntries(Object.keys(storage).map((key) => [key, storage.getItem(key)]));
}
function storedKeys(key: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === 'string' && !entry.startsWith('pv.'))
      : [];
  } catch {
    return [];
  }
}
export async function captureSDKSession<T>(operation: () => Promise<T>): Promise<T> {
  const before = storageSnapshot(localStorage);
  const beforeSession = storageSnapshot(sessionStorage);
  try {
    return await operation();
  } finally {
    const oldKeys = storedKeys('pv.sdk-keys');
    const keys = Object.keys(localStorage).filter(
      (key) => !key.startsWith('pv.') && before[key] !== localStorage.getItem(key),
    );
    localStorage.setItem('pv.sdk-keys', JSON.stringify([...new Set([...oldKeys, ...keys])]));
    const sessionKeys = Object.keys(sessionStorage).filter(
      (key) => !key.startsWith('pv.') && beforeSession[key] !== sessionStorage.getItem(key),
    );
    localStorage.setItem(
      'pv.sdk-session-keys',
      JSON.stringify([...new Set([...storedKeys('pv.sdk-session-keys'), ...sessionKeys])]),
    );
  }
}
export async function signOut() {
  try {
    if (client?.auth.logout) await withTimeout(client.auth.logout(), 3000);
  } catch {
    /* Local logout must still succeed when offline. */
  } finally {
    storedKeys('pv.sdk-keys').forEach((key) => localStorage.removeItem(key));
    storedKeys('pv.sdk-session-keys').forEach((key) => sessionStorage.removeItem(key));
    localStorage.removeItem('pv.sdk-session-keys');
    localStorage.removeItem('pv.sdk-keys');
    localStorage.removeItem('pv.session');
    client = null;
  }
}

export async function loadCloudWorkspace(
  user: User,
): Promise<{ id: string; workspace: WorkspaceData } | null> {
  const bread = await getBread();
  const response = await withTimeout(bread.collection('workspaces').get());
  const root = object(response);
  const inner = object(root.data);
  const rows = [
    response,
    root.data,
    root.items,
    root.documents,
    root.records,
    inner.items,
    inner.documents,
    inner.records,
  ].find(Array.isArray);
  if (!Array.isArray(rows))
    throw new Error('The server returned an unexpected workspace response. No cloud data has been changed.');
  // IMPORTANT: ownerId filtering is defence in depth, NOT authorisation.
  // BreadBackend must enforce authenticated owner-only collection/file access.
  for (const row of rows) {
    const record = unwrap(row);
    if (record.ownerId !== user.id) continue;
    if (!isWorkspace(record.workspace))
      throw new Error('This workspace could not be read. It has not been overwritten.');
    const id = record.id ?? record._id;
    if (typeof id !== 'string') throw new Error('The workspace has no valid document ID.');
    return { id, workspace: record.workspace };
  }
  return null;
}
export async function saveCloudWorkspace(
  user: User,
  workspace: WorkspaceData,
  id: string | null,
): Promise<string> {
  const bread = await getBread();
  const payload = { ownerId: user.id, workspace, updatedAt: new Date().toISOString() };
  if (id) {
    await withTimeout(bread.collection('workspaces').update(id, payload));
    return id;
  }
  const response = unwrap(await withTimeout(bread.collection('workspaces').create(payload)));
  const newId = response.id ?? response._id;
  if (typeof newId !== 'string')
    throw new Error('The server did not confirm the workspace ID. Please reload before retrying.');
  return newId;
}
export async function uploadCloudFile(file: File): Promise<{ filename: string; url: string }> {
  const bread = await getBread();
  const result = unwrap(await withTimeout(bread.files.upload(file), 90000));
  if (typeof result.filename !== 'string') throw new Error('The server did not return an uploaded file.');
  return {
    filename: result.filename,
    url: `${backendConfig.baseUrl}/files/${encodeURIComponent(result.filename)}`,
  };
}
export async function deleteCloudFile(filename: string) {
  const bread = await getBread();
  await withTimeout(bread.files.delete(filename));
}
