import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { hasMessageIdentifier, sendText } from '../src/send-text.js';

function pageFixture({ legacy = false, transport = Promise.resolve(), missing = false } = {}) {
  const remote = { toString: () => 'recipient@c.us' };
  const key = { fromMe: true, remote, id: 'MESSAGEID', $1: undefined };
  if (legacy) key._serialized = 'true_recipient@c.us_MESSAGEID';
  const sent = { id: key };
  const state = { calls: 0, key, transport, options: null };
  const collection = { Msg: { get: id => missing ? undefined : (id === key || (legacy && id === key._serialized)) ? sent : undefined } };
  const window = { state, require: () => collection, WWebJS: {
    getChat: async target => { assert.equal(target, 'recipient@c.us'); return { id: remote }; },
    getMessageModel: () => { throw Error('full serializer must not be called'); },
    sendMessage: async function (chat, content, options) {
      const newMsgKey = window.state.key;
      window.state.calls++;
      window.state.options = options;
      if (options.waitUntilMsgSent) await window.state.transport;
      return window.require('WAWebCollections').Msg.get(newMsgKey._serialized);
    },
  } };
  const original = window.WWebJS.sendMessage;
  return { state, window, original, client: { pupPage: { evaluate: (fn, target, text) => runInNewContext(`(${fn.toString()})(target, text)`, { window, target, text }) } } };
}

test('confirmation accepts string IDs and legacy serialized IDs', () => {
  assert.equal(hasMessageIdentifier({ id: 'true_recipient@c.us_MESSAGEID' }), true);
  assert.equal(hasMessageIdentifier({ id: { _serialized: 'true_recipient@c.us_MESSAGEID' } }), true);
  assert.equal(hasMessageIdentifier({ id: { fromMe: true, remote: 'recipient@c.us', id: 'MESSAGEID' } }), true);
});
test('empty, incomplete, or absent IDs remain unconfirmed', () => {
  for (const value of [undefined, null, {}, { id: '' }, { id: {} }, { id: { id: 'only-partial' } }, { id: { _serialized: '' } }, { id: '  ' }, { id: 123 }]) {
    assert.equal(hasMessageIdentifier(value), false);
  }
});
test('object MsgKey confirms by object lookup without changing global helper', async () => {
  const f = pageFixture();
  await sendText(f.client, 'recipient@c.us', 'test');
  assert.equal(f.state.calls, 1);
  assert.equal(f.window.WWebJS.sendMessage, f.original);
  assert.equal(f.state.options.waitUntilMsgSent, true);
  assert.equal(f.state.options.parseVCards, false);
  assert.equal(f.state.options.linkPreview, undefined);
});
test('legacy serialized lookup remains compatible', async () => {
  const f = pageFixture({ legacy: true });
  await sendText(f.client, 'recipient@c.us', 'test');
  assert.equal(f.state.calls, 1);
});
test('changed upstream helper fails closed before sending', async () => {
  const f = pageFixture();
  f.window.WWebJS.sendMessage = async () => { throw Error('must not run'); };
  await assert.rejects(sendText(f.client, 'recipient@c.us', 'test'), /gateway_send_compatibility_mismatch/);
  assert.equal(f.state.calls, 0);
});
test('confirmation waits for the transport promise', async () => {
  let release;
  const f = pageFixture({ transport: new Promise(resolve => { release = resolve; }) });
  let done = false;
  const result = sendText(f.client, 'recipient@c.us', 'test').then(() => { done = true; });
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(done, false);
  release(); await result;
  assert.equal(done, true);
});
test('unidentified result and rejection never trigger fallback or resend', async () => {
  const f = pageFixture({ missing: true });
  await assert.rejects(sendText(f.client, 'recipient@c.us', 'test'), { code: 'GATEWAY_MISSING_MESSAGE_ID' });
  assert.equal(f.state.calls, 1);
  const failure = Error('ambiguous');
  const client = { pupPage: { evaluate: async () => { throw failure; } } };
  await assert.rejects(sendText(client, 'recipient@c.us', 'test'), error => error === failure);
});
