import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGateway, verifySelf } from '../src/gateway.js';
const token = randomBytes(32).toString('base64url');
const phone = '557591568274';
async function fixture(t, options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'wa-gateway-'));
  let sends = 0;
  const adapter = { status: () => ({ state: 'ready', selfVerified: true }), qr: async () => null, send: async () => { sends++; }, ...options.adapter };
  const dbPath = join(dir, 'messages.sqlite');
  let gateway;
  async function start() { gateway = createGateway({ token, phone, dbPath, adapter, ...options, adapter }); await new Promise(r => gateway.server.listen(0, '127.0.0.1', r)); }
  await start();
  t.after(async () => { await gateway.close(); rmSync(dir, { recursive: true, force: true }); });
  return {
    sends: () => sends,
    restart: async () => { await gateway.close(); await start(); },
    request: (path, init) => fetch(`http://127.0.0.1:${gateway.server.address().port}${path}`, init),
    post: (key = 'test-key-0001', body = { phone, message: 'Teste' }) => fetch(`http://127.0.0.1:${gateway.server.address().port}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(body) }),
  };
}
test('requires strong token', () => assert.throws(() => createGateway({ token: 'short' })));
test('WhatsApp resolution preserves input digits and only accepts the linked account', async () => {
  let queried;
  const client = { getNumberId: async number => { queried = number; return { _serialized: 'canonical@c.us' }; }, info: { wid: { _serialized: 'canonical@c.us' } } };
  assert.deepEqual(await verifySelf(client, '+55 75 9156-8274'), { state: 'ready', target: 'canonical@c.us' });
  assert.equal(queried, phone);
  client.info.wid._serialized = 'other@c.us';
  assert.equal((await verifySelf(client, phone)).state, 'account_mismatch');
  client.getNumberId = async () => null;
  assert.equal((await verifySelf(client, phone)).state, 'number_unresolved');
});
test('health discloses no session; status and QR require bearer; URL token rejected', async t => {
  const f = await fixture(t);
  assert.deepEqual(await (await f.request('/health')).json(), { ok: true });
  for (const url of ['/status', '/qr', `/status?token=${token}`, '/messages']) assert.equal((await f.request(url)).status, 401);
  assert.equal((await f.request('/status', { headers: { Authorization: `Bearer ${token}` } })).status, 200);
});
test('whitelist exact digits and message validation', async t => {
  const f = await fixture(t);
  assert.equal((await f.post('test-key-0001', { phone: '5575991568274', message: 'test' })).status, 403);
  assert.equal((await f.post('test-key-0001', { phone, message: 'x'.repeat(4097) })).status, 400);
  assert.equal((await f.post('bad')).status, 400);
  assert.equal(f.sends(), 0);
});
test('invalid authentication is rate-limited without locking out valid credentials', async t => {
  const f = await fixture(t);
  for (let i = 0; i < 20; i++) assert.equal((await f.request('/status')).status, 401);
  assert.equal((await f.request('/status')).status, 429);
  assert.equal((await f.request('/status', { headers: { Authorization: `Bearer ${token}` } })).status, 200);
});
test('concurrent retries send once, conflict is rejected, persistence survives restart', async t => {
  const f = await fixture(t);
  await Promise.all(Array.from({ length: 8 }, () => f.post()));
  assert.equal(f.sends(), 1);
  assert.equal((await f.post()).status, 200);
  assert.equal((await f.post('test-key-0001', { phone, message: 'changed' })).status, 409);
  await f.restart();
  assert.equal((await f.post()).status, 200);
  assert.equal(f.sends(), 1);
});
test('unverified account blocks all sending', async t => {
  const f = await fixture(t, { adapter: { status: () => ({ state: 'account_mismatch', selfVerified: false }) } });
  assert.equal((await f.post()).status, 503);
  assert.equal(f.sends(), 0);
});
test('send exception remains unknown across retry and restart', async t => {
  let sends = 0;
  const f = await fixture(t, { adapter: { send: async () => { sends++; throw Error('ambiguous'); } } });
  await f.post();
  assert.equal((await (await f.post()).json()).status, 'unknown');
  await f.restart();
  assert.equal((await (await f.post()).json()).status, 'unknown');
  assert.equal(sends, 1);
});
test('timeout never overlaps a second send and eventually records completion', async t => {
  const releases = []; let sends = 0;
  const f = await fixture(t, { timeoutMs: 10, adapter: { send: () => { sends++; return new Promise(r => releases.push(r)); } } });
  await f.post(); await f.post('test-key-0002');
  await new Promise(r => setTimeout(r, 30));
  assert.equal((await (await f.post()).json()).status, 'unknown');
  assert.equal(sends, 1);
  releases.shift()(); await new Promise(r => setTimeout(r, 5));
  assert.equal(sends, 2); releases.shift()();
  await new Promise(r => setTimeout(r, 5));
  assert.equal((await f.post()).status, 200);
});
test('rate limit does not block idempotent polling', async t => {
  const f = await fixture(t, { maxPerHour: 1 });
  await f.post();
  assert.equal((await f.post('test-key-0002')).status, 429);
  assert.equal((await f.post()).status, 200);
});
