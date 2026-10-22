import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { loadCloudWorkspace, saveCloudWorkspace } from '../lib/backend';
import { createSeed } from '../lib/seed';
import type { WorkspaceData, Service } from '../lib/types';
import { errorMessage } from '../lib/utils';

type SyncStatus = 'loading' | 'saving' | 'synced' | 'error';
type WorkspaceValue = {
  data: WorkspaceData;
  available: boolean;
  status: SyncStatus;
  syncError: string;
  update: (change: (previous: WorkspaceData) => WorkspaceData) => void;
  saveService: (service: Service) => void;
  retrySync: () => void;
  flush: () => Promise<void>;
};
const WorkspaceContext = createContext<WorkspaceValue | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<WorkspaceData>(() => createSeed());
  const [status, setStatus] = useState<SyncStatus>('loading');
  const [syncError, setSyncError] = useState('');
  const [available, setAvailable] = useState(false);
  const [revision, setRevision] = useState(0);
  const documentId = useRef<string | null>(null);
  const latest = useRef(data);
  const changedRevision = useRef(0);
  const savedRevision = useRef(0);
  const inFlight = useRef<Promise<void> | null>(null);
  const mounted = useRef(false);
  const ready = useRef(false);

  // One serialized writer. Changes made during a request are included in its next pass.
  // No workspace/backup/demo data is written to localStorage or IndexedDB.
  const flush = useCallback((): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    if (!user || !documentId.current || !ready.current || savedRevision.current >= changedRevision.current) {
      return Promise.resolve();
    }
    if (mounted.current) {
      setStatus('saving');
      setSyncError('');
    }
    const save = async () => {
      try {
        while (savedRevision.current < changedRevision.current) {
          const snapshot = latest.current;
          const version = changedRevision.current;
          await saveCloudWorkspace(user, snapshot, documentId.current);
          savedRevision.current = version;
        }
        if (mounted.current) {
          setStatus('synced');
          setSyncError('');
        }
      } catch (error) {
        if (mounted.current) {
          setStatus('error');
          setSyncError(
            `${errorMessage(error)} These changes have not reached the cloud. Keep this page open and retry.`,
          );
        }
        throw error;
      } finally {
        inFlight.current = null;
      }
    };
    inFlight.current = save();
    return inFlight.current;
  }, [user]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      // Complete the last accepted edit when navigating away inside the application.
      mounted.current = false;
      void flush().catch(() => {});
    };
  }, [flush]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    ready.current = false;
    documentId.current = null;
    setAvailable(false);
    setStatus('loading');
    setSyncError('');
    const initialize = async () => {
      try {
        const cloud = await loadCloudWorkspace(user);
        if (cancelled) return;
        if (cloud) {
          documentId.current = cloud.id;
          latest.current = cloud.workspace;
        } else {
          const initial = createSeed(user.churchName || 'Your church', user.name);
          const id = await saveCloudWorkspace(user, initial, null);
          if (cancelled) return;
          documentId.current = id;
          latest.current = initial;
        }
        changedRevision.current = 0;
        savedRevision.current = 0;
        ready.current = true;
        setData(latest.current);
        setAvailable(true);
        setStatus('synced');
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setSyncError(
          `${errorMessage(error)} Your cloud workspace has not been replaced. Reconnect and try again.`,
        );
      }
    };
    void initialize();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!available || !revision) return;
    const timer = setTimeout(() => {
      void flush().catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [revision, available, flush]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (changedRevision.current <= savedRevision.current) return;
      void flush().catch(() => {});
      event.preventDefault();
      event.returnValue = '';
    };
    const reconnect = () => {
      void flush().catch(() => {});
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('online', reconnect);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('online', reconnect);
    };
  }, [flush]);

  const update = useCallback((change: (previous: WorkspaceData) => WorkspaceData) => {
    if (!ready.current) return;
    const next = change(latest.current);
    latest.current = next;
    changedRevision.current += 1;
    setData(next);
    setRevision(changedRevision.current);
    setStatus('saving');
  }, []);
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
  const retrySync = () => {
    void flush().catch(() => {});
  };
  return (
    <WorkspaceContext.Provider
      value={{ data, available, status, syncError, update, saveService, retrySync, flush }}
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
