import { useEffect, useState } from 'react';

let dbPromise: Promise<IDBDatabase> | null = null;
function db() {
  if (!dbPromise)
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('proview-media', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('files');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(new Error('Your browser could not open local media storage.'));
      };
    });
  return dbPromise;
}
export async function saveLocalFile(id: string, file: Blob) {
  const database = await db();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('files', 'readwrite');
    transaction.objectStore('files').put(file, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(new Error('Not enough local storage for this file. Try a smaller file.'));
  });
}
export async function removeLocalFile(id: string) {
  const database = await db();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('files', 'readwrite');
    transaction.objectStore('files').delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Could not remove the local file.'));
  });
}
async function getLocalFile(id: string): Promise<Blob | undefined> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const request = database.transaction('files').objectStore('files').get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export function useMediaUrl(source?: string) {
  const [url, setUrl] = useState(source?.startsWith('local:') ? undefined : source);
  useEffect(() => {
    let alive = true;
    let objectUrl: string | undefined;
    if (source?.startsWith('local:')) {
      setUrl(undefined);
      getLocalFile(source.slice(6))
        .then((file) => {
          if (alive && file) {
            objectUrl = URL.createObjectURL(file);
            setUrl(objectUrl);
          }
        })
        .catch(() => {
          if (alive) setUrl(undefined);
        });
    } else setUrl(source);
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);
  return url;
}
