import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import whatsapp from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { createGateway, verifyRecipient } from './gateway.js';
import { diagnosticRecord } from './diagnostics.js';
import { sendText } from './send-text.js';

const report = (event, error) => console.error(JSON.stringify(diagnosticRecord(event, error)));

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
    const verified = await verifyRecipient(client, process.env.ALLOWED_PHONE);
    if (current !== generation) return;
    // Resolve only the configured recipient; the authenticated sender may be a different account.
    target = verified.target; state = verified.state;
  } catch (error) { report('verification_failed', error); if (current === generation) reset('verification_failed'); }
});
const adapter = {
  status: () => ({ state, canSend: state === 'ready' && target !== null && Boolean(client.info?.wid?._serialized) }),
  qr: async () => qrData,
  send: async message => {
    if (state !== 'ready' || !target || !client.info?.wid?._serialized) throw Error('not_ready');
    await sendText(client, target, message);
  },
};
const gateway = createGateway({ token: process.env.GATEWAY_TOKEN, phone: process.env.ALLOWED_PHONE, dbPath: resolve(data, 'messages.sqlite'), adapter, report,
  ui: '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>DiModa · WhatsApp</title><h1>Vincular WhatsApp</h1><p>Vincule sua conta remetente. Os avisos serão enviados somente ao destinatário autorizado. O token permanece apenas na memória desta página.</p><form><label>Token <input type="password" required autocomplete="off"></label><button>Entrar</button></form><button id="logout">Sair da interface</button><pre id="status">Aguardando autenticação</pre><img id="qr" alt="QR para vincular a conta" width="300"><script src="/ui.js"></script></html>' });
gateway.server.listen(3000, '0.0.0.0', () => { console.log('Gateway listening on port 3000'); });
client.initialize().catch(error => { report('initialization_failed', error); reset('initialization_failed'); });
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
process.on('uncaughtException', error => { report('uncaught_exception', error); process.exit(1); });
process.on('unhandledRejection', error => { report('unhandled_rejection', error); process.exit(1); });
