import { test, expect, type Page } from '@playwright/test';

async function demo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Take a look around' }).click();
  await expect(page.getByRole('heading', { name: /Good to see you/ })).toBeVisible();
}
const workspace = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('pv.workspace.local-demo')!));

async function mockBread(page: Page, failRead = false) {
  await page.addInitScript({
    content: `
    window.__breadCalls = [];
    window.BreadClient = class {
      constructor(config) { window.__breadConfig = config; }
      auth = {
        signup: async (email, password) => { window.__breadCalls.push({op:'signup', email}); if (email === 'taken@church.org') throw new Error('This email is already registered.'); return {id:'test-account', email}; },
        login: async (email, password) => { window.__breadCalls.push({op:'login', email}); if(password === 'wrongpass') throw new Error('Email or password is incorrect.'); localStorage.setItem('bread-test-token', 'test-session-only'); return {user:{id:'test-account', email}}; },
        me: async () => { if (!localStorage.getItem('bread-test-token')) throw new Error('Session expired'); return {id:'test-account',email:'alex@church.org'}; }
      };
      collection(name) { return {
        get: async () => { window.__breadCalls.push({op:'get',name}); ${failRead ? "throw new Error('Workspace service is offline');" : "return JSON.parse(localStorage.getItem('pv.test.records') || '[]');"} },
        create: async (data) => { const row={id:'test-workspace',...data}; localStorage.setItem('pv.test.records',JSON.stringify([row])); window.__breadCalls.push({op:'create',name}); return row; },
        update: async (id,data) => { const rows=JSON.parse(localStorage.getItem('pv.test.records')||'[]'); localStorage.setItem('pv.test.records',JSON.stringify(rows.map(row=>row.id===id?{...row,...data}:row))); window.__breadCalls.push({op:'update',name,id}); return {id,...data}; }
      }; }
    };
  `,
  });
}

test('landing links, feature tabs, and FAQs work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
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
  await demo(page);
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
  let saved = await workspace(page);
  let service = saved.services.find((item: { title: string }) => item.title === 'Evening of hope');
  expect(service.items[0].title).toBe('Amazing Grace');
  expect(service.items[1].slides[0].text).toBe('Everyone belongs here.');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Evening of hope' })).toBeVisible();
  saved = await workspace(page);
  service = saved.services.find((item: { title: string }) => item.title === 'Evening of hope');
  expect(service.items).toHaveLength(2);
});

test('songs and CCLI credits flow into services, while source edits stay independent', async ({ page }) => {
  await demo(page);
  await page.goto('/#/workspace/settings');
  await page.getByLabel('Your church’s CCLI licence number').fill('987654');
  await page.getByRole('button', { name: 'Save the details' }).click();
  await page.goto('/#/workspace/songs');
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
  const saved = await workspace(page);
  const item = saved.services[0].items.at(-1);
  expect(item.title).toBe('A new morning');
  expect(item.slides[0].credit).toContain('CCLI Licence #987654');
  expect(item.slides[0].credit).toContain('CCLI Song #123456');
  await row.getByRole('button', { name: 'Edit A new morning' }).click();
  await page.getByLabel('Song lyrics').fill('Only the master lyrics change.');
  await page.getByRole('button', { name: 'Save song' }).click();
  expect((await workspace(page)).services[0].items.at(-1).slides[0].text).toContain('A new morning');
});

test('full Bible reference lookup, translation selection, and slide addition', async ({ page }) => {
  await demo(page);
  await page.goto('/#/workspace/scripture');
  await page.getByLabel('Scripture reference').fill('Isaiah 40:28-31');
  await page.getByRole('button', { name: 'Find passage', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Isaiah 40:28–31' })).toBeVisible();
  await expect(page.locator('.passage-verses')).toContainText('hast thou not heard');
  await page.getByLabel('Bible translation').selectOption('asv');
  await expect(page.locator('.passage-source')).toContainText('American Standard Version');
  await expect(page.locator('.passage-verses')).toContainText('Jehovah');
  await page.getByRole('button', { name: /Add \d+ slides to a service/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add to service', exact: true }).click();
  expect((await workspace(page)).services[0].items.at(-1).title).toBe('Isaiah 40:28–31 (ASV)');
  await page.getByLabel('Scripture reference').fill('John 500:99');
  await page.getByRole('button', { name: 'Find passage', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('John has 21 chapters');
});

test('live micro-edits, keyboard navigation, audience and stage syncing never mutate masters', async ({
  page,
  context,
}) => {
  await demo(page);
  const original = (await workspace(page)).services[0].items[0].slides[0].text;
  await page.goto('/#/operator/sunday-gathering');
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
  expect((await workspace(page)).services[0].items[0].slides[0].text).toBe(original);
  await page.getByRole('button', { name: 'End live', exact: true }).click();
  await expect(audience.locator('.slide-view')).toHaveClass(/slide-black/);
});

test('media uploads persist locally, invalid types are rejected, and unused files can be removed', async ({
  page,
}) => {
  await demo(page);
  await page.goto('/#/workspace/media');
  await page.locator('input[type=file]').setInputFiles({
    name: 'sunday.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.locator('.media-card').filter({ hasText: 'sunday.png' })).toBeVisible();
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
});

test('backup export works and malformed nested restores do not touch existing work', async ({ page }) => {
  await demo(page);
  const before = await workspace(page);
  await page.goto('/#/workspace/settings');
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
  expect((await workspace(page)).services).toEqual(before.services);
});

test('signup and authenticated cloud saves follow the supplied SDK contract', async ({ page }) => {
  await mockBread(page);
  await page.goto('/#/signup');
  await page.getByLabel('Your name', { exact: true }).fill('Alex Morgan');
  await page.getByLabel('Church or community', { exact: true }).fill('Hope Community');
  await page.getByLabel('Email address').fill('alex@church.org');
  await page.getByLabel('Password', { exact: true }).fill('a-good-test-password');
  await page.getByRole('button', { name: 'Create my free account' }).click();
  await expect(page.getByRole('heading', { name: 'Good to see you, Alex.' })).toBeVisible();
  await expect(page.locator('.church-picker')).toContainText('Hope Community');
  await page.goto('/#/workspace/settings');
  await page.getByLabel('Church or community name').fill('Hope & Grace');
  await page.getByRole('button', { name: 'Save the details' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('pv.test.records')!)[0].workspace.settings.churchName,
      ),
    )
    .toBe('Hope & Grace');
  expect(await page.evaluate(() => localStorage.getItem('pv.session'))).toBe('cloud');
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('a-good-test-password');
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Less distraction. More connection.' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('bread-test-token'))).toBeNull();
});

test('an unreadable cloud workspace is not silently replaced with demo content', async ({ page }) => {
  await mockBread(page, true);
  await page.goto('/#/login');
  await page.getByLabel('Email address').fill('alex@church.org');
  await page.getByLabel('Password', { exact: true }).fill('a-good-test-password');
  await page.getByRole('button', { name: 'Step into your workspace' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your workspace needs a little connection.' }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('pv.workspace.test-account'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('pv.test.records'))).toBeNull();
});

test('backend connection failures and invalid credentials are honest errors, never fake accounts', async ({
  page,
}) => {
  await page.route('**/sdk/bread-client.js', (route) => route.abort());
  await page.goto('/#/login');
  await page.getByLabel('Email address').fill('alex@church.org');
  await page.getByLabel('Password', { exact: true }).fill('a-good-test-password');
  await page.getByRole('button', { name: 'Step into your workspace' }).click();
  await expect(page.getByRole('alert')).toContainText('couldn’t reach the account service');
  expect(await page.evaluate(() => localStorage.getItem('pv.session'))).toBeNull();
});

test('mobile layouts fit, navigation opens, and the form is usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await demo(page);
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
    '/#/signup',
  ]) {
    await page.goto(path);
    await page.locator('h1').first().waitFor();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  }
  await expect(page.getByRole('button', { name: 'Create my free account' })).toBeVisible();
});
