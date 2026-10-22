import { chromium } from '@playwright/test';
import { appendFile } from 'node:fs/promises';

const siteURL = process.env.PROVIEW_SITE_URL;
if (!siteURL || !siteURL.startsWith('https://')) throw new Error('An HTTPS PROVIEW_SITE_URL is required.');
const base = siteURL.endsWith('/') ? siteURL : `${siteURL}/`;
const sdkURL = process.env.VITE_BREAD_SDK_URL || 'https://kaidaz18.duckdns.org/sdk/bread-client.js';
const apiURL = process.env.VITE_BREAD_BASE_URL || 'https://kaidaz18.duckdns.org/api/v1/proview';
const apiKey = process.env.VITE_BREAD_PUBLIC_KEY || 'pk_live_kzIciEsEmutDNA22zmUkx14Y';
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const releaseURL = new URL('deployment.json', base).href;
  const expected = process.env.GITHUB_SHA;
  let release;
  // Pages/CDN propagation can lag behind the deploy API completing.
  for (let attempt = 0; attempt < 12; attempt++) {
    const response = await context.request.get(`${releaseURL}?commit=${expected || 'check'}`, {
      timeout: 20000,
    });
    if (response.ok()) {
      const candidate = await response.json();
      if (candidate.mode === 'cloud' && (!expected || candidate.commit === expected)) {
        release = candidate;
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  if (!release) throw new Error('The expected cloud build is not yet available on GitHub Pages.');
  const response = await page.goto(base, { waitUntil: 'networkidle', timeout: 45000 });
  if (!response?.ok()) throw new Error(`The Pages home page returned HTTP ${response?.status()}.`);
  await page.getByRole('heading', { name: 'Less distraction. More connection.' }).waitFor();
  await page.getByRole('link', { name: 'Get started free' }).click();
  await page.getByRole('button', { name: 'Create my free account' }).waitFor();
  if (await page.getByRole('button', { name: /local demo/i }).count())
    throw new Error('The published page still offers a local demo.');

  // Read-only real-backend probe from the actual Pages origin. No account is created
  // and no credentials or workspace documents are read or written by this check.
  const responses = [];
  page.on('response', (response) => {
    if (response.url().startsWith(apiURL)) responses.push({ url: response.url(), status: response.status() });
  });
  await page.addScriptTag({ url: sdkURL });
  const diagnostic = await page.evaluate(
    async ({ apiURL, apiKey }) => {
      const Constructor =
        window.BreadClient || (typeof BreadClient !== 'undefined' ? BreadClient : undefined);
      if (typeof Constructor !== 'function')
        return { sdkLoaded: false, message: 'BreadClient was not exposed by the SDK.' };
      try {
        const bread = new Constructor({ baseUrl: apiURL, apiKey });
        await bread.auth.me();
        return { sdkLoaded: true, message: 'Session endpoint responded.' };
      } catch (error) {
        return {
          sdkLoaded: true,
          message: error instanceof Error ? error.message : 'Session request rejected.',
        };
      }
    },
    { apiURL, apiKey },
  );
  if (!diagnostic.sdkLoaded) throw new Error(diagnostic.message);
  // An unauthenticated browser should be rejected by auth.me, but fetch must be
  // readable (not blocked by CORS). Do not print response bodies or token values.
  const sessionResponse = responses.find((response) => !response.url.endsWith('.js'));
  if (
    !sessionResponse ||
    ![200, 401].includes(sessionResponse.status) ||
    /failed to fetch|networkerror|load failed|api.?key/i.test(diagnostic.message)
  ) {
    throw new Error(`Pages loaded, but the backend session check failed: ${diagnostic.message}`);
  }
  const message = `Published cloud build ${release.commit} at ${base}. BreadClient loaded and the backend session endpoint responded from the Pages origin (HTTP ${sessionResponse.status}). No test account was created.`;
  console.log(message);
  console.log(`::notice title=ProView is online::${message}`);
  if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `## ProView is online\n\n[Open ProView](${base})\n\n${message}\n`,
    );
} finally {
  await browser.close();
}
