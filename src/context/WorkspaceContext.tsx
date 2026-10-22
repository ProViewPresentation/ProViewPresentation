import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { isWorkspace, loadCloudWorkspace, saveCloudWorkspace } from '../lib/backend';
import { createSeed } from '../lib/seed';
import type { WorkspaceData, Service } from '../lib/types';
import { errorMessage } from '../lib/utils';

type SyncStatus = 'loading' | 'local' | 'saving' | 'synced' | 'error';
type WorkspaceValue = {
  data: WorkspaceData;
  available: boolean;
  status: SyncStatus;
  syncError: string;
  update: (change: (previous: WorkspaceData) => WorkspaceData) => void;
  saveService: (service: Service) => void;
  retrySync: () => void;
};
const WorkspaceContext = createContext<WorkspaceValue | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<WorkspaceData>(() => createSeed());
  const [status, setStatus] = useState<SyncStatus>('loading');
  const [syncError, setSyncError] = useState('');
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [revision, setRevision] = useState(0);
  const docId = useRef<string | null>(null);
  const canSync = useRef(false);
  const generation = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const latest = useRef(data);
  latest.current = data;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const currentGeneration = ++generation.current;
    setReady(false);
    setAvailable(false);
    setStatus('loading');
    setSyncError('');
    docId.current = null;
    canSync.current = false;
    const key = `pv.workspace.${user.id}`;
    let cached: WorkspaceData | null = null;
    let preferences = {
      name: user.name,
      churchName: user.mode === 'demo' ? 'Grace Community' : 'Your church',
    };
    try {
      const raw = JSON.parse(localStorage.getItem(key) || 'null');
      if (isWorkspace(raw)) cached = raw;
      preferences = { ...preferences, ...JSON.parse(localStorage.getItem(`pv.setup.${user.id}`) || '{}') };
    } catch {
      /* Ignore malformed cache; never send it to the server. */
    }
    const initial = cached || createSeed(preferences.churchName, preferences.name);
    setData(initial);
    setAvailable(!!cached || user.mode === 'demo');
    if (user.mode === 'demo') {
      setStatus('local');
      setReady(true);
      return () => {
        cancelled = true;
      };
    }
    const init = async () => {
      try {
        const cloud = await loadCloudWorkspace(user);
        if (cancelled || generation.current !== currentGeneration) return;
        if (cloud) {
          docId.current = cloud.id;
          // A failed save is kept locally until the user deliberately retries it.
          const pending = localStorage.getItem(`pv.pending.${user.id}`) === 'true';
          if (pending && cached) {
            canSync.current = true;
            setStatus('error');
            setSyncError(
              'You have changes saved on this device that haven’t reached the cloud. Retry sync to upload them.',
            );
          } else {
            setData(cloud.workspace);
            setStatus('synced');
            canSync.current = true;
          }
        } else {
          docId.current = await saveCloudWorkspace(user, initial, null);
          if (cancelled) return;
          canSync.current = true;
          setStatus('synced');
        }
        if (!cancelled) setAvailable(true);
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setSyncError(`${errorMessage(error)} Changes will stay on this device until you reconnect.`);
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void init();
    return () => {
      cancelled = true;
      generation.current++;
    };
  }, [user]);

  useEffect(() => {
    if (!ready || !user || !available) return;
    try {
      localStorage.setItem(`pv.workspace.${user.id}`, JSON.stringify(data));
    } catch {
      setSyncError('Local storage is full. Export a backup from Settings before closing this tab.');
      setStatus('error');
    }
  }, [data, ready, user, available]);

  const sync = useCallback(() => {
    if (!user || user.mode === 'demo' || !ready) return;
    const currentGeneration = generation.current;
    const snapshot = latest.current;
    setStatus('saving');
    const task = async () => {
      if (generation.current !== currentGeneration) return;
      if (!canSync.current) {
        const cloud = await loadCloudWorkspace(user);
        docId.current = cloud?.id || null;
        canSync.current = true;
      }
      const id = await saveCloudWorkspace(user, snapshot, docId.current);
      if (generation.current !== currentGeneration) return;
      docId.current = id;
      if (latest.current === snapshot) {
        localStorage.removeItem(`pv.pending.${user.id}`);
        setStatus('synced');
        setSyncError('');
      }
    };
    queue.current = queue.current
      .catch(() => {})
      .then(task)
      .catch((error) => {
        if (generation.current !== currentGeneration) return;
        setStatus('error');
        setSyncError(errorMessage(error));
      });
  }, [user, ready]);

  useEffect(() => {
    if (!ready || !revision || user?.mode !== 'cloud' || !canSync.current) return;
    const timer = setTimeout(sync, 800);
    return () => clearTimeout(timer);
  }, [revision, ready, user, sync]);

  const update = useCallback(
    (change: (previous: WorkspaceData) => WorkspaceData) => {
      setData((previous) => change(previous));
      setRevision((value) => value + 1);
      if (user?.mode === 'cloud') {
        localStorage.setItem(`pv.pending.${user.id}`, 'true');
        if (canSync.current) setStatus('saving');
      }
    },
    [user],
  );
  const saveService = useCallback(
    (service: Service) => {
      update((previous) => ({
        ...previous,
        services: previous.services.some((item) => item.id === service.id)
          ? previous.services.map((item) =>
              item.id === service.id ? { ...service, updatedAt: new Date().toISOString() } : item,
            )
          : [...previous.services, service],
      }));
    },
    [update],
  );

  return (
    <WorkspaceContext.Provider
      value={{ data, available, status, syncError, update, saveService, retrySync: sync }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('WorkspaceProvider is missing');
  return value;
}
