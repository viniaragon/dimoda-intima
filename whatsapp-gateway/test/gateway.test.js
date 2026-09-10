import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGateway, verifyRecipient } from '../src/gateway.js';
const token = randomBytes(32).toString('base64url');
const phone = '557591568274';
async function fixture(t, options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'wa-gateway-'));
  let sends = 0;
  const adapter = { status: () => ({ state: 'ready', canSend: true }), qr: async () => null, send: async () => { sends++; }, ...options.adapter };
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
test('WhatsApp resolution preserves recipient digits and accepts a different authenticated sender', async () => {
  let queried;
  const client = { getNumberId: async number => { queried = number; return { _serialized: 'canonical@c.us' }; }, info: { wid: { _serialized: 'canonical@c.us' } } };
  assert.deepEqual(await verifyRecipient(client, '+55 75 9156-8274'), { state: 'ready', target: 'canonical@c.us' });
  assert.equal(queried, phone);
  client.info.wid._serialized = 'other@c.us';
  assert.deepEqual(await verifyRecipient(client, phone), { state: 'ready', target: 'canonical@c.us' });
  client.getNumberId = async () => null;
  assert.equal((await verifyRecipient(client, phone)).state, 'number_unresolved');
  client.info = undefined;
  assert.equal((await verifyRecipient(client, phone)).state, 'not_authenticated');
});
test('health discloses no session; status and QR require bearer; URL token rejected', async t => {
  const f = await fixture(t);
  assert.deepEqual(await (await f.request('/health')).json(), { ok: true });
  for (const url of ['/status', '/qr', `/status?token=${token}`, '/messages']) assert.equal((await f.request(url)).status, 401);
  assert.equal((await f.request('/status', { headers: { Authorization: `Bearer ${token}` } })).status, 200);
});
test('different sender can send to resolved whitelist recipient, never another destination', async t => {
  const sender = '5511999999999';
  const verified = await verifyRecipient({
    info: { wid: { _serialized: `${sender}@c.us` } },
    getNumberId: async number => { assert.equal(number, phone); return { _serialized: `${phone}@c.us` }; },
  }, phone);
  const sent = [];
  const f = await fixture(t, { adapter: {
    status: () => ({ state: verified.state, canSend: verified.state === 'ready' }),
    send: async message => sent.push({ target: verified.target, message }),
  } });
  assert.equal((await f.post()).status, 202);
  assert.equal((await f.post()).status, 200);
  assert.equal((await f.post('another-key', { phone: sender, message: 'blocked' })).status, 403);
  assert.deepEqual(sent, [{ target: `${phone}@c.us`, message: 'Teste' }]);
  const status = await (await f.request('/status', { headers: { Authorization: `Bearer ${token}` } })).json();
  assert.deepEqual(status, { state: 'ready', canSend: true });
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
test('unresolved recipient blocks all sending', async t => {
  const f = await fixture(t, { adapter: { status: () => ({ state: 'number_unresolved', canSend: false }) } });
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
