import type { BrowserContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { WorkspaceData } from '../../src/lib/types';

const baseUrl = 'https://kaidaz18.duckdns.org/api/v1/proview';
const sdkUrl = 'https://kaidaz18.duckdns.org/sdk/bread-client.js';
const publicKey = 'pk_live_kzIciEsEmutDNA22zmUkx14Y';
type Account = { id: string; email: string; password: string };
type Document = { id: string; ownerId: string; workspace: WorkspaceData; updatedAt: string };

// An HTTP contract fixture, not browser-local persistence. The same server can be
// attached to multiple isolated browser contexts to verify cross-device reads.
export class CloudServer {
  accounts = new Map<string, Account>();
  documents = new Map<string, Document>();
  files = new Map<string, { ownerId: string; bytes: Buffer; type: string }>();
  calls: { method: string; path: string; authenticated: boolean }[] = [];
  failRead = false;
  failSave = false;
  saveDelay = 0;
  private nextAccount = 1;
  private nextDocument = 1;

  async attach(context: BrowserContext, { lexicalSDK = true }: { lexicalSDK?: boolean } = {}) {
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    };
    await context.route(sdkUrl, async (route) => {
      const script = `
        ${lexicalSDK ? 'class BreadClient' : 'window.BreadClient = class'} {
          constructor(config) {
            this.baseUrl=config.baseUrl; this.apiKey=config.apiKey;
            this.token=localStorage.getItem('bread-test-token');
          }
          async request(method, path, body) {
            const headers={'x-api-key':this.apiKey};
            if(this.token) headers.Authorization='Bearer '+this.token;
            if(body && !(body instanceof FormData)) headers['Content-Type']='application/json';
            const response=await fetch(this.baseUrl+path,{method,headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined});
            const data=await response.json();
            if(!response.ok) throw new Error(data.error || 'Backend request failed');
            return data;
          }
          auth={
            signup:async(email,password)=>this.request('POST','/auth/signup',{email,password}),
            login:async(email,password)=>{const result=await this.request('POST','/auth/login',{email,password});this.token=result.token;localStorage.setItem('bread-test-token',this.token);return result;},
            me:async()=>this.request('GET','/auth/me')
          };
          collection(name) {const path='/collections/'+name;return {
            get:()=>this.request('GET',path),
            getById:id=>this.request('GET',path+'/'+id),
            create:data=>this.request('POST',path,data),
            update:(id,data)=>this.request('PUT',path+'/'+id,data),
            delete:id=>this.request('DELETE',path+'/'+id)
          };}
          files={
            upload:file=>{const form=new FormData();form.append('file',file);return this.request('POST','/files',form);},
            list:()=>this.request('GET','/files'),
            delete:filename=>this.request('DELETE','/files/'+encodeURIComponent(filename))
          };
        }
      `;
      await route.fulfill({ contentType: 'application/javascript', body: script, headers: cors });
    });
    await context.route(`${baseUrl}/**`, async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname.replace('/api/v1/proview', '');
      const method = request.method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: cors });
        return;
      }
      const headers = request.headers();
      const account = [...this.accounts.values()].find(
        (value) => headers.authorization === `Bearer test-token-${value.id}`,
      );
      this.calls.push({ method, path, authenticated: !!account });
      const json = async (body: unknown, status = 200) =>
        route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
      if (method === 'GET' && path.startsWith('/files/')) {
        const file = this.files.get(decodeURIComponent(path.slice(7)));
        if (!file) {
          await json({ error: 'File not found' }, 404);
          return;
        }
        await route.fulfill({ status: 200, headers: cors, contentType: file.type, body: file.bytes });
        return;
      }
      if (headers['x-api-key'] !== publicKey) {
        await json({ error: 'Invalid project API key' }, 403);
        return;
      }
      if (method === 'POST' && path.startsWith('/auth/')) {
        const { email, password } = request.postDataJSON();
        if (path === '/auth/signup') {
          if (this.accounts.has(email)) {
            await json({ error: 'This email is already registered.' }, 409);
            return;
          }
          const value = { id: `account-${this.nextAccount++}`, email, password };
          this.accounts.set(email, value);
          await json({ user: { id: value.id, email } }, 201);
          return;
        }
        const value = this.accounts.get(email);
        if (!value || value.password !== password) {
          await json({ error: 'Email or password is incorrect.' }, 401);
          return;
        }
        await json({ token: `test-token-${value.id}`, user: { id: value.id, email } });
        return;
      }
      if (!account) {
        await json({ error: 'Your session has expired. Please sign in again.' }, 401);
        return;
      }
      if (path === '/auth/me') {
        await json({ id: account.id, email: account.email });
        return;
      }
      if (path.startsWith('/collections/workspaces')) {
        if (method === 'GET') {
          if (this.failRead) {
            await json({ error: 'Workspace service is unavailable.' }, 503);
            return;
          }
          await json({
            documents: [...this.documents.values()]
              .filter((doc) => doc.ownerId === account.id)
              .map(({ id, ...data }) => ({ id, data })),
          });
          return;
        }
        if (this.failSave) {
          await json({ error: 'Cloud save is unavailable.' }, 503);
          return;
        }
        if (this.saveDelay) await new Promise((resolve) => setTimeout(resolve, this.saveDelay));
        const payload = request.postDataJSON();
        if (payload.ownerId !== account.id) {
          await json({ error: 'Forbidden' }, 403);
          return;
        }
        const id = method === 'POST' ? `workspace-${this.nextDocument++}` : path.split('/').at(-1)!;
        const previous = this.documents.get(id);
        if (method === 'PUT' && (!previous || previous.ownerId !== account.id)) {
          await json({ error: 'Forbidden' }, 403);
          return;
        }
        this.documents.set(id, { id, ...payload });
        await json({ id, data: payload }, method === 'POST' ? 201 : 200);
        return;
      }
      if (method === 'POST' && path === '/files') {
        const data = request.postDataBuffer()!;
        const filename = `${account.id}-${this.files.size + 1}-sunday.png`;
        const start = data.indexOf(Buffer.from('\r\n\r\n')) + 4;
        const end = data.lastIndexOf(Buffer.from('\r\n--'));
        this.files.set(filename, {
          ownerId: account.id,
          bytes: data.subarray(start, end),
          type: 'image/png',
        });
        await json({ filename }, 201);
        return;
      }
      if (method === 'DELETE' && path.startsWith('/files/')) {
        const filename = decodeURIComponent(path.slice(7));
        if (this.files.get(filename)?.ownerId !== account.id) {
          await json({ error: 'Forbidden' }, 403);
          return;
        }
        this.files.delete(filename);
        await json({ success: true });
        return;
      }
      await json({ error: 'Unknown endpoint in SDK contract fixture' }, 404);
    });
  }
  workspace(email = 'alex@church.org') {
    const account = this.accounts.get(email);
    const document = [...this.documents.values()].find((value) => value.ownerId === account?.id);
    if (!document) throw new Error('No backend workspace was saved');
    return structuredClone(document.workspace);
  }
}

export async function signUp(page: Page, email = 'alex@church.org') {
  await page.goto('./#/signup');
  await page.getByLabel('Your name', { exact: true }).fill('Alex Morgan');
  await page.getByLabel('Church or community', { exact: true }).fill('Grace Community');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('a-good-test-password');
  await page.getByRole('button', { name: 'Create my free account' }).click();
  await expect(page.getByRole('heading', { name: 'Good to see you, Alex.' })).toBeVisible();
  await cloudSaved(page);
}
export async function signIn(page: Page, email = 'alex@church.org') {
  await page.goto('./#/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('a-good-test-password');
  await page.getByRole('button', { name: 'Step into your workspace' }).click();
}
export const cloudSaved = (page: Page) =>
  expect(page.getByRole('button', { name: 'Saved to cloud', exact: true })).toBeVisible();
