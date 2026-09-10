import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { sendText } from '../src/send-text.js';

const require = createRequire(import.meta.url);
let LoadUtils;
try { ({ LoadUtils } = require('whatsapp-web.js/src/util/Injected/Utils.js')); } catch {}

for (const legacy of [false, true]) test(`actual pinned upstream send supports ${legacy ? 'legacy' : 'modern'} MsgKey offline`, { skip: !LoadUtils && 'Install dependencies or run inside the validation image' }, async () => {
  assert.equal(require('whatsapp-web.js/package.json').version, '1.34.7');
  const remote = { isLid: () => false, isGroup: () => false, isStatus: () => false, toString: () => 'recipient@c.us' };
  class MsgKey {
    constructor({ id, to }) {
      this.fromMe = true; this.remote = to; this.id = id; this.$1 = null;
      if (legacy) this._serialized = 'true_recipient@c.us_MESSAGEID';
    }
    static async newId() { return 'MESSAGEID'; }
  }
  let model, calls = 0;
  const modules = {
    WAWebChatGetters: { getIsNewsletter: () => false, getIsBroadcast: () => false },
    WALinkify: { findLink: () => null },
    WAWebUserPrefsMeUser: { getMaybeMeLidUser: () => remote, getMaybeMePnUser: () => remote },
    WAWebMsgKey: MsgKey,
    WAWebGetEphemeralFieldsMsgActionsUtils: { getEphemeralFields: () => ({}) },
    WAWebSendMsgChatAction: { addAndSendMsgToChat: (_chat, message) => {
      calls++; model = { id: message.id, ack: 2 };
      return [Promise.resolve(model), Promise.resolve()];
    } },
    WAWebCollections: { Msg: { get: key => key === model?.id || (legacy && key === model?.id._serialized) ? model : undefined } },
  };
  const window = { require: name => { if (!(name in modules)) throw Error('unexpected module'); return modules[name]; } };
  runInNewContext(`(${LoadUtils.toString()})()`, { window });
  window.WWebJS.getChat = async () => ({ id: remote });
  // Reproduce upstream false-negative with the exact shipped implementation.
  if (!legacy) assert.equal(await window.WWebJS.sendMessage({ id: remote }, 'test', { parseVCards: false }), undefined);
  const before = calls, original = window.WWebJS.sendMessage;
  window.WWebJS.getMessageModel = () => { throw Error('serializer must not run'); };
  const client = { pupPage: { evaluate: (fn, target, text) => runInNewContext(`(${fn.toString()})(target, text)`, { window, target, text }) } };
  await sendText(client, 'recipient@c.us', 'test');
  assert.equal(calls, before + 1);
  assert.equal(window.WWebJS.sendMessage, original);
});
