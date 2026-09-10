import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import whatsapp from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { createGateway, verifySelf } from './gateway.js';

const data = resolve(process.env.DATA_DIR || './data');
mkdirSync(data, { recursive: true, mode: 0o700 });
let state = 'starting', qrData = null, target = null, generation = 0;
const client = new whatsapp.Client({
  authStrategy: new whatsapp.LocalAuth({ dataPath: resolve(data, 'session') }),
  webVersionCache: { type: 'none' },
  puppeteer: { executablePath: process.env.CHROME_BIN || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] },
});
const reset = next => { generation++; state = next; target = null; qrData = null; };
client.on('qr', async value => {
  reset('qr'); const current = generation;
  try { const encoded = await QRCode.toDataURL(value); if (current === generation) qrData = encoded; }
  catch { reset('qr_error'); }
});
client.on('authenticated', () => reset('authenticated'));
client.on('auth_failure', () => reset('auth_failure'));
client.on('disconnected', () => reset('disconnected'));
client.on('ready', async () => {
  reset('verifying'); const current = generation;
  try {
    const verified = await verifySelf(client, process.env.ALLOWED_PHONE);
    if (current !== generation) return;
    // Compare canonical IDs returned by WhatsApp; never add/remove the Brazilian ninth digit ourselves.
    target = verified.target; state = verified.state;
  } catch { if (current === generation) reset('verification_failed'); }
});
const adapter = {
  status: () => ({ state, selfVerified: state === 'ready' && target !== null }),
  qr: async () => qrData,
  send: async message => {
    if (state !== 'ready' || !target || target !== client.info?.wid?._serialized) throw Error('not_ready');
    const sent = await client.sendMessage(target, message, { sendSeen: false, linkPreview: false });
    if (!sent?.id?._serialized) throw Error('unconfirmed');
  },
};
const gateway = createGateway({ token: process.env.GATEWAY_TOKEN, phone: process.env.ALLOWED_PHONE, dbPath: resolve(data, 'messages.sqlite'), adapter,
  ui: '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>DiModa · WhatsApp</title><h1>Vincular WhatsApp</h1><p>Use somente a conta destinatária. O token permanece apenas na memória desta página.</p><form><label>Token <input type="password" required autocomplete="off"></label><button>Entrar</button></form><button id="logout">Sair da interface</button><pre id="status">Aguardando autenticação</pre><img id="qr" alt="QR para vincular a conta" width="300"><script src="/ui.js"></script></html>' });
gateway.server.listen(3000, '0.0.0.0', () => { console.log('Gateway listening on port 3000'); });
client.initialize().catch(() => reset('initialization_failed'));
let stopping = false;
async function stop() {
  if (stopping) return; stopping = true;
  reset('stopping');
  const deadline = setTimeout(() => process.exit(1), 10000);
  await gateway.close();
  try { await client.destroy(); } catch {}
  clearTimeout(deadline); process.exit(0);
}
process.on('SIGTERM', stop); process.on('SIGINT', stop);
// Never print third-party exceptions: they can contain account/session details.
process.on('uncaughtException', () => { console.error('Gateway fatal error'); process.exit(1); });
process.on('unhandledRejection', () => { console.error('Gateway fatal error'); process.exit(1); });
