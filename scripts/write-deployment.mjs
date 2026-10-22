import { writeFile } from 'node:fs/promises';

// Publish only non-secret build metadata for cache/deployment verification.
await writeFile(
  'dist/deployment.json',
  JSON.stringify({
    commit: process.env.GITHUB_SHA || 'development',
    mode: 'cloud',
    backend: process.env.VITE_BREAD_BASE_URL || 'https://kaidaz18.duckdns.org/api/v1/proview',
    builtAt: new Date().toISOString(),
  }),
);
