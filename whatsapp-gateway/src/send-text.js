function validId(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 512 && !/\s/.test(value);
}

export function hasMessageIdentifier(message) {
  const id = message?.id;
  return validId(id) || validId(id?._serialized) || (
    id?.fromMe === true && validId(id.id) && validId(id.remote) && /@(c\.us|lid)$/.test(id.remote)
  );
}

// A successful call without an identifiable result is still ambiguous. Do not
// search by body or retry: a previous/manual message could have the same text.
export async function sendText(client, target, message) {
  const sent = await client.pupPage.evaluate(sendTextInPage, target, message);
  if (!hasMessageIdentifier(sent)) throw Object.assign(Error('unconfirmed'), { code: 'GATEWAY_MISSING_MESSAGE_ID' });
}

// Compatibility with the pinned whatsapp-web.js 1.34.7: WhatsApp now exposes
// MsgKey as {fromMe, remote, id, $1}, with no _serialized. Preserve the upstream
// send implementation, changing only its final collection lookup in a local
// function. Never replace the global helper, catch-and-resend, or infer delivery.
export async function sendTextInPage(target, text) {
  const source = window.WWebJS.sendMessage.toString();
  const lookup = /\.Msg\s*\.get\(newMsgKey\._serialized\)/g;
  if ((source.match(lookup) || []).length !== 1) throw Error('gateway_send_compatibility_mismatch');
  const send = new Function(`return (${source.replace(lookup, '.Msg.get(newMsgKey._serialized || newMsgKey)')})`)();
  const chat = await window.WWebJS.getChat(target, { getAsModel: false });
  if (!chat) throw Error('gateway_recipient_unavailable');
  // Match Client.sendMessage's plain-text options. No sendSeen call, preview,
  // contacts, media, or arbitrary extra options are accepted by the API.
  const sent = await send(chat, text, { linkPreview: undefined, parseVCards: false, mentionedJidList: [], groupMentions: undefined, ignoreQuoteErrors: true, waitUntilMsgSent: true });
  const id = sent?.id;
  if (typeof id === 'string') return { id };
  if (typeof id?._serialized === 'string' && id._serialized) return { id: { _serialized: id._serialized } };
  const remote = typeof id?.remote === 'string' ? id.remote : id?.remote?.toString?.();
  // Return only the identity tuple; full getMessageModel/Message serialization
  // is unnecessary and can fail after the transport has already accepted text.
  return { id: { fromMe: id?.fromMe === true, remote: typeof remote === 'string' ? remote : null, id: typeof id?.id === 'string' ? id.id : null } };
}
