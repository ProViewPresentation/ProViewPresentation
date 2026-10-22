import { test, expect } from '@playwright/test';
import { CloudServer, signUp, signIn, cloudSaved } from '../support/cloud';

let server: CloudServer;
test.beforeEach(async ({ context }) => {
  server = new CloudServer();
  await server.attach(context);
});

test('landing links, feature tabs, and FAQs work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Less distraction. More connection.' })).toBeVisible();
  await page.getByRole('button', { name: 'The good stuff', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Everything you need. Nothing in the way.' })).toBeVisible();
  await page.getByRole('tab', { name: 'Present', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Be present. Not preoccupied.' })).toBeVisible();
  await page.getByRole('button', { name: 'Wait, is it really free?' }).click();
  await expect(page.getByText('Yes. ProView has no subscriptions', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Get started free' }).click();
  await expect(page.getByRole('button', { name: 'Create my free account' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('create, reorder, edit, and retain a service collection', async ({ page }) => {
  await signUp(page);
  await page.getByRole('button', { name: 'Create a service' }).click();
  await page.getByLabel('Service name').fill('Evening of hope');
  await page.getByLabel('Date', { exact: true }).fill('2026-11-01');
  await page.getByRole('button', { name: 'Create service', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Evening of hope' })).toBeVisible();
  await page.getByRole('button', { name: 'Add your first item' }).click();
  await page.getByRole('tab', { name: 'Slide', exact: true }).click();
  await page.getByLabel('Slide title', { exact: true }).fill('A warm welcome');
  await page
    .getByLabel('Your words', { exact: false })
    .fill('Everyone has a place here.\n\nA little hope for the week ahead.');
  await page.getByRole('button', { name: 'Add to service', exact: true }).click();
  await expect(page.getByLabel('Slide text', { exact: true })).toHaveValue('Everyone has a place here.');
  await page.getByLabel('Slide text', { exact: true }).fill('Everyone belongs here.');
  await page.getByRole('button', { name: 'Add a service item', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Amazing Grace/ })
    .click();
  await page.getByRole('button', { name: 'Move item up', exact: true }).click();
  await cloudSaved(page);
  let saved = server.workspace();
  let service = saved.services.find((item: { title: string }) => item.title === 'Evening of hope');
  expect(service.items[0].title).toBe('Amazing Grace');
  expect(service.items[1].slides[0].text).toBe('Everyone belongs here.');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Evening of hope' })).toBeVisible();
  await cloudSaved(page);
  saved = server.workspace();
  service = saved.services.find((item: { title: string }) => item.title === 'Evening of hope');
  expect(service.items).toHaveLength(2);
});

test('songs and CCLI credits flow into services, while source edits stay independent', async ({ page }) => {
  await signUp(page);
  await page.goto('./#/workspace/settings');
  await page.getByLabel('Your church’s CCLI licence number').fill('987654');
  await page.getByRole('button', { name: 'Save the details' }).click();
  await cloudSaved(page);
  await page.goto('./#/workspace/songs');
  await page.getByRole('button', { name: 'Add a song', exact: true }).click();
  await page.getByLabel('Song title').fill('A new morning');
  await page.getByLabel('Writer / author').fill('Alex Morgan');
  await page
    .getByLabel('Song lyrics')
    .fill('A new morning\nA little light\n\nA new beginning\nA heart made bright');
  await page.getByLabel('CCLI song number (optional)').fill('123456');
  await page.getByRole('button', { name: 'Add to the library' }).click();
  const row = page.locator('.song-row').filter({ hasText: 'A new morning' });
  await row.getByRole('button', { name: 'Add to service', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add to service', exact: true }).click();
  await cloudSaved(page);
  const saved = server.workspace();
  const item = saved.services[0].items.at(-1);
  expect(item.title).toBe('A new morning');
  expect(item.slides[0].credit).toContain('CCLI Licence #987654');
  expect(item.slides[0].credit).toContain('CCLI Song #123456');
  await row.getByRole('button', { name: 'Edit A new morning' }).click();
  await page.getByLabel('Song lyrics').fill('Only the master lyrics change.');
  await page.getByRole('button', { name: 'Save song' }).click();
  await cloudSaved(page);
  expect(server.workspace().services[0].items.at(-1).slides[0].text).toContain('A new morning');
});

test('full Bible reference lookup, translation selection, and slide addition', async ({ page }) => {
  await signUp(page);
  await page.goto('./#/workspace/scripture');
  await page.getByLabel('Scripture reference').fill('Isaiah 40:28-31');
  await page.getByRole('button', { name: 'Find passage', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Isaiah 40:28–31' })).toBeVisible();
  await expect(page.locator('.passage-verses')).toContainText('hast thou not heard');
  await page.getByLabel('Bible translation').selectOption('asv');
  await expect(page.locator('.passage-source')).toContainText('American Standard Version');
  await expect(page.locator('.passage-verses')).toContainText('Jehovah');
  await page.getByRole('button', { name: /Add \d+ slides to a service/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add to service', exact: true }).click();
  await cloudSaved(page);
  expect(server.workspace().services[0].items.at(-1).title).toBe('Isaiah 40:28–31 (ASV)');
  await page.getByLabel('Scripture reference').fill('John 500:99');
  await page.getByRole('button', { name: 'Find passage', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('John has 21 chapters');
});

test('live micro-edits, keyboard navigation, audience and stage syncing never mutate masters', async ({
  page,
  context,
}) => {
  await signUp(page);
  const original = server.workspace().services[0].items[0].slides[0].text;
  await page.goto('./#/operator/sunday-gathering');
  await page.getByRole('button', { name: 'Quick slide adjustments' }).click();
  await page.getByLabel('Live slide text').fill('A live-only thought.');
  await page.getByRole('button', { name: 'Close quick adjustments' }).click();
  await page.getByRole('button', { name: 'Go live', exact: true }).click();
  await page.getByRole('button', { name: 'Displays', exact: true }).click();
  const audiencePromise = context.waitForEvent('page');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Audience display/ })
    .click();
  const audience = await audiencePromise;
  await expect(audience.locator('.slide-text')).toHaveText('A live-only thought.');
  const stagePromise = context.waitForEvent('page');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Stage & confidence view/ })
    .click();
  const stage = await stagePromise;
  await expect(stage.locator('.stage-current .slide-text')).toHaveText('A live-only thought.');
  await expect(stage.locator('.stage-notes')).toContainText('Take a moment to greet new visitors');
  await page.getByRole('button', { name: 'All set', exact: true }).click();
  await page.keyboard.press('ArrowRight');
  await expect(audience.locator('.slide-text')).toHaveText('Better, together.');
  await page.keyboard.press('b');
  await expect(audience.locator('.slide-view')).toHaveClass(/slide-black/);
  await page.keyboard.press('b');
  await page.keyboard.press('c');
  await expect(audience.locator('.slide-text')).toHaveCount(0);
  await page.keyboard.press('c');
  await page.getByLabel('Countdown in minutes').fill('1');
  await page.getByRole('button', { name: 'Start stage countdown' }).click();
  await expect(stage.locator('.stage-timer')).toContainText('YOUR COUNTDOWN');
  expect(server.workspace().services[0].items[0].slides[0].text).toBe(original);
  await page.getByRole('button', { name: 'End live', exact: true }).click();
  await expect(audience.locator('.slide-view')).toHaveClass(/slide-black/);
});

test('media uploads use the backend, persist after reload, and can be removed', async ({ page }) => {
  await signUp(page);
  await page.goto('./#/workspace/media');
  await page.locator('input[type=file]').setInputFiles({
    name: 'sunday.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.locator('.media-card').filter({ hasText: 'sunday.png' })).toBeVisible();
  await cloudSaved(page);
  expect(server.files.size).toBe(1);
  await page.reload();
  const card = page.locator('.media-card').filter({ hasText: 'sunday.png' });
  await expect(card).toBeVisible();
  await expect
    .poll(() => card.locator('img').evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBe(1);
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'not-a-media.txt', mimeType: 'text/plain', buffer: Buffer.from('not supported') });
  await expect(page.locator('.toast-region')).toContainText('isn’t supported');
  await card.getByRole('button', { name: 'Delete sunday.png' }).click();
  await page.getByRole('button', { name: 'Remove media', exact: true }).click();
  await expect(card).toHaveCount(0);
  await cloudSaved(page);
  expect(server.files.size).toBe(0);
});

test('backup export works and malformed nested restores do not touch existing work', async ({ page }) => {
  await signUp(page);
  const before = server.workspace();
  await page.goto('./#/workspace/settings');
  await page.getByRole('button', { name: 'Your data & backups' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export workspace backup' }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/^proview-backup-.*\.json$/);
  const invalid = { ...before, services: [{ id: 'bad-service', items: null }] };
  await page.locator('input[type=file]').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(invalid)),
  });
  await expect(page.locator('.toast-region')).toContainText('valid ProView workspace backup');
  expect(server.workspace().services).toEqual(before.services);
});

test('cloud accounts restore saved work in a second isolated browser, with no local workspace cache', async ({
  page,
  browser,
}) => {
  await signUp(page);
  await page.goto('./#/workspace/settings');
  await page.getByLabel('Church or community name').fill('Hope & Grace');
  await page.getByRole('button', { name: 'Save the details' }).click();
  // Logout must flush pending changes even before the autosave debounce fires.
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Step into your workspace' })).toBeVisible();
  expect(server.workspace().settings.churchName).toBe('Hope & Grace');
  expect(await page.evaluate(() => localStorage.getItem('bread-test-token'))).toBeNull();
  expect(
    await page.evaluate(() => Object.keys(localStorage).some((key) => key.startsWith('pv.workspace.'))),
  ).toBe(false);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('a-good-test-password');

  const secondContext = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  await server.attach(secondContext, { lexicalSDK: false });
  const secondDevice = await secondContext.newPage();
  await signIn(secondDevice);
  await expect(secondDevice.locator('.church-picker')).toContainText('Hope & Grace');
  await cloudSaved(secondDevice);
  await secondContext.close();
});

test('unreadable cloud workspaces never fall back to old demo or cached data', async ({ page }) => {
  server.failRead = true;
  await page.addInitScript(() => {
    localStorage.setItem('pv.session', 'demo');
    localStorage.setItem(
      'pv.workspace.local-demo',
      JSON.stringify({ schemaVersion: 1, settings: { churchName: 'A local-only church' } }),
    );
  });
  await page.goto('./#/workspace');
  await expect(page.getByRole('button', { name: 'Step into your workspace' })).toBeVisible();
  await page.goto('./#/signup');
  await page.getByLabel('Your name', { exact: true }).fill('Alex');
  await page.getByLabel('Church or community', { exact: true }).fill('Hope');
  await page.getByLabel('Email address').fill('alex@church.org');
  await page.getByLabel('Password', { exact: true }).fill('a-good-test-password');
  await page.getByRole('button', { name: 'Create my free account' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your workspace needs a little connection.' }),
  ).toBeVisible();
  expect(server.documents.size).toBe(0);
  await expect(page.getByText('A local-only church', { exact: true })).toHaveCount(0);
});

test('unconfirmed cloud saves show an error and retry the pending changes', async ({ page }) => {
  await signUp(page);
  server.failSave = true;
  await page.goto('./#/workspace/settings');
  await page.getByLabel('Church or community name').fill('A pending change');
  await page.getByRole('button', { name: 'Save the details' }).click();
  await expect(page.getByRole('alert')).toContainText('have not reached the cloud');
  await expect(page.getByRole('button', { name: 'Saved to cloud', exact: true })).toHaveCount(0);
  expect(server.workspace().settings.churchName).toBe('Grace Community');
  server.failSave = false;
  await page.getByRole('button', { name: 'Retry cloud save', exact: true }).click();
  await cloudSaved(page);
  expect(server.workspace().settings.churchName).toBe('A pending change');
});

test('edits made during a slow save are serialized without losing newer values', async ({ page }) => {
  await signUp(page);
  server.saveDelay = 500;
  await page.goto('./#/workspace/services/sunday-gathering');
  await page.getByLabel('Slide text', { exact: true }).fill('The first version');
  await expect.poll(() => server.calls.filter((call) => call.method === 'PUT').length).toBeGreaterThan(0);
  await page.getByLabel('Slide text', { exact: true }).fill('The latest version');
  await cloudSaved(page);
  expect(server.workspace().services[0].items[0].slides[0].text).toBe('The latest version');
});

test('backend connection failures are honest errors, never fake accounts', async ({ page, context }) => {
  await context.route('**/sdk/bread-client.js', (route) => route.abort());
  await page.goto('./#/login');
  await page.getByLabel('Email address').fill('alex@church.org');
  await page.getByLabel('Password', { exact: true }).fill('a-good-test-password');
  await page.getByRole('button', { name: 'Step into your workspace' }).click();
  await expect(page.getByRole('alert')).toContainText('couldn’t reach the account service');
  expect(await page.evaluate(() => localStorage.getItem('pv.session'))).toBeNull();
});

test('wrong passwords do not create sessions or workspaces', async ({ page }) => {
  await page.goto('./#/login');
  await page.getByLabel('Email address').fill('nobody@church.org');
  await page.getByLabel('Password', { exact: true }).fill('incorrect-password');
  await page.getByRole('button', { name: 'Step into your workspace' }).click();
  await expect(page.getByRole('alert')).toContainText('Email or password is incorrect');
  expect(await page.evaluate(() => localStorage.getItem('pv.session'))).toBeNull();
  expect(server.documents.size).toBe(0);
});

test('mobile layouts fit, navigation opens, and the form is usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signUp(page);
  await page.getByRole('button', { name: 'Open sidebar' }).click();
  await page.getByRole('link', { name: 'Services', exact: false }).first().click();
  await expect(page.getByRole('heading', { name: 'Services, in good order.' })).toBeVisible();
  for (const path of [
    '/',
    '/#/workspace',
    '/#/workspace/services/sunday-gathering',
    '/#/workspace/songs',
    '/#/workspace/scripture',
    '/#/workspace/media',
    '/#/workspace/settings',
    '/#/operator/sunday-gathering',
  ]) {
    await page.goto(`.${path}`);
    await page.locator('h1').first().waitFor();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  }
  await page.goto('./#/workspace');
  await page.getByRole('button', { name: 'Open sidebar' }).click();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await page.goto('./#/signup');
  await expect(page.getByRole('button', { name: 'Create my free account' })).toBeVisible();
  await expect(page.getByRole('button', { name: /local demo/i })).toHaveCount(0);
});

test('the bundled media resolves under the deployed project path', async ({ page }) => {
  await signUp(page);
  await page.goto('./#/workspace/media');
  const image = page.locator('.media-card').first().locator('img');
  await expect
    .poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(100);
  expect(await image.getAttribute('src')).toBe(
    `${new URL(test.info().project.use.baseURL as string).pathname}images/mountain-dawn.jpg`,
  );
  expect(server.workspace().media[0].url).toBe('asset:images/mountain-dawn.jpg');
});
